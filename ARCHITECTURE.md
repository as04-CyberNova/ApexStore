# Technical Architecture Document (ARCHITECTURE.md)

# ApexStore: Next-Generation Direct-to-Consumer (D2C) E-Commerce Platform

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline & System Specification  
**Companion Documents:** [PRD.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/AcademIQ/PRD.md), [DESIGN.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/AcademIQ/DESIGN.md)  

---

## 1. Architectural Principles & Strategy

The architecture for ApexStore prioritizes **high conversion velocity, sub-second product navigation, transactional data integrity, and operational simplicity**.

* **Static-First with Dynamic Hydration (Jamstack / Edge-Rendered):** Product catalogs, categories, and landing pages are pre-rendered at the edge for instant FCP ($< 0.8\text{s}$) and optimal SEO indexing. Dynamic capabilities (cart, real-time inventory checks, checkout sessions) hydrate seamlessly via client-side state and edge APIs.
* **Optimistic UI with Transactional Guarantees:** Cart additions and variant toggles execute instantly in the client UI, while payment capture and inventory decrement rely on strict ACID transactions.
* **PCI-DSS Compliance via Isolation:** All payment card data is captured via tokenized hosted iframes / SDKs (Stripe Elements / PayPal SDK). Zero raw card data touches the application servers or databases.
* **Separation of MVP from Scalability:** The MVP utilizes a modular monolithic backend or serverless edge layer with an embedded/relational database (PostgreSQL / SQLite via Prisma), avoiding premature microservice fragmentation.

---

## 2. Recommended Tech Stack & Justification

| Layer | Recommended Technology | Justification & Trade-offs |
|---|---|---|
| **Frontend Framework** | **Next.js (App Router) or Vite + React (TypeScript)** | Server-side rendering (SSR) / Static Site Generation (SSG) for SEO on product and catalog pages; client components for interactive cart, filters, and checkout. |
| **Styling & Design System** | **Vanilla CSS Modules / CSS Variables** (aligned with [DESIGN.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/AcademIQ/DESIGN.md)) | Zero CSS-in-JS runtime overhead. Full native control over 8pt spatial tokens, fluid typography, dark mode tokens, and hardware-accelerated drawer transitions. |
| **State Management** | **Zustand (with `persist` middleware)** | Lightweight ($< 3\text{kB}$), zero boilerplate. Manages global cart items, slide-over drawer visibility, wishlist, and filter queries with automatic `localStorage` synchronization. |
| **Database & ORM** | **PostgreSQL** + **Prisma ORM** | ACID compliance for order processing and inventory integrity. Prisma provides end-to-end type safety from database models to frontend components. |
| **Backend API Layer** | **Next.js Route Handlers** or **FastAPI / Node.js Express** | Clean RESTful endpoints for catalog queries, cart validation, order creation, and webhook ingestion. |
| **Payment Gateway** | **Stripe (Elements & Webhooks)** | Industry standard for secure 1-click Apple Pay, Google Pay, credit cards, and robust webhook fulfillment handling. |
| **Media & Asset CDN** | **Cloudinary** or **AWS S3 + CloudFront** | Automated WebP/AVIF format conversion, dynamic responsive image resizing (`f_auto,q_auto`), and global edge caching. |
| **Hosting & Edge Delivery** | **Vercel / Cloudflare Pages + Neon/Supabase PostgreSQL** | Instant global edge CDN distribution, serverless compute, automated branch preview deployments, and elastic PostgreSQL pooling. |

---

## 3. High-Level System Architecture

```mermaid
graph TD
    subgraph Client [Browser / Mobile Client]
        StorefrontUI[Next.js / React UI Storefront]
        CartState[Zustand Cart & Wishlist State]
        StripeElements[Stripe Embedded Payment SDK]
    end

    subgraph EdgeCDN [Edge CDN & Static Delivery]
        EdgeCache[Edge Global Cache: Pages & Assets]
        CloudinaryMedia[Optimized Product Media CDN]
    end

    subgraph AppServer [Application & API Layer]
        APIRoutes["/api/products, /api/cart, /api/checkout"]
        WebhookHandler["/api/webhooks/stripe"]
        AuthMiddleware[Session & Token Validation]
    end

    subgraph DataLayer [Transactional Storage]
        PostgresDB[(PostgreSQL Primary DB)]
        Prisma[Prisma ORM Layer]
    end

    subgraph ExternalGateways [Third-Party Services]
        StripeGateway[Stripe Payment Engine]
        EmailGateway[Resend / Postmark Order Receipts]
        CourierAPI[Shipping / Tracking Provider]
    end

    Client -->|HTTP/3 Static & Media Fetch| EdgeCDN
    StorefrontUI -->|Dynamic State Sync| CartState
    CartState -->|POST /api/checkout| APIRoutes
    APIRoutes --> AuthMiddleware
    AuthMiddleware --> Prisma
    Prisma --> PostgresDB
    StorefrontUI -->|Tokenize Card| StripeElements
    StripeElements --> StripeGateway
    StripeGateway -->|Webhook: payment_intent.succeeded| WebhookHandler
    WebhookHandler --> Prisma
    WebhookHandler -->|Trigger Confirmation Email| EmailGateway
    WebhookHandler -->|Generate Label / Tracking| CourierAPI
```

---

## 4. Frontend Architecture & Component Hierarchy

### 4.1 Component Tree Architecture

```
App Shell (Root)
│
├── Header & Global Navigation
│   ├── PromoAnnouncementBar (Free shipping ticker)
│   ├── StickyNavbar
│   │   ├── BrandLogo
│   │   ├── CategoryNavLinks (New Arrivals, Apparel, Tech, Sale)
│   │   ├── InstantSearchBar (Debounced autocomplete)
│   │   └── ActionButtons (CurrencySelector, WishlistBadge, UserMenu, CartTriggerBadge)
│   └── MobileNavigationDrawer
│
├── SlideOverCartDrawer (Global Overlay)
│   ├── FreeShippingProgressBar
│   ├── CartItemList
│   │   └── CartItemRow (Thumbnail, Variant tags, QuantityController, RemoveButton)
│   ├── CrossSellProductRail
│   └── CartSummaryFooter (Subtotal, CouponInput, CheckoutButton)
│
├── Main Viewport (<main>)
│   ├── HomeView
│   │   ├── HeroBannerCampaign
│   │   ├── ValuePropsGrid (Shipping, Guarantee, Support)
│   │   ├── FeaturedCollectionGrid
│   │   └── TrendingProductCarousel
│   │
│   ├── CatalogListingView (PLP)
│   │   ├── FilterSidebar / MobileFilterDrawer (Categories, PriceSlider, Sizes, Ratings)
│   │   ├── ActiveFilterPillGroup
│   │   ├── SortSelectDropdown (Price, Rating, Newest)
│   │   └── ProductGrid
│   │       └── ProductCard (ImageSwapper, QuickAdd, WishlistHeart, PriceTag)
│   │
│   ├── ProductDetailView (PDP)
│   │   ├── BreadcrumbTrail
│   │   ├── MediaGallery (ThumbnailRail, MainZoomView, MobileSwipeDots)
│   │   └── PurchasingPanel
│   │       ├── ProductHeader (Title, SKU, Price, RatingSummary)
│   │       ├── VariantSelector (ColorSwatches, SizePills with stock status)
│   │       ├── StockScarcityBanner ("Only 3 left in stock")
│   │       ├── QuantitySelector & AddToCartCTA
│   │       ├── BuyNowOneClickCTA
│   │       └── InfoAccordions (Description, Specs, Shipping, Care)
│   │
│   └── CheckoutView (2-Step Minimal Flow)
│       ├── CheckoutProgressIndicator
│       ├── Step1_ShippingForm (Address autocomplete, contact email)
│       ├── Step2_PaymentMethod (Stripe Card Element / Wallets)
│       └── StickyOrderSummary (Itemized list, tax calculation, total)
│
├── QuickViewModal (Instant PDP preview without leaving PLP)
└── SiteFooter (NewsletterSignup, TrustBadges, LegalLinks, Copyright)
```

---

## 5. Folder Structure

```
apex-store/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── assets/
│       ├── brand/                     # SVG logos and icons
│       └── placeholders/              # Modern skeleton SVGs
├── prisma/
│   ├── schema.prisma                  # Data models and relations
│   └── migrations/                    # Versioned SQL migrations
├── src/
│   ├── app/                           # Next.js App Router (or Pages)
│   │   ├── layout.tsx                 # Root layout, fonts, meta tags
│   │   ├── page.tsx                   # Home landing page
│   │   ├── catalog/
│   │   │   ├── page.tsx               # Product Listing Page (PLP)
│   │   │   └── [category]/page.tsx
│   │   ├── product/
│   │   │   └── [slug]/page.tsx        # Product Detail Page (PDP)
│   │   ├── checkout/
│   │   │   ├── page.tsx               # Checkout flow
│   │   │   └── confirmation/page.tsx  # Post-purchase receipt
│   │   └── api/                       # API route handlers
│   │       ├── products/route.ts
│   │       ├── cart/validate/route.ts
│   │       ├── checkout/session/route.ts
│   │       └── webhooks/stripe/route.ts
│   ├── components/
│   │   ├── common/                    # Generic atoms
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/                    # Global wrappers
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AnnouncementBar.tsx
│   │   ├── cart/                      # Cart drawer & items
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── FreeShippingBar.tsx
│   │   ├── catalog/                   # PLP components
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── FilterSidebar.tsx
│   │   └── product/                   # PDP components
│   │       ├── MediaGallery.tsx
│   │       ├── VariantSelector.tsx
│   │       └── ReviewList.tsx
│   ├── lib/                           # Core utilities & singleton clients
│   │   ├── prisma.ts                  # Prisma database client
│   │   ├── stripe.ts                  # Stripe backend instance
│   │   └── email.ts                   # Transactional email dispatcher
│   ├── store/                         # Client-side state stores
│   │   ├── useCartStore.ts            # Zustand Cart store (persisted)
│   │   └── useWishlistStore.ts        # Zustand Wishlist store (persisted)
│   ├── styles/                        # CSS modules & tokens
│   │   ├── tokens.css                 # Color tokens from DESIGN.md
│   │   ├── globals.css                # Base reset & typography
│   │   └── components/                # Modular CSS files
│   └── types/                         # Strongly-typed domain models
│       ├── product.ts
│       ├── cart.ts
│       ├── order.ts
│       └── checkout.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 6. Data Architecture & Database Models (Prisma Schema)

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ PRODUCT_IMAGE : displays
    PRODUCT ||--o{ REVIEW : receives
    
    ORDER ||--o{ ORDER_ITEM : includes
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : "ordered as"
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
```

### 6.1 Database Entities (PostgreSQL via Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  role          Role      @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  orders        Order[]
  reviews       Review[]
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  products    Product[]
}

model Product {
  id          String           @id @default(cuid())
  title       String
  slug        String           @unique
  description String
  price       Decimal          @db.Decimal(10, 2)
  salePrice   Decimal?         @db.Decimal(10, 2)
  isFeatured  Boolean          @default(false)
  categoryId  String
  category    Category         @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  variants    ProductVariant[]
  reviews     Review[]
  createdAt   DateTime         @default(now())
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  altText   String
  isPrimary Boolean  @default(false)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductVariant {
  id          String      @id @default(cuid())
  productId   String
  product     Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String      @unique
  size        String?     // e.g. "S", "M", "L"
  color       String?     // e.g. "Midnight Black", "Sage"
  stockCount  Int         @default(0)
  orderItems  OrderItem[]
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique // e.g. "APX-98241"
  userId          String?
  user            User?       @relation(fields: [userId], references: [id])
  customerEmail   String
  customerName    String
  shippingAddress Json
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  status          OrderStatus @default(PENDING)
  paymentIntentId String?     @unique
  items           OrderItem[]
  createdAt       DateTime    @default(now())
}

model OrderItem {
  id          String         @id @default(cuid())
  orderId     String
  order       Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  quantity    Int
  unitPrice   Decimal        @db.Decimal(10, 2)
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  author    String
  rating    Int      // 1 to 5
  comment   String
  createdAt DateTime @default(now())
}
```

---

## 7. API Architecture & Checkout Data Flow

### 7.1 Key Endpoints

| Endpoint | Method | Purpose | Auth Level |
|---|---|---|---|
| `/api/products` | `GET` | Filtered, sorted & paginated catalog retrieval | Public |
| `/api/products/[slug]` | `GET` | Detailed product data with variants and media | Public |
| `/api/cart/validate` | `POST` | Check live stock counts & prices before checkout | Public |
| `/api/checkout/create-intent` | `POST` | Create Stripe PaymentIntent with server-verified total | Public / Customer |
| `/api/webhooks/stripe` | `POST` | Cryptographically signed webhook confirming payment | Stripe Secret |
| `/api/admin/orders` | `GET` | Order fulfillment list for merchant operations | Admin Only |

### 7.2 Secure Checkout Sequence

```mermaid
sequenceDiagram
    participant User as Customer
    participant Cart as Zustand Cart Store
    participant Server as App API Server
    participant Stripe as Stripe Gateway
    participant DB as PostgreSQL

    User->>Cart: Clicks "Proceed to Checkout"
    Cart->>Server: POST /api/cart/validate (items, quantities)
    Server->>DB: Verify active prices & variant stock
    DB-->>Server: Stock confirmed
    Server-->>Cart: 200 OK (Validated subtotal & shipping options)
    
    User->>Server: POST /api/checkout/create-intent (shippingAddress, items)
    Server->>DB: Lock inventory hold or calculate final total with tax
    Server->>Stripe: stripe.paymentIntents.create({ amount, currency })
    Stripe-->>Server: client_secret
    Server-->>User: client_secret
    
    User->>Stripe: Confirm payment via Stripe Elements
    Stripe-->>User: Payment Successful
    
    Stripe->>Server: Webhook: payment_intent.succeeded
    Server->>DB: Atomic transaction: Decrement stock, Create Order #APX-XXXX
    Server->>Server: Dispatch Order Confirmation Email
```

---

## 8. State Management (Zustand Cart & Wishlist)

```typescript
// store/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  salePrice?: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (newItem) => {
        const current = get().items;
        const exists = current.find((i) => i.variantId === newItem.variantId);
        if (exists) {
          set({
            items: current.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...current, newItem], isOpen: true });
        }
      },
      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      updateQuantity: (variantId, quantity) =>
        set({
          items: quantity <= 0
            ? get().items.filter((i) => i.variantId !== variantId)
            : get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        }),
      clearCart: () => set({ items: [] }),
      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0),
      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'apex-cart-storage' }
  )
);
```

---

## 9. Security, Threat Modeling & Compliance

| Threat Vector | Mitigation Strategy |
|---|---|
| **Price Tampering in Cart** | Client-submitted cart prices are completely ignored by the server. The checkout route recalculates the order total strictly using live database pricing. |
| **Inventory Overselling Race Condition** | Postgres transactions with row-level locks (`SELECT FOR UPDATE`) or atomic SQL decrement statements: `UPDATE "ProductVariant" SET "stockCount" = "stockCount" - $qty WHERE id = $id AND "stockCount" >= $qty`. |
| **Payment Webhook Spoofing** | Strict signature verification using Stripe's raw body webhook secret: `stripe.webhooks.constructEvent(rawBody, signature, secret)`. |
| **PCI-DSS Compliance** | Zero credit card data touches servers; handled entirely inside Stripe hosted Elements iframe containers. |
| **Rate Limiting & Bot Scraping** | Edge rate limiting on `/api/checkout/*` and `/api/cart/*` using Cloudflare or Upstash Redis to prevent inventory lock denial-of-service. |

---

## 10. Environment Configuration

```ini
# .env.example

# App & Database
DATABASE_URL="postgresql://user:password@localhost:5432/apexstore?schema=public"
NEXT_PUBLIC_SITE_URL="https://apexstore.com"

# Stripe Payment Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Gateway (Resend / Postmark)
RESEND_API_KEY="re_..."
ORDER_SUPPORT_EMAIL="support@apexstore.com"

# Media CDN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="apexstore"
```

---

## 11. Testing & Deployment Strategy

* **Unit & Component Testing:** Vitest + React Testing Library for cart store actions, quantity math, and shipping progress calculations.
* **End-to-End Testing (E2E):** Playwright automated flow covering: Catalog browse $\rightarrow$ Add to Cart $\rightarrow$ Open Drawer $\rightarrow$ Checkout navigation with Stripe mock card testing.
* **CI/CD Pipeline:** GitHub Actions automates linting, typechecks, database migration dry-runs, and deploys production builds to Vercel/Cloudflare Edge with automated database schema synchronization.
