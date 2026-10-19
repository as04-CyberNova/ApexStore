# API Architecture & Integration Specification (API.md)

**Document Version:** 1.0.0  
**Status:** Approved API Architecture Baseline  
**System:** ApexStore Direct-to-Consumer (D2C) E-Commerce Platform  
**Target Runtime:** Next.js Route Handlers / Node.js Edge Runtime with TypeScript  
**Companion Documents:** [PRD.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/PRD.md), [ARCHITECTURE.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/ARCHITECTURE.md), [DATABASE.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/DATABASE.md)

---

## 1. Global API Conventions & Protocol Standards

### 1.1 Architectural Standards
* **Protocol & Format:** All endpoints communicate over **HTTPS (TLS 1.3)** using standard JSON (`application/json`) for request bodies and response payloads.
* **Base URL:** `/api/v1` for versioned application routes.
* **HTTP Methods:**
  * `GET`: Safe, idempotent read operations.
  * `POST`: Creation of resources, session initiation, or intent tokens.
  * `PATCH`: Partial updates to mutable resources.
  * `DELETE`: Deletion or removal of records.
* **Timestamps:** ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ss.sssZ`).
* **Monetary Values:** Represented in decimal format rounded to two decimal places (e.g., `129.50`) matching database `NUMERIC(10, 2)`.

---

### 1.2 Unified Response Envelope
Every API response adheres to a consistent JSON envelope to allow deterministic client-side handling.

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 84,
    "totalPages": 5
  }
}
```
*(The `meta` object is optional and included on paginated endpoints).*

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "One or more items in your cart are no longer available in the requested quantity.",
    "details": [
      {
        "field": "variantId",
        "value": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
        "issue": "Only 2 units remaining in stock"
      }
    ]
  }
}
```

---

### 1.3 Standard Error Codes & HTTP Status Mapping

| HTTP Status | Error Code | Description |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Schema validation failed on input body/query parameters. |
| `400 Bad Request` | `INVALID_COUPON` | Promotional voucher is expired, inactive, or invalid. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing, expired, or invalid session token. |
| `403 Forbidden` | `UNAUTHORIZED` | Role lacks permission to access the resource (e.g., non-admin accessing merchant metrics). |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Requested product, order, or variant does not exist. |
| `409 Conflict` | `OUT_OF_STOCK` | Stock count dropped below requested quantity during checkout intent creation. |
| `422 Unprocessable` | `PAYMENT_FAILED` | Gateway declined the transaction. |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | IP or account exceeded configured threshold. |
| `500 Server Error` | `INTERNAL_ERROR` | Uncaught server exception (sanitized to prevent stack leak). |

---

## 2. Authentication & Authorization

ApexStore operates a tiered role-based access control (RBAC) model as specified in [PRD.md Section 5](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/PRD.md#5-roles--permissions-matrix).

### 2.1 Security & Session Architecture
* **Guest Users:** Can browse catalog, validate cart, and initiate guest checkout without any authentication token. Guest cart is persisted client-side (`localStorage`).
* **Registered Customers & Administrators:** Authenticated via HttpOnly, Secure, `SameSite=Lax` session cookies containing cryptographically signed JSON Web Tokens (JWT) or server-backed session IDs.
* **Authorization Headers (Optional programmatic access):**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
* **Server-Side Enforcement:** Every route handler decrypts and validates the JWT payload before executing database queries. The client can never manipulate `role` or `userId`.

### 2.2 Role Mapping

| Role | Access Scope |
|---|---|
| `GUEST` | Catalog read, search, cart validation, guest checkout creation. |
| `CUSTOMER` | All Guest capabilities + saved addresses, personal order history, review authoring, personal wishlist. |
| `SUPPORT` | Customer capabilities + view all customer orders, update tracking numbers and fulfillment status. |
| `ADMIN` | Support capabilities + product CRUD, price overrides, inventory adjustments, sales revenue metrics. |

---

## 3. Core Storefront Endpoints

### 3.1 Catalog & Search Endpoints

#### `GET /api/v1/products`
Retrieves a paginated list of active products with faceted filtering, text search, and sorting.

* **Auth Level:** Public (`GUEST`, `CUSTOMER`, `SUPPORT`, `ADMIN`)
* **Query Parameters:**
  * `search` (string, optional): Search keyword against product title & description (debounced full-text search).
  * `category` (string, optional): Category slug (e.g. `apparel`, `tech`).
  * `minPrice` (number, optional): Minimum price filter.
  * `maxPrice` (number, optional): Maximum price filter.
  * `inStock` (boolean, optional): If `true`, returns only products with at least one variant having `stock_count > 0`.
  * `featured` (boolean, optional): If `true`, returns featured hero/trending products.
  * `sort` (string, optional): `featured` (default), `price_asc`, `price_desc`, `rating_desc`, `newest`.
  * `page` (integer, optional, default: `1`): Pagination page number.
  * `limit` (integer, optional, default: `20`, max: `50`): Items per page.

* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "title": "Merino Wool Minimalist Overshirt",
      "slug": "merino-wool-minimalist-overshirt",
      "description": "Engineered from 100% extra-fine Australian merino wool.",
      "basePrice": 185.00,
      "salePrice": 148.00,
      "isFeatured": true,
      "category": {
        "id": "4a2f8c5b-6142-4f1e-8a21-998811223344",
        "name": "Apparel",
        "slug": "apparel"
      },
      "primaryImage": {
        "url": "https://res.cloudinary.com/apexstore/image/upload/v1/overshirt-front.webp",
        "altText": "Front view of Merino Wool Minimalist Overshirt in Midnight Black"
      },
      "variants": [
        {
          "id": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
          "sku": "APX-OVS-BLK-M",
          "size": "M",
          "color": "Midnight Black",
          "colorHex": "#18181b",
          "stockCount": 8,
          "priceOverride": null
        }
      ],
      "ratingSummary": {
        "averageRating": 4.8,
        "reviewCount": 42
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/v1/products/:slug`
Retrieves comprehensive details for a single product, including all variants, high-resolution media gallery, and recent reviews.

* **Auth Level:** Public
* **Path Parameters:**
  * `slug` (string, required): Unique URL slug of the product.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "title": "Merino Wool Minimalist Overshirt",
    "slug": "merino-wool-minimalist-overshirt",
    "description": "Engineered from 100% extra-fine Australian merino wool...",
    "basePrice": 185.00,
    "salePrice": 148.00,
    "isFeatured": true,
    "category": {
      "name": "Apparel",
      "slug": "apparel"
    },
    "images": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "url": "https://res.cloudinary.com/apexstore/image/upload/v1/overshirt-front.webp",
        "altText": "Front model angle",
        "isPrimary": true,
        "sortOrder": 0
      },
      {
        "id": "22222222-3333-4444-5555-666666666666",
        "url": "https://res.cloudinary.com/apexstore/image/upload/v1/overshirt-back.webp",
        "altText": "Rear drape detail",
        "isPrimary": false,
        "sortOrder": 1
      }
    ],
    "variants": [
      {
        "id": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
        "sku": "APX-OVS-BLK-M",
        "size": "M",
        "color": "Midnight Black",
        "colorHex": "#18181b",
        "stockCount": 8,
        "priceOverride": null
      }
    ],
    "ratingSummary": {
      "averageRating": 4.8,
      "reviewCount": 42,
      "distribution": { "5": 35, "4": 6, "3": 1, "2": 0, "1": 0 }
    }
  }
}
```
* **Error Response (`404 Not Found`):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product with slug 'merino-wool-minimalist-overshirt' was not found."
  }
}
```

---

#### `GET /api/v1/categories`
Retrieves all active categories with their display orders for top-level navigation.

* **Auth Level:** Public
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "4a2f8c5b-6142-4f1e-8a21-998811223344",
      "name": "Apparel",
      "slug": "apparel",
      "description": "Minimalist luxury essentials",
      "displayOrder": 1
    },
    {
      "id": "5b3a9d6c-7253-4e2f-9b32-009922334455",
      "name": "Tech & Living",
      "slug": "tech",
      "description": "Precision desk tools & accessories",
      "displayOrder": 2
    }
  ]
}
```

---

### 3.2 Cart & Pre-Checkout Validation

#### `POST /api/v1/cart/validate`
Validates client-side Zustand cart items against real-time database stock counts and prices. Client-submitted prices are discarded and recalculated strictly from the database.

* **Auth Level:** Public (`GUEST`, `CUSTOMER`)
* **Request Body:**
```json
{
  "items": [
    {
      "variantId": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
      "quantity": 2
    }
  ],
  "couponCode": "SUMMER20"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "items": [
      {
        "variantId": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
        "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "title": "Merino Wool Minimalist Overshirt",
        "sku": "APX-OVS-BLK-M",
        "size": "M",
        "color": "Midnight Black",
        "unitPrice": 148.00,
        "quantity": 2,
        "itemTotal": 296.00,
        "availableStock": 8,
        "isAvailable": true
      }
    ],
    "subtotal": 296.00,
    "discountAmount": 59.20,
    "freeShippingThreshold": 150.00,
    "freeShippingUnlocked": true,
    "estimatedShipping": 0.00,
    "estimatedTax": 21.31,
    "estimatedTotal": 258.11
  }
}
```

---

### 3.3 Checkout & Payment Flow

#### `POST /api/v1/checkout/session`
Initiates a secure checkout intent. Locks server-verified pricing, creates a Stripe PaymentIntent, and returns the Stripe `client_secret` to the frontend for embedding in Stripe Elements.

* **Auth Level:** Public (`GUEST` or authenticated `CUSTOMER`)
* **Request Body:**
```json
{
  "customerEmail": "alex.morgan@example.com",
  "customerName": "Alex Morgan",
  "items": [
    {
      "variantId": "e2c34a2e-5036-4bfb-a818-490b4d49a71b",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Alex Morgan",
    "addressLine1": "452 Broadway",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10013",
    "countryCode": "US",
    "phone": "+1 (555) 234-5678"
  },
  "shippingMethod": "Standard",
  "couponCode": "SUMMER20"
}
```
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "orderNumber": "APX-98241",
    "paymentIntentId": "pi_3MtwBwLkdIwHu7ix28a3tqPa",
    "clientSecret": "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_Yr6k...",
    "breakdown": {
      "subtotal": 148.00,
      "discountAmount": 29.60,
      "shippingAmount": 0.00,
      "taxAmount": 10.66,
      "totalAmount": 129.06,
      "currency": "usd"
    }
  }
}
```
* **Error Response - Insufficient Inventory (`409 Conflict`):**
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Item 'Merino Wool Minimalist Overshirt (M / Black)' has only 0 units left."
  }
}
```

---

#### `GET /api/v1/orders/:orderNumber`
Fetches order receipt details and fulfillment status. Requires email match verification for guests or user session match for customers.

* **Auth Level:** Public with email query verification (`?email=...`) OR Authenticated `CUSTOMER` / `SUPPORT` / `ADMIN`.
* **Path Parameters:**
  * `orderNumber` (string, required): e.g. `APX-98241`.
* **Query Parameters (if unauthenticated):**
  * `email` (string, required for guests): Matches `orders.customer_email`.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "orderNumber": "APX-98241",
    "orderStatus": "PROCESSING",
    "paymentStatus": "SUCCEEDED",
    "trackingNumber": "1Z9999999999999999",
    "shippingMethod": "Standard",
    "customer": {
      "name": "Alex Morgan",
      "email": "alex.morgan@example.com"
    },
    "shippingAddress": {
      "fullName": "Alex Morgan",
      "addressLine1": "452 Broadway",
      "addressLine2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10013",
      "countryCode": "US"
    },
    "items": [
      {
        "titleSnapshot": "Merino Wool Minimalist Overshirt",
        "skuSnapshot": "APX-OVS-BLK-M",
        "variantOptions": "Size: M, Color: Midnight Black",
        "quantity": 1,
        "unitPrice": 148.00,
        "totalPrice": 148.00
      }
    ],
    "financials": {
      "subtotal": 148.00,
      "discountAmount": 29.60,
      "shippingAmount": 0.00,
      "taxAmount": 10.66,
      "totalAmount": 129.06
    },
    "createdAt": "2026-10-19T10:30:00.000Z"
  }
}
```

---

### 3.4 Customer Account & Saved Data

#### `GET /api/v1/customer/orders`
Retrieves personal order history for authenticated customer.

* **Auth Level:** Authenticated `CUSTOMER`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "orderNumber": "APX-98241",
      "orderStatus": "PROCESSING",
      "totalAmount": 129.06,
      "itemCount": 1,
      "createdAt": "2026-10-19T10:30:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/customer/addresses` & `POST /api/v1/customer/addresses`
Manage saved shipping addresses for 1-click checkout.

* **Auth Level:** Authenticated `CUSTOMER`
* **POST Request Body:**
```json
{
  "fullName": "Alex Morgan",
  "addressLine1": "452 Broadway",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10013",
  "countryCode": "US",
  "phone": "+1 (555) 234-5678",
  "isDefault": true
}
```
* **Success Response (`201 Created`):** Returns the persisted address record with ID.

---

#### `GET /api/v1/customer/wishlist` & `POST /api/v1/customer/wishlist`
Persists customer wishlist items across browser sessions.

* **Auth Level:** Authenticated `CUSTOMER`
* **POST Request Body:**
```json
{
  "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```
* **DELETE `/api/v1/customer/wishlist/:productId`:** Removes item from wishlist.

---

### 3.5 Reviews & Ratings

#### `POST /api/v1/products/:productId/reviews`
Submits a customer rating and commentary. System checks database orders to mark `is_verified: true` if user has a delivered order containing this product.

* **Auth Level:** Authenticated `CUSTOMER`
* **Request Body:**
```json
{
  "rating": 5,
  "comment": "The fabric quality and fit are unmatched. Incredible attention to detail.",
  "reviewerName": "Alex M."
}
```
* **Success Response (`201 Created`):** Returns review object with `isVerified: true/false`.

---

## 4. Merchant & Administration Endpoints

All admin endpoints require an active session with role `ADMIN` or `SUPPORT` as delineated below.

### 4.1 Order Management

#### `GET /api/v1/admin/orders`
List and filter incoming store orders with status counters.

* **Auth Level:** `SUPPORT` or `ADMIN`
* **Query Parameters:** `status` (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, etc.), `search` (customer name/email/order number), `page`, `limit`.
* **Success Response (`200 OK`):** Itemized orders with fulfillment details.

#### `PATCH /api/v1/admin/orders/:orderNumber/fulfillment`
Updates operational fulfillment state and attaches carrier tracking IDs.

* **Auth Level:** `SUPPORT` or `ADMIN`
* **Request Body:**
```json
{
  "orderStatus": "SHIPPED",
  "trackingNumber": "1Z9999999999999999",
  "notifyCustomer": true
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "orderNumber": "APX-98241",
    "orderStatus": "SHIPPED",
    "trackingNumber": "1Z9999999999999999",
    "updatedAt": "2026-10-19T11:15:00.000Z"
  }
}
```

---

### 4.2 Product Inventory & Catalog CRUD

#### `POST /api/v1/admin/products`
Creates a new product with multiple variants and media records.

* **Auth Level:** `ADMIN` Only
* **Request Body:**
```json
{
  "title": "Minimalist Cashmere Beanie",
  "slug": "minimalist-cashmere-beanie",
  "categoryId": "4a2f8c5b-6142-4f1e-8a21-998811223344",
  "description": "100% Mongolian cashmere.",
  "basePrice": 65.00,
  "salePrice": null,
  "isFeatured": false,
  "images": [
    {
      "url": "https://res.cloudinary.com/apexstore/image/upload/v1/beanie.webp",
      "altText": "Charcoal Beanie",
      "isPrimary": true,
      "sortOrder": 0
    }
  ],
  "variants": [
    {
      "sku": "APX-BN-CHR-OS",
      "size": "One Size",
      "color": "Charcoal Grey",
      "colorHex": "#27272a",
      "stockCount": 25
    }
  ]
}
```
* **Success Response (`201 Created`):** Complete product entity.

#### `PATCH /api/v1/admin/variants/:variantId/stock`
Rapid stock replenishment endpoint for merchant operations.

* **Auth Level:** `ADMIN` Only
* **Request Body:**
```json
{
  "stockCount": 50
}
```
* **Success Response (`200 OK`):** Updated variant entity.

---

### 4.3 Analytics & Reporting

#### `GET /api/v1/admin/analytics/summary`
Returns high-level sales and operational metrics (PRD Section 3.7).

* **Auth Level:** `ADMIN` Only
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "grossMerchandiseValue": 48290.50,
    "totalOrders": 342,
    "averageOrderValue": 141.20,
    "lowStockAlertCount": 3,
    "topSellingSkus": [
      {
        "sku": "APX-OVS-BLK-M",
        "title": "Merino Wool Minimalist Overshirt",
        "unitsSold": 84,
        "revenue": 12432.00
      }
    ]
  }
}
```

---

## 5. External Integrations & Webhooks

ApexStore interfaces with three primary external infrastructure providers:

```mermaid
flowchart LR
    A[Customer Browser] -->|Tokenize Card| B[Stripe Elements]
    B -->|PaymentIntent Succeeded| C[Stripe Engine]
    C -->|POST /api/v1/webhooks/stripe| D[ApexStore Webhook Handler]
    D -->|Atomic Stock Decrement & Order Creation| E[(PostgreSQL DB)]
    D -->|Send Order Confirmation Email| F[Resend Email Gateway]
    D -->|Sync Label / Pickup| G[Courier API]
```

### 5.1 Stripe Payment Webhook

#### `POST /api/v1/webhooks/stripe`
Asynchronous payment settlement webhook. Stripe cryptographically notifies the server when a customer completes payment.

* **Auth Level:** Cryptographic Signature Verification via `Stripe-Signature` Header.
* **Payload Verification Requirement:** The raw HTTP request body must not be pre-parsed into JSON before passing to Stripe's verification SDK:
  ```typescript
  const event = stripe.webhooks.constructEvent(
    rawBodyBuffer,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  ```

#### Handled Stripe Events

| Event Type | System Action & Side Effects |
|---|---|
| `payment_intent.succeeded` | 1. Initiates database transaction.<br>2. Verifies order is in `PENDING` state.<br>3. Executes atomic inventory decrement on variants.<br>4. Updates order status to `CONFIRMED` and payment status to `SUCCEEDED`.<br>5. Dispatches customer order receipt via Resend.<br>6. Responds `200 OK` to Stripe within 2 seconds. |
| `payment_intent.payment_failed` | 1. Updates order payment status to `FAILED`.<br>2. Logs failure reason (`error.message`) for merchant support.<br>3. Responds `200 OK` to Stripe. |
| `charge.refunded` | 1. Updates order status to `REFUNDED`.<br>2. If configured, restores returned inventory counts.<br>3. Dispatches refund notification email. |

* **Idempotency Guarantee:** The webhook handler inspects `orders.payment_intent_id`. If the order is already marked `CONFIRMED` or `PAID`, the handler logs an idempotent acknowledgement and returns `200 OK` immediately without repeating stock reductions or email dispatches.

---

### 5.2 Transactional Email Integration (Resend / Postmark)
* **Service:** Resend (`https://api.resend.com/emails`)
* **Trigger:** Invoked asynchronously immediately after `payment_intent.succeeded` commits.
* **Payload Dispatched:**
  * To: `order.customer_email`
  * Subject: `Your ApexStore Order Confirmation [APX-XXXXX]`
  * Dynamic Template Data: Item list, prices, shipping address, and tracking link.
* **Failure Handling:** Email dispatch failures are isolated in a `try/catch` block. A failure to deliver an email will log an error to the observability system but will **never rollback** the committed order transaction.

---

### 5.3 Media Storage CDN (Cloudinary)
* **Purpose:** High-performance responsive image transformations (`WebP/AVIF`, auto-quality `q_auto,f_auto`).
* **Upload Pattern:** Merchant uploads media directly via authenticated server route or signed direct upload tokens (`/api/v1/admin/uploads/signature`).
* **Security:** Master Cloudinary API Secret is kept exclusively on the server.

---

## 6. Rate Limiting & Denial-of-Service Defense

To protect transactional checkout integrity, prevent automated inventory scraping, and mitigate brute-force attacks, rate limits are enforced via Edge middleware (Upstash Redis or Cloudflare):

| Endpoint Group | Threshold | Identification | Action on Breach |
|---|---|---|---|
| **Public Catalog Reads** (`/api/v1/products*`) | 120 req / minute | Client IP | Return `429 Too Many Requests` |
| **Search Autocomplete** (`/api/v1/products?search=...`) | 60 req / minute | Client IP | Return `429 Too Many Requests` |
| **Cart Validation** (`/api/v1/cart/validate`) | 40 req / minute | Client IP | Return `429 Too Many Requests` |
| **Checkout Session Creation** (`/api/v1/checkout/session`) | 10 req / minute | Client IP + Email | Block IP for 10 minutes, return `429` |
| **Stripe Webhook** (`/api/v1/webhooks/stripe`) | Exempt | Stripe Webhook IP whitelist | Verify cryptographic signature |
| **Admin Operations** (`/api/v1/admin/*`) | 100 req / minute | User Session ID | Log alert and throttle |

---

## 7. Sensitive Data, PCI-DSS & Privacy Handling

1. **Zero Cardholder Data Exposure (PCI-DSS):**
   * Primary Account Numbers (PAN), CVVs, and magnetic stripe contents never touch ApexStore servers or logs.
   * Stripe Elements directly tokenizes card details in an iframe within the user's browser, transmitting them directly to Stripe's PCI Level 1 certified vault.
2. **PII Masking in Application Logs:**
   * Server-side loggers (e.g., Winston/Pino) automatically redact sensitive fields: `password`, `token`, `clientSecret`, `addressLine1`, and `phone`.
3. **Data Sanitization & Injection Prevention:**
   * All incoming payloads are validated using **Zod** schemas before execution.
   * Database queries strictly rely on parameterized Prisma ORM queries, eliminating SQL injection.

---

## 8. Environment Variables Specification

The backend requires the following environment variables. The server validates their presence on startup using a configuration validator.

```ini
# ==============================================================================
# APEXSTORE ENVIRONMENT CONFIGURATION
# ==============================================================================

# Application & Environment
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://apexstore.com"
NEXT_PUBLIC_API_BASE_URL="https://apexstore.com/api/v1"

# Database Connection (PostgreSQL with Connection Pooling)
DATABASE_URL="postgresql://apex_user:SECRET_PASSWORD@db.example.com:5432/apexstore?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://apex_user:SECRET_PASSWORD@db.example.com:5432/apexstore?schema=public"

# Authentication & Session Security
JWT_SECRET="super-secure-at-least-64-char-random-string"
JWT_EXPIRES_IN="7d"

# Stripe Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51M..."
STRIPE_SECRET_KEY="sk_live_51M..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Gateway (Resend)
RESEND_API_KEY="re_123456789_..."
EMAIL_SENDER_ADDRESS="ApexStore <orders@apexstore.com>"

# Media Storage CDN (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="apexstore"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz1234"

# Rate Limiting & Distributed Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://apex-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXaaB..."
```
*(Notice: Variables prefixed with `NEXT_PUBLIC_` are safe to expose to the client browser. All other variables are strictly secret and restricted to the server environment).*
