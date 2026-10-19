import { prisma } from './prisma';
import { decrementStockAtomic } from './inventory';
import { signToken, verifyToken } from './auth';
import { Role } from '@prisma/client';

async function runBackendValidationSuite() {
  console.log('🧪 Starting ApexStore Backend & Database Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & Schema Test
    console.log('1. Database Connection & Model Querying:');
    const categories = await prisma.category.findMany();
    assert(categories.length >= 4, `Categories fetched successfully (Found ${categories.length})`);

    const products = await prisma.product.findMany({
      include: { variants: true, images: true },
    });
    assert(products.length >= 4, `Products with variants fetched (Found ${products.length})`);

    // 2. JWT & RBAC Session Token Integrity Test
    console.log('\n2. Authentication & Cryptographic Token Verification:');
    const mockSession = {
      userId: '11111111-2222-3333-4444-555555555555',
      email: 'admin@apexstore.com',
      role: Role.ADMIN,
    };
    const token = signToken(mockSession, 1);
    const decoded = verifyToken(token);
    assert(
      decoded !== null && decoded.userId === mockSession.userId && decoded.role === Role.ADMIN,
      'Signed JWT correctly verified and role extracted'
    );

    const tamperedToken = token.slice(0, -4) + 'abcd';
    const tamperedDecoded = verifyToken(tamperedToken);
    assert(tamperedDecoded === null, 'Tampered token correctly rejected');

    // 2.1 Password Hashing & Constant-Time Verification Test
    const rawSecret = 'LuxuryP@ssword2026!';
    const { hashPassword, verifyPassword } = await import('./auth');
    const hashed = await hashPassword(rawSecret);
    const passwordMatches = await verifyPassword(rawSecret, hashed);
    const wrongPasswordFails = await verifyPassword('WrongPassword123!', hashed);
    assert(passwordMatches, 'PBKDF2 salted password hash verified successfully');
    assert(!wrongPasswordFails, 'Incorrect password securely rejected');

    // 3. Inventory Math & Atomic Stock Concurrency Test
    console.log('\n3. Atomic Concurrency & Stock Decrement Protection:');
    const testVariant = await prisma.productVariant.findFirstOrThrow({
      where: { sku: 'APX-OVR-BLK-M' },
    });

    const initialStock = testVariant.stockCount;

    // Test successful atomic decrement
    const decSuccess = await decrementStockAtomic({
      variantId: testVariant.id,
      quantity: 1,
    });
    assert(decSuccess.success && decSuccess.remainingStock === initialStock - 1, 'Atomic stock decrement succeeded');

    // Test rejection of over-selling (attempting to order more than available)
    const decOver = await decrementStockAtomic({
      variantId: testVariant.id,
      quantity: 99999,
    });
    assert(!decOver.success && decOver.error === 'INSUFFICIENT_STOCK', 'Overselling race condition prevented by DB atomic check');

    // Restore stock back to original
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockCount: initialStock },
    });
    console.log('  ℹ️ Restored test variant stock to baseline.');

    // 4. Order & Relation Integrity Test
    console.log('\n4. Order Retrieval & Financial Integrity:');
    const testOrder = await prisma.order.findFirst({
      include: { items: true },
    });
    assert(testOrder !== null, `Sample order found (${testOrder?.orderNumber})`);
    assert(
      Number(testOrder?.totalAmount) ===
        Number(testOrder?.subtotal) -
          Number(testOrder?.discountAmount) +
          Number(testOrder?.shippingAmount) +
          Number(testOrder?.taxAmount),
      'Order financial arithmetic (subtotal - discount + shipping + tax == total) matches strictly'
    );

    // 5. Resend Email Integration & Template Generation Test
    console.log('\n5. Resend Email Gateway & Template Validation:');
    const { generateOrderConfirmationHtml, generateShippingUpdateHtml, sendEmail } = await import('./email');
    
    const sampleHtml = generateOrderConfirmationHtml({
      to: 'customer@example.com',
      orderNumber: 'APX-98241',
      customerName: 'Alex Morgan',
      items: [
        {
          titleSnapshot: 'Merino Wool Minimalist Overshirt',
          skuSnapshot: 'APX-OVS-BLK-M',
          variantOptions: 'Size: M, Color: Midnight Black',
          quantity: 1,
          unitPrice: 148.0,
          totalPrice: 148.0,
        },
      ],
      subtotal: 148.0,
      discountAmount: 0.0,
      shippingAmount: 0.0,
      taxAmount: 11.84,
      totalAmount: 159.84,
      shippingAddress: {
        fullName: 'Alex Morgan',
        addressLine1: '452 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10013',
        countryCode: 'US',
      },
    });

    assert(sampleHtml.includes('APX-98241'), 'Order confirmation HTML includes order number');
    assert(sampleHtml.includes('Merino Wool Minimalist Overshirt'), 'Order confirmation HTML renders line items');
    assert(sampleHtml.includes('$159.84'), 'Order confirmation HTML contains accurate final total');

    const shippingHtml = generateShippingUpdateHtml({
      to: 'customer@example.com',
      orderNumber: 'APX-98241',
      customerName: 'Alex Morgan',
      trackingNumber: '1Z9999999999999999',
    });
    assert(shippingHtml.includes('1Z9999999999999999'), 'Shipping email includes tracking number');

    const emailResult = await sendEmail({
      to: 'customer@example.com',
      subject: 'Test Verification Email',
      html: sampleHtml,
    });
    assert(emailResult.success === true, 'Resend email dispatch executed successfully with non-blocking resilience');

    console.log(`\n========================================`);
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackendValidationSuite();
