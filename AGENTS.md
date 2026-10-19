# Agent Operating Guidelines & Engineering Discipline (AGENTS.md)

**Document Version:** 1.0.0  
**Target System:** ApexStore Direct-to-Consumer (D2C) E-Commerce Platform  
**Authority Level:** Mandatory Engineering Standards for AI Agents and Human Developers  
**Source of Truth Documents:** [PRD.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/PRD.md), [DESIGN.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/DESIGN.md), [ARCHITECTURE.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/ARCHITECTURE.md), [DATABASE.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/DATABASE.md), [API.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/ApexStore/API.md)

---

## 1. Prime Directives for Coding Agents

1. **Source of Truth Primacy:**
   Never invent ad-hoc patterns, API endpoints, or database structures. All architectural, design, data, and API choices must strictly conform to `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, and `API.md`.
2. **Inspect Before Modifying:**
   Always inspect existing files, utilities, and components before writing new code. Never assume an implementation exists or does not exist without verifying first.
3. **Surgical, Targeted Edits:**
   Avoid broad file rewrites. Make minimal, precise changes that address the user's explicit request. Do not refactor unrelated code or touch working features without instruction.
4. **Zero Placeholder Policy:**
   Never output stubbed placeholders like `// TODO: implement later`, `/* rest of code here */`, or mock lorem-ipsum values when production models exist. If an asset is missing, use generated images or verified vector skeletons adhering to the design system.
5. **Aesthetics & Performance Matter:**
   ApexStore is an editorial luxury e-commerce experience. Strive for sub-30ms client interactions, zero Cumulative Layout Shift (CLS), responsive thumb-zone ergonomics, and fluid CSS transitions.

---

## 2. Code Quality & Naming Conventions

### 2.1 File & Directory Naming
* **React Components:** PascalCase with `.tsx` extension (e.g., `ProductCard.tsx`, `SlideOverCartDrawer.tsx`).
* **Hooks:** camelCase with `use` prefix (e.g., `useCartStore.ts`, `useDebounce.ts`).
* **Route Handlers / API Files:** Next.js convention using kebab-case directories with `route.ts` or `page.tsx` (e.g., `src/app/api/products/route.ts`).
* **Styles / CSS Modules:** PascalCase matching the component (e.g., `ProductCard.module.css`) or kebab-case for global tokens (`tokens.css`).
* **Database Models & Tables:** Lowercase snake_case in SQL / Prisma maps (e.g., `product_variants`, `order_items`), PascalCase for Prisma model identifiers (`ProductVariant`, `OrderItem`).

### 2.2 Variable & Function Naming
* **Constants & Enums:** UPPER_SNAKE_CASE (e.g., `ORDER_STATUS_PENDING`, `MAX_CART_QUANTITY`).
* **Functions & Methods:** camelCase, descriptive verb-first (e.g., `calculateSubtotal()`, `validateStockAvailability()`, `handleQuantityChange()`).
* **Boolean Variables:** Prefix with state verbs (`is`, `has`, `can`, `should`), e.g., `isFeatured`, `hasActiveDiscount`, `isDrawerOpen`.
* **Database Columns:** snake_case in SQL / database DDL (`stock_count`, `base_price`), camelCase in frontend TypeScript interfaces (`stockCount`, `basePrice`).

---

## 3. Project & Folder Structure Discipline

Agents must place new files strictly within the defined architecture:

```
src/
├── app/                  # Next.js App Router (pages and API route handlers)
│   ├── (storefront)/     # Customer-facing shopping views (Home, PLP, PDP)
│   ├── checkout/         # Streamlined 2-step checkout view
│   ├── account/          # Customer portal & order tracking
│   ├── admin/            # Merchant fulfillment & analytics portal
│   └── api/v1/           # REST API endpoints matching API.md
├── components/
│   ├── common/           # Atomic, domain-agnostic UI (Button, Modal, Input, Skeleton)
│   ├── layout/           # Shell elements (Header, Footer, AnnouncementBar)
│   ├── cart/             # Slide-over cart drawer, items, progress bar
│   ├── catalog/          # PLP grid, filter drawer, sorting controls
│   └── product/          # PDP media gallery, variant selectors, reviews
├── lib/                  # Singleton clients & core utilities (prisma.ts, stripe.ts, email.ts)
├── store/                # Zustand stores (useCartStore.ts, useWishlistStore.ts)
├── styles/               # Design tokens (tokens.css), reset (globals.css), modules
└── types/                # Pure TypeScript type declarations (product.ts, order.ts, api.ts)
```

---

## 4. Component Reuse & Design System Alignment

1. **Use Predefined Design Tokens:**
   * Never hardcode raw hex values or arbitrary margins (e.g., `color: #1a1a1a`, `margin: 17px`).
   * Reference CSS variables defined in `tokens.css` (e.g., `var(--bg-canvas)`, `var(--color-primary)`, `var(--space-4)`, `var(--font-mono)`).
2. **Reuse Common Atoms:**
   * Before writing a custom `<button>` or `<input>`, inspect `src/components/common/Button.tsx` and `Input.tsx`.
   * Ensure components support standard accessibility tags (`aria-label`, `aria-expanded`, `role`).
3. **Tabular Numerics for E-Commerce Data:**
   * Always apply `font-variant-numeric: tabular-nums` or the monospace font token (`var(--font-mono)`) to prices, cart totals, and stock scarcity indicators to prevent layout shifts.

---

## 5. Dependency Management

1. **Zero Unnecessary Packages:**
   * Do not introduce third-party libraries for trivial tasks (e.g., do not install `lodash`, `moment`, or `classnames` when native JavaScript/TypeScript suffices).
2. **Approved Stack:**
   * **Framework:** React / Next.js (TypeScript)
   * **State:** Zustand (`zustand/middleware` for `persist`)
   * **Styling:** Vanilla CSS Modules / CSS Variables (No Tailwind unless explicitly mandated by the user)
   * **Validation:** Zod
   * **ORM / Database:** Prisma Client (`@prisma/client`)
   * **Payments:** `@stripe/stripe-js` (Client Elements) and `stripe` (Server SDK)
3. **Installation Procedure:**
   * Check `package.json` before running `npm install`. Never install conflicting or duplicate libraries.

---

## 6. Type Safety & Validation Rules

1. **No `any` Types:**
   * Strict TypeScript mode is mandatory. Explicitly type all function signatures, component props, and API handlers.
   * Use `unknown` with runtime type narrowing instead of `any` when handling dynamic data.
2. **Input Validation with Zod:**
   * Every API route handler accepting a payload (`POST`, `PATCH`, `PUT`) must validate request bodies using a Zod schema before processing.
   * Return standardized `VALIDATION_ERROR` responses on validation failures.
3. **Single Source of Truth for Models:**
   * Domain interfaces in `src/types/` must mirror Prisma models and API contracts defined in `DATABASE.md` and `API.md`.

---

## 7. Error Handling & Resilience

1. **Deterministic Error Responses:**
   * All API errors must return the standard envelope specified in `API.md`:
     `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`.
2. **Sanitize Production Errors:**
   * Never leak raw database exceptions, stack traces, or internal server paths to the client.
   * Log detailed errors server-side with context (e.g., `orderNumber`, `paymentIntentId`), but return sanitized user-facing messages.
3. **Optimistic UI with Rollback:**
   * Client-side cart interactions (quantity toggles, item removals) may update optimistically in Zustand, but must handle server rejection gracefully with error toast alerts.

---

## 8. Security & Secrets Management

1. **Zero Raw Cardholder Data (PCI-DSS):**
   * Never accept, log, or persist raw credit card numbers, CVVs, or card expiration dates.
   * Card processing is handled exclusively through Stripe Elements iframes client-side and verified via signed server webhooks.
2. **Environment Variable Hygiene:**
   * Client-accessible environment variables must be explicitly prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
   * Server secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, `JWT_SECRET`) must **never** be exposed to client bundles or logged in client components.
3. **Webhook Verification:**
   * The Stripe webhook endpoint (`/api/v1/webhooks/stripe`) must always verify the cryptographic signature against the raw unparsed request body before performing order updates.

---

## 9. Database Access & Concurrency Discipline

1. **Prevent Overselling with Atomic Operations:**
   * Never perform unsafe read-then-write stock adjustments in separate queries.
   * Use atomic conditional SQL queries or row locks (`SELECT FOR UPDATE`):
     ```sql
     UPDATE product_variants 
     SET stock_count = stock_count - :qty 
     WHERE id = :id AND stock_count >= :qty;
     ```
2. **Server-Recalculated Order Pricing:**
   * Never trust client-submitted prices or order totals.
   * The checkout session route must recalculate item subtotals, discounts, taxes, and shipping directly from active database records.
3. **Respect Foreign Key Constraints & Cascades:**
   * Follow the relational integrity defined in `DATABASE.md` (e.g., `ON DELETE RESTRICT` for categories with active products; `ON DELETE CASCADE` for images and variants).

---

## 10. Testing Discipline

1. **Test Core Financial & Inventory Math:**
   * Write unit tests for cart subtotal calculations, promo code deductions, and tax computations.
2. **Edge-Case Validation:**
   * Test boundary conditions: zero items, negative quantity inputs, out-of-stock race conditions, and expired coupons.
3. **Run Pre-Commit Checks:**
   * Verify that `npm run lint` and `npx tsc --noEmit` succeed without errors before finishing a task.

---

## 11. Git & Change Discipline

1. **Focused, Atomic Commits:**
   * Group changes logically by feature or fix (e.g., `feat(cart): implement slide-over drawer with free shipping bar`).
2. **Preserve Documentation Integrity:**
   * Keep comments, docstrings, and companion markdown documents in sync with code updates.
3. **No Unrelated Touches:**
   * Do not reformat entire files or modify indentation in lines unrelated to the task. Respect existing formatting and linter configurations.
