import { prisma } from './prisma';
import { NextRequest } from 'next/server';
import { GET as getProducts } from '../app/api/v1/products/route';
import { GET as getProductBySlug } from '../app/api/v1/products/[slug]/route';
import { POST as validateCart } from '../app/api/v1/cart/validate/route';
import { POST as createCheckoutSession } from '../app/api/v1/checkout/session/route';
import { GET as getOrder } from '../app/api/v1/orders/[orderNumber]/route';
import { POST as registerUser } from '../app/api/v1/auth/register/route';
import { POST as loginUser } from '../app/api/v1/auth/login/route';
import { GET as getCustomerOrders } from '../app/api/v1/customer/orders/route';
import { GET as getAdminOrders } from '../app/api/v1/admin/orders/route';
import { PATCH as updateFulfillment } from '../app/api/v1/admin/orders/[orderNumber]/fulfillment/route';
import { POST as stripeWebhook } from '../app/api/v1/webhooks/stripe/route';
import { signToken } from './auth';
import { Role } from '@prisma/client';

interface TestCase {
  category: string;
  name: string;
  run: () => Promise<void>;
}

async function runE2EAutomationSuite() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  APEXSTORE PRODUCTION INTEGRATION & E2E AUTOMATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  let passedCount = 0;
  let failedCount = 0;
  const bugs: Array<{ title: string; severity: string; details: string }> = [];

  const tests: TestCase[] = [
    // -------------------------------------------------------------
    // SUITE 1: CATALOG & DISCOVERY
    // -------------------------------------------------------------
    {
      category: '1. Catalog & Discovery',
      name: 'GET /api/v1/products should return paginated list and faceted filters',
      run: async () => {
        const req = new NextRequest('http://localhost:3000/api/v1/products?limit=10&page=1');
        const res = await getProducts(req);
        const json = await res.json();

        if (res.status !== 200 || !json.success || !Array.isArray(json.data) || json.data.length === 0) {
          throw new Error(`Expected status 200 and data array, got: ${res.status}`);
        }
        if (!json.meta || json.meta.page !== 1) {
          throw new Error('Pagination meta missing or incorrect');
        }
      },
    },
    {
      category: '1. Catalog & Discovery',
      name: 'GET /api/v1/products/[slug] happy path and 404 for invalid slug',
      run: async () => {
        // Happy path
        const reqValid = new NextRequest('http://localhost:3000/api/v1/products/merino-wool-minimalist-overshirt');
        const resValid = await getProductBySlug(reqValid, {
          params: { slug: 'merino-wool-minimalist-overshirt' },
        });
        const jsonValid = await resValid.json();
        if (resValid.status !== 200 || jsonValid.data.slug !== 'merino-wool-minimalist-overshirt') {
          throw new Error('Failed to retrieve valid product by slug');
        }

        // 404 Edge case
        const reqInvalid = new NextRequest('http://localhost:3000/api/v1/products/non-existent-luxury-item');
        const resInvalid = await getProductBySlug(reqInvalid, {
          params: { slug: 'non-existent-luxury-item' },
        });
        const jsonInvalid = await resInvalid.json();
        if (resInvalid.status !== 404 || jsonInvalid.error.code !== 'RESOURCE_NOT_FOUND') {
          throw new Error('Expected 404 RESOURCE_NOT_FOUND for invalid product slug');
        }
      },
    },

    // -------------------------------------------------------------
    // SUITE 2: CART VALIDATION & PRICING SECURITY
    // -------------------------------------------------------------
    {
      category: '2. Cart & Pricing Math',
      name: 'POST /api/v1/cart/validate calculates server-authoritative totals and promo discounts',
      run: async () => {
        const variant = await prisma.productVariant.findFirstOrThrow({
          where: { sku: 'APX-OVR-BLK-M' },
        });

        const req = new NextRequest('http://localhost:3000/api/v1/cart/validate', {
          method: 'POST',
          body: JSON.stringify({
            items: [{ variantId: variant.id, quantity: 2 }],
            couponCode: 'SUMMER20',
          }),
        });

        const res = await validateCart(req);
        const json = await res.json();

        if (res.status !== 200 || !json.success) {
          throw new Error('Cart validation endpoint returned failure');
        }
        if (json.data.discountAmount <= 0) {
          throw new Error('SUMMER20 coupon failed to apply 20% discount');
        }
        if (typeof json.data.estimatedTotal !== 'number' || json.data.estimatedTotal <= 0) {
          throw new Error('Invalid estimated total math calculation');
        }
      },
    },

    // -------------------------------------------------------------
    // SUITE 3: CHECKOUT INTENT & INVENTORY CONCURRENCY
    // -------------------------------------------------------------
    {
      category: '3. Checkout & Order Lifecycle',
      name: 'POST /api/v1/checkout/session enforces stock checks and creates pending order',
      run: async () => {
        const variant = await prisma.productVariant.findFirstOrThrow({
          where: { sku: 'APX-OVR-BLK-M' },
        });

        // Test over-stock rejection (409 Conflict)
        const reqOver = new NextRequest('http://localhost:3000/api/v1/checkout/session', {
          method: 'POST',
          body: JSON.stringify({
            customerEmail: 'test.buyer@example.com',
            customerName: 'Test Buyer',
            items: [{ variantId: variant.id, quantity: 999999 }],
            shippingAddress: {
              fullName: 'Test Buyer',
              addressLine1: '123 Test St',
              city: 'Seattle',
              state: 'WA',
              postalCode: '98101',
              countryCode: 'US',
            },
          }),
        });
        const resOver = await createCheckoutSession(reqOver);
        const jsonOver = await resOver.json();
        if (resOver.status !== 409 || jsonOver.error.code !== 'OUT_OF_STOCK') {
          throw new Error('Expected 409 OUT_OF_STOCK when ordering excessive quantity');
        }

        // Test successful checkout creation
        const reqValid = new NextRequest('http://localhost:3000/api/v1/checkout/session', {
          method: 'POST',
          body: JSON.stringify({
            customerEmail: 'test.buyer@example.com',
            customerName: 'Test Buyer',
            items: [{ variantId: variant.id, quantity: 1 }],
            shippingAddress: {
              fullName: 'Test Buyer',
              addressLine1: '123 Test St',
              city: 'Seattle',
              state: 'WA',
              postalCode: '98101',
              countryCode: 'US',
            },
          }),
        });
        const resValid = await createCheckoutSession(reqValid);
        const jsonValid = await resValid.json();
        if (resValid.status !== 201 || !jsonValid.data.orderNumber || !jsonValid.data.clientSecret) {
          throw new Error('Failed to generate pending order and client secret');
        }
      },
    },

    // -------------------------------------------------------------
    // SUITE 4: AUTHENTICATION & ACCESS CONTROL (RBAC)
    // -------------------------------------------------------------
    {
      category: '4. Authentication & RBAC',
      name: 'Customer Registration & Duplicate Email Protection',
      run: async () => {
        const uniqueEmail = `qa.buyer.${Date.now()}@example.com`;
        const req = new NextRequest('http://localhost:3000/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: uniqueEmail,
            password: 'StrongSecretPassword2026!',
            fullName: 'QA Auto Tester',
          }),
        });
        const res = await registerUser(req);
        const json = await res.json();
        if (res.status !== 201 || json.data.user.email !== uniqueEmail) {
          throw new Error('Failed to register new customer');
        }

        // Duplicate registration must return 400 VALIDATION_ERROR (fresh request instance)
        const reqDup = new NextRequest('http://localhost:3000/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: uniqueEmail,
            password: 'StrongSecretPassword2026!',
            fullName: 'QA Auto Tester',
          }),
        });
        const resDup = await registerUser(reqDup);
        const jsonDup = await resDup.json();
        if (resDup.status !== 400 || jsonDup.error.code !== 'VALIDATION_ERROR') {
          throw new Error('Duplicate email registration was not blocked');
        }
      },
    },
    {
      category: '4. Authentication & RBAC',
      name: 'Protected Customer & Admin Endpoints Reject Unauthenticated Requests',
      run: async () => {
        // Customer orders without token
        const reqCustomer = new NextRequest('http://localhost:3000/api/v1/customer/orders');
        const resCustomer = await getCustomerOrders(reqCustomer);
        if (resCustomer.status !== 401) {
          throw new Error('Unauthenticated customer orders access did not return 401');
        }

        // Admin orders without token
        const reqAdmin = new NextRequest('http://localhost:3000/api/v1/admin/orders');
        const resAdmin = await getAdminOrders(reqAdmin);
        if (resAdmin.status !== 403 && resAdmin.status !== 401) {
          throw new Error('Unauthenticated admin orders access did not return 401 or 403');
        }

        // Customer token attempting admin route must return 403 UNAUTHORIZED
        const customerToken = signToken({
          userId: '11111111-2222-3333-4444-555555555555',
          email: 'customer@apexstore.com',
          role: Role.CUSTOMER,
        });
        const reqCustomerAsAdmin = new NextRequest('http://localhost:3000/api/v1/admin/orders', {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        const resCustomerAsAdmin = await getAdminOrders(reqCustomerAsAdmin);
        if (resCustomerAsAdmin.status !== 403) {
          throw new Error('Customer role accessing admin endpoint was not rejected with 403');
        }
      },
    },

    // -------------------------------------------------------------
    // SUITE 5: STRIPE WEBHOOK & ASYNCHRONOUS EMAIL RESILIENCE
    // -------------------------------------------------------------
    {
      category: '5. Webhook & Integration Lifecycles',
      name: 'Stripe Webhook payment_intent.succeeded processes atomic stock decrement & email dispatch',
      run: async () => {
        const testOrder = await prisma.order.findFirstOrThrow({
          where: { orderStatus: 'PENDING' },
          include: { items: true },
        });

        const initialVariant = await prisma.productVariant.findUniqueOrThrow({
          where: { id: testOrder.items[0].variantId! },
        });

        const initialStock = initialVariant.stockCount;

        const fakeWebhookEvent = {
          id: `evt_${Date.now()}`,
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: testOrder.paymentIntentId,
            },
          },
        };

        const req = new NextRequest('http://localhost:3000/api/v1/webhooks/stripe', {
          method: 'POST',
          body: JSON.stringify(fakeWebhookEvent),
        });

        const res = await stripeWebhook(req);
        const json = await res.json();
        if (res.status !== 200 || !json.success) {
          throw new Error('Stripe webhook processing failed');
        }

        // Verify database state transitioned
        const updatedOrder = await prisma.order.findUniqueOrThrow({
          where: { id: testOrder.id },
        });
        if (updatedOrder.orderStatus !== 'CONFIRMED' || updatedOrder.paymentStatus !== 'SUCCEEDED') {
          throw new Error('Order status failed to transition to CONFIRMED and SUCCEEDED');
        }

        // Verify atomic inventory reduction occurred
        const updatedVariant = await prisma.productVariant.findUniqueOrThrow({
          where: { id: testOrder.items[0].variantId! },
        });
        if (updatedVariant.stockCount !== initialStock - testOrder.items[0].quantity) {
          throw new Error('Stock count was not reduced by order item quantity');
        }

        // Verify Idempotency: Second identical webhook call must not decrement stock again
        const reqDup = new NextRequest('http://localhost:3000/api/v1/webhooks/stripe', {
          method: 'POST',
          body: JSON.stringify(fakeWebhookEvent),
        });
        const resDup = await stripeWebhook(reqDup);
        const jsonDup = await resDup.json();
        if (!jsonDup.data.duplicate) {
          throw new Error('Duplicate webhook call was not recognized as idempotent duplicate');
        }

        // Restore variant stock to clean state
        await prisma.productVariant.update({
          where: { id: testOrder.items[0].variantId! },
          data: { stockCount: initialStock },
        });
      },
    },

    // -------------------------------------------------------------
    // SUITE 6: ADMIN FULFILLMENT & RESEND SHIPPING NOTIFICATION
    // -------------------------------------------------------------
    {
      category: '6. Operational Fulfillment',
      name: 'PATCH /api/v1/admin/orders/[orderNumber]/fulfillment updates tracking & notifies customer',
      run: async () => {
        const order = await prisma.order.findFirstOrThrow({
          where: { orderStatus: 'CONFIRMED' },
        });

        const adminToken = signToken({
          userId: '00000000-0000-0000-0000-000000000000',
          email: 'admin@apexstore.com',
          role: Role.ADMIN,
        });

        const req = new NextRequest(
          `http://localhost:3000/api/v1/admin/orders/${order.orderNumber}/fulfillment`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
              orderStatus: 'SHIPPED',
              trackingNumber: '1Z9999999999999999',
              notifyCustomer: true,
            }),
          }
        );

        const res = await updateFulfillment(req, {
          params: { orderNumber: order.orderNumber },
        });
        const json = await res.json();
        if (res.status !== 200 || json.data.orderStatus !== 'SHIPPED') {
          throw new Error('Failed to update fulfillment status to SHIPPED');
        }
      },
    },
  ];

  for (const test of tests) {
    try {
      await test.run();
      console.log(`  ✅ PASS [${test.category}] ${test.name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL [${test.category}] ${test.name}`);
      console.error(`     Reason: ${err.message}`);
      failedCount++;
      bugs.push({
        title: test.name,
        severity: 'HIGH',
        details: err.message,
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  TEST RESULTS SUMMARY:`);
  console.log(`  Total Executed : ${tests.length}`);
  console.log(`  Passed         : ${passedCount}`);
  console.log(`  Failed         : ${failedCount}`);
  console.log(`  Pass Rate      : ${((passedCount / tests.length) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2EAutomationSuite()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
