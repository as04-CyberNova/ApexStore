import { PrismaClient, Role, OrderStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ApexStore database according to DATABASE.md & DESIGN.md...');

  // 1. Clean existing records (cascades handle children)
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users (Admin & Sample Customer)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@apexstore.com',
      fullName: 'Apex Administrator',
      role: Role.ADMIN,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$qwer1234$saltedhashdemo',
      phone: '+1-555-0100',
    },
  });

  const sampleCustomer = await prisma.user.create({
    data: {
      email: 'alex.vance@example.com',
      fullName: 'Alex Vance',
      role: Role.CUSTOMER,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$cust1234$saltedhashdemo',
      phone: '+1-555-0199',
      addresses: {
        create: [
          {
            fullName: 'Alex Vance',
            addressLine1: '742 Evergreen Terrace',
            addressLine2: 'Apt 4B',
            city: 'Portland',
            state: 'OR',
            postalCode: '97201',
            countryCode: 'US',
            phone: '+1-555-0199',
            isDefault: true,
          },
        ],
      },
    },
  });

  // 3. Seed Categories
  const apparel = await prisma.category.create({
    data: {
      name: 'Apparel',
      slug: 'apparel',
      description: 'Engineered minimalist garments crafted with premium technical fabrics.',
      displayOrder: 1,
      isActive: true,
    },
  });

  const footwear = await prisma.category.create({
    data: {
      name: 'Footwear',
      slug: 'footwear',
      description: 'Ergonomic luxury silhouettes built for effortless urban mobility.',
      displayOrder: 2,
      isActive: true,
    },
  });

  const accessories = await prisma.category.create({
    data: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Modular daily carry essentials and precision mechanical timepieces.',
      displayOrder: 3,
      isActive: true,
    },
  });

  const techLiving = await prisma.category.create({
    data: {
      name: 'Tech & Living',
      slug: 'tech-living',
      description: 'Refined desktop aesthetics and machined anodized aluminum artifacts.',
      displayOrder: 4,
      isActive: true,
    },
  });

  // 4. Seed Products, Images, Variants & Reviews

  // Product 1: Merino Wool Minimalist Overshirt
  const overshirt = await prisma.product.create({
    data: {
      categoryId: apparel.id,
      title: 'Merino Wool Minimalist Overshirt',
      slug: 'merino-wool-minimalist-overshirt',
      description:
        'Crafted from 100% fine Italian merino wool with a dense 280gsm twill weave. Naturally temperature-regulating, moisture-wicking, and wrinkle-resistant. Features custom matte horn buttons and concealed chest pocket tailoring.',
      basePrice: 245.0,
      salePrice: 195.0,
      isFeatured: true,
      isActive: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85',
            altText: 'Merino Wool Minimalist Overshirt in Charcoal Noir front view',
            isPrimary: true,
            sortOrder: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=85',
            altText: 'Merino Wool Minimalist Overshirt collar detail',
            isPrimary: false,
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'APX-OVR-BLK-S',
            size: 'S',
            color: 'Charcoal Noir',
            colorHex: '#18181b',
            stockCount: 12,
            isActive: true,
          },
          {
            sku: 'APX-OVR-BLK-M',
            size: 'M',
            color: 'Charcoal Noir',
            colorHex: '#18181b',
            stockCount: 4, // Scarcity badge testing (< 5)
            isActive: true,
          },
          {
            sku: 'APX-OVR-BLK-L',
            size: 'L',
            color: 'Charcoal Noir',
            colorHex: '#18181b',
            stockCount: 18,
            isActive: true,
          },
          {
            sku: 'APX-OVR-SGE-M',
            size: 'M',
            color: 'Subdued Sage',
            colorHex: '#52525b',
            stockCount: 9,
            isActive: true,
          },
        ],
      },
      reviews: {
        create: [
          {
            reviewerName: 'Marcus Sterling',
            rating: 5,
            comment:
              'The drape and hand-feel of the merino wool is exceptional. Substantial weight without overheating.',
            isVerified: true,
            userId: sampleCustomer.id,
          },
          {
            reviewerName: 'Elena Rostova',
            rating: 5,
            comment: 'Flawless tailoring. Fits true to size with just enough ease for layering.',
            isVerified: true,
          },
        ],
      },
    },
  });

  // Product 2: Aero Titanium Chronometer
  const chronometer = await prisma.product.create({
    data: {
      categoryId: accessories.id,
      title: 'Aero Titanium Chronometer',
      slug: 'aero-titanium-chronometer',
      description:
        'Grade 5 aerospace titanium monobloc casing measuring 39mm. Houses a high-beat automatic movement with 48 hours of power reserve. Anti-reflective sapphire crystal and vulcanized fluoroelastomer sport strap.',
      basePrice: 580.0,
      salePrice: null,
      isFeatured: true,
      isActive: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
            altText: 'Aero Titanium Chronometer face dial close-up',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'APX-WAT-TIT-OS',
            size: '39mm',
            color: 'Raw Matte Titanium',
            colorHex: '#27272a',
            stockCount: 3, // Scarcity alert (< 5 left)
            isActive: true,
          },
        ],
      },
      reviews: {
        create: [
          {
            reviewerName: 'Julian C.',
            rating: 5,
            comment: 'Understated luxury. Lightweight on wrist, and the sandblasted finish does not show micro-scratches.',
            isVerified: true,
          },
        ],
      },
    },
  });

  // Product 3: Modular Everyday Sling 8L
  const slingBag = await prisma.product.create({
    data: {
      categoryId: accessories.id,
      title: 'Modular Everyday Sling 8L',
      slug: 'modular-everyday-sling-8l',
      description:
        'Weatherproof X-Pac® VX21 composite exterior with YKK AquaGuard® zippers. Features magnetic Fidlock® V-buckle, internal padded iPad Mini sleeve, and ambidextrous quick-release stabilizer strap.',
      basePrice: 165.0,
      salePrice: 145.0,
      isFeatured: true,
      isActive: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
            altText: 'Modular Everyday Sling bag studio presentation',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'APX-SLG-BLK-8L',
            size: '8L',
            color: 'Stealth Black',
            colorHex: '#18181b',
            stockCount: 15,
            isActive: true,
          },
          {
            sku: 'APX-SLG-ALB-8L',
            size: '8L',
            color: 'Alpine Ice',
            colorHex: '#eff6ff',
            stockCount: 7,
            isActive: true,
          },
        ],
      },
    },
  });

  // Product 4: Low-Profile Monolith Trainer
  await prisma.product.create({
    data: {
      categoryId: footwear.id,
      title: 'Low-Profile Monolith Trainer',
      slug: 'low-profile-monolith-trainer',
      description:
        'Buttery full-grain calfskin leather upper with custom cupsole construction and molded anatomical insoles. Clean geometric panelling without exterior branding.',
      basePrice: 220.0,
      salePrice: null,
      isFeatured: false,
      isActive: true,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85',
            altText: 'Low-Profile Monolith Trainer lateral profile',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'APX-SHOE-WHT-41',
            size: 'EU 41',
            color: 'Alabaster White',
            colorHex: '#eff6ff',
            stockCount: 10,
            isActive: true,
          },
          {
            sku: 'APX-SHOE-WHT-42',
            size: 'EU 42',
            color: 'Alabaster White',
            colorHex: '#eff6ff',
            stockCount: 8,
            isActive: true,
          },
          {
            sku: 'APX-SHOE-WHT-43',
            size: 'EU 43',
            color: 'Alabaster White',
            colorHex: '#eff6ff',
            stockCount: 2, // Scarcity test (< 5)
            isActive: true,
          },
        ],
      },
    },
  });

  // 5. Seed Wishlist Item
  await prisma.wishlist.create({
    data: {
      userId: sampleCustomer.id,
      productId: chronometer.id,
    },
  });

  // 6. Seed Sample Fulfilled Order
  const overshirtVariant = await prisma.productVariant.findFirstOrThrow({
    where: { sku: 'APX-OVR-BLK-M' },
  });

  await prisma.order.create({
    data: {
      orderNumber: 'APX-98241',
      userId: sampleCustomer.id,
      customerEmail: 'alex.vance@example.com',
      customerName: 'Alex Vance',
      shippingAddress: {
        fullName: 'Alex Vance',
        addressLine1: '742 Evergreen Terrace',
        addressLine2: 'Apt 4B',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        countryCode: 'US',
        phone: '+1-555-0199',
      },
      shippingMethod: 'Express',
      subtotal: 195.0,
      taxAmount: 15.6,
      shippingAmount: 15.0,
      discountAmount: 0.0,
      totalAmount: 225.6,
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.SUCCEEDED,
      paymentIntentId: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
      trackingNumber: '1Z9999999999999999',
      items: {
        create: [
          {
            variantId: overshirtVariant.id,
            productId: overshirt.id,
            titleSnapshot: 'Merino Wool Minimalist Overshirt',
            skuSnapshot: 'APX-OVR-BLK-M',
            variantOptions: 'Size: M, Color: Charcoal Noir',
            quantity: 1,
            unitPrice: 195.0,
            totalPrice: 195.0,
          },
        ],
      },
    },
  });

  console.log('✅ ApexStore database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
