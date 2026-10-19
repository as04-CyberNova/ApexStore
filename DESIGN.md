# Design System & UX/UI Specification (DESIGN.md)

# ApexStore: Next-Generation Direct-to-Consumer (D2C) E-Commerce Platform

**Document Version:** 1.0.0  
**Status:** Approved Design Baseline & Front-End Engineering Specification  
**Companion Document:** [PRD.md](file:///d:/DATA_SCIENCE_AND_CODING/Self_Projects_Web_Dev/AcademIQ/PRD.md)  

---

## 1. Visual Direction & Aesthetic Philosophy

### 1.1 Brand Identity: "Minimalist Editorial Luxe"
ApexStore blends the visual sophistication of a high-end luxury fashion/tech editorial with the frictionless speed and utilitarian clarity of modern consumer software:
* **Visual Tone:** Clean, refined, confident, and clutter-free. Imagery and products are the heroes of every viewport.
* **Canvas Philosophy:** Crisp off-white/light canvas (`#fafafa` / `#ffffff`) with an optional sleek midnight dark mode. High-contrast typography, generous whitespace, and subtle 1px hairline borders (`#e5e7eb`).
* **Tactile Interactions:** Micro-interactions emphasize tactile feedback: subtle 2-degree thumbnail zooms on hover, spring-animated cart drawer slides, optimistic button state switches, and haptic-feel counter taps.
* **Mobile-First Ergonomics:** Thumb-zone accessibility with bottom-docked sticky "Add to Cart" sheets on mobile devices.

### 1.2 Core Design Principles
1. **Zero-Distraction Product Presentation:** Product photography and key decision data (price, size, stock status, ratings) are never obscured by noisy decorative badges or overwhelming banner clutter.
2. **Instant Feedback & Optimistic UI:** Adding to cart, toggling quantities, and selecting variants responds within 16ms with smooth micro-animations.
3. **Frictionless Spatial Continuity:** The shopping journey remains seamless using slide-over cart overlays, inline quick views, and smooth checkout step transitions that avoid unnecessary full-page jumps.
4. **Accessible Inclusivity:** Strict adherence to WCAG 2.1 AA standards for high contrast, explicit focus states, and screen reader announcements.

---

## 2. Color System & Design Tokens

### 2.1 Color Tokens & CSS Variables

```css
:root {
  /* Canvas & Neutral Scales (Light / Editorial Canvas) */
  --bg-canvas: #fafafa;           /* Base page background */
  --bg-surface: #ffffff;          /* Product card, cart drawer & modal surface */
  --bg-surface-subtle: #f4f4f5;   /* Secondary backgrounds, table striping, tags */
  --bg-surface-elevated: #ffffff; /* Elevated popovers & sticky headers */

  /* Hairline Borders & Dividers */
  --border-subtle: #e4e4e7;       /* 1px light divider */
  --border-medium: #d4d4d8;       /* Input borders & interactive controls */
  --border-strong: #18181b;       /* Active selected pills & focus outlines */

  /* Brand Primary & Accents */
  --color-primary: #18181b;       /* Deep obsidian black for primary CTA & headers */
  --color-primary-hover: #27272a; /* Slightly lighter obsidian for hover */
  --color-accent: #2563eb;        /* Royal Cobalt for interactive highlights & links */
  --color-accent-subtle: #eff6ff; /* Soft blue tint for informational banners */

  /* Semantic E-Commerce Status Colors */
  --color-success: #15803d;       /* In-stock, discount unlocked, payment success */
  --color-success-bg: #f0fdf4;    /* Success pill background */
  --color-warning: #b45309;       /* Low stock alert (< 5 left) */
  --color-warning-bg: #fffbeb;    /* Warning pill background */
  --color-danger: #b91c1c;        /* Out of stock, error, discount failed */
  --color-danger-bg: #fef2f2;     /* Error message background */
  --color-sale: #dc2626;          /* Sale price & discount badge */
  --color-sale-bg: #fee2e2;       /* Sale badge background */

  /* Typography Scales */
  --text-primary: #09090b;        /* Highest contrast text */
  --text-secondary: #52525b;      /* Descriptive body & secondary details */
  --text-muted: #71717a;          /* Metadata, SKU, tax notices, breadcrumbs */
  --text-inverse: #ffffff;        /* White text on dark primary buttons */
}

/* Optional Midnight Dark Mode Tokens */
[data-theme="dark"] {
  --bg-canvas: #09090b;
  --bg-surface: #18181b;
  --bg-surface-subtle: #27272a;
  --border-subtle: #27272a;
  --border-medium: #3f3f46;
  --border-strong: #f4f4f5;
  --color-primary: #f4f4f5;
  --color-primary-hover: #e4e4e7;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-inverse: #09090b;
}
```

---

## 3. Typography Hierarchy

ApexStore pairs a refined geometric sans-serif for editorial elegance with a tabular monospaced typeface for prices, SKUs, and inventory counters.

* **Primary Typeface:** `'Plus Jakarta Sans'`, `'Inter'`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
* **Numerical & Price Monospace:** `'JetBrains Mono'`, `'SF Mono'`, `monospace` (Uses `font-variant-numeric: tabular-nums` to prevent layout jitter during quantity updates).
* **Editorial Accent (Optional):** `'Playfair Display'`, `serif` (used sparingly for luxury hero banners or collection names).

### 3.1 Type Scale

| Role | Element | Size (Desktop) | Size (Mobile) | Weight | Tracking | Line Height |
|---|---|---|---|---|---|---|
| **Display Hero** | `h1.hero` | 52px (3.25rem) | 34px (2.125rem) | 700 / Bold | -0.03em | 1.15 |
| **Section Title** | `h2` | 32px (2.0rem) | 24px (1.5rem) | 600 / Semibold | -0.02em | 1.25 |
| **Product Title (PDP)** | `h1.product`| 28px (1.75rem) | 22px (1.375rem) | 600 / Semibold | -0.015em | 1.3 |
| **Product Card Title** | `h3` | 16px (1.0rem) | 15px (0.9375rem)| 500 / Medium | -0.01em | 1.4 |
| **Price Main (PDP)** | `span.price`| 24px (1.5rem) | 20px (1.25rem) | 700 / Bold | 0.0em | 1.2 |
| **Price Card** | `span.price`| 15px (0.9375rem)| 14px (0.875rem) | 600 / Semibold | 0.0em | 1.3 |
| **Body Large** | `p.lead` | 17px (1.0625rem)| 15px (0.9375rem)| 400 / Regular | 0.0em | 1.6 |
| **Body Base** | `p` | 14px (0.875rem) | 14px (0.875rem) | 400 / Regular | 0.01em | 1.5 |
| **Caption / Badge / SKU**| `small` | 12px (0.75rem)  | 11px (0.6875rem)| 600 / Semibold | +0.03em | 1.3 |

---

## 4. Layout Architecture & Spatial Grid

### 4.1 Grid Scale & Containers
* **Container Width:** `1360px` max-width container with responsive horizontal padding:
  * Mobile: `16px` (`1rem`)
  * Tablet: `24px` (`1.5rem`)
  * Desktop: `32px` (`2rem`)
* **Spatial System (8pt Grid):**
  * `space-1`: 4px (micro badges, inline tags)
  * `space-2`: 8px (icon gaps, pill padding)
  * `space-3`: 12px (form input padding, button interior spacing)
  * `space-4`: 16px (grid gutters on mobile, card interior padding)
  * `space-6`: 24px (standard desktop grid gutter, PDP media gap)
  * `space-8`: 32px (major section spacing)
  * `space-16`: 64px (hero & collection section dividers)

---

## 5. Component Specifications

### 5.1 Sticky Header & Navigation Bar
* **Height:** `68px` desktop / `56px` mobile. Sticky top with soft 1px bottom border (`--border-subtle`).
* **Left Section:** Brand logo mark + Category navigation links (`New Arrivals`, `Apparel`, `Tech`, `Sale`).
* **Center Section:** Expandable instant search bar with live auto-suggestions dropdown.
* **Right Actions:**
  * Currency/Region Selector.
  * Search toggle (on mobile).
  * Wishlist Icon with count badge.
  * User Account / Sign In Icon.
  * **Cart Icon with Glowing Badge Counter:** Displays active item count and triggers the Slide-Over Cart Drawer.

### 5.2 Product Listing Grid & Card Anatomy (PLP)
* **Responsive Grid:** 4-column (desktop $\ge 1200\text{px}$), 3-column (laptop), 2-column (tablet & mobile).
* **Card Structure:**
  * **Aspect Ratio Image:** 3:4 or 1:1 ratio with rounded corners (`border-radius: 8px`).
  * **Hover Reaction:** Smooth cross-fade to secondary product angle photo + elevation hover shadow.
  * **Status Badges (Top Left):** Floating pill: *"Sale -30%"*, *"Low Stock"*, *"New"*.
  * **Wishlist Heart Button (Top Right):** Floating glass button with instant fill toggle animation.
  * **Color Swatches:** Small circular swatches below the image. Hovering or clicking a swatch swaps the preview image immediately.
  * **Title & Price Line:** Product title (truncated to 2 lines max) with current price and strikethrough original price in muted red.
  * **Quick Add Button:** Appears on hover (desktop) or persistent compact button (mobile) to immediately add default variant to cart.

### 5.3 Product Detail Page (PDP) Layout
* **Two-Column Split Layout (Desktop):**
  * **Left Column (58%):** Sticky media gallery. Main high-res viewport with thumbnail rail (left or bottom), swipeable gestures, and pinch/click to zoom.
  * **Right Column (42%):** Sticky purchasing panel:
    * Breadcrumbs (`Home / Apparel / Jackets / Product`).
    * Title, SKU, and Star Rating summary with review count link.
    * Price block with installment plan breakdown (e.g. *"or 4 interest-free payments of $24.75 with Klarna"*).
    * **Variant Selectors:** Visual color swatches with active ring; clickable size pills (`XS`, `S`, `M`, `L`, `XL`) with out-of-stock strike-throughs.
    * **Urgency Marker:** Dynamic alert box (e.g., *"Only 3 left in stock — ships today"*).
    * **Primary Action:** Full-width high-contrast "Add to Cart" button + secondary "Buy Now with 1-Click".
    * **Trust Accordions:** Collapsible segments for Shipping Details, Materials, Care Guide, and Size Chart modal trigger.

### 5.4 Slide-Over Cart Drawer
* **Geometry:** Slides in from the right edge with smooth spring curve (`width: 440px` max, `100vw` on mobile). Darkened translucent backdrop blur.
* **Free Shipping Threshold Bar:** Progress indicator at top showing progress toward free shipping eligibility.
* **Itemized List:**
  * Compact 80x80px thumbnail.
  * Title, selected variant tags (`Size: M`, `Color: Midnight`).
  * Unit price.
  * Quantity controller (`[-] [1] [+]`) with immediate optimistic recalculation.
  * Remove item button (`trash` icon).
* **Cross-Sell Drawer Rail:** Small "You may also like" 1-click add accessories recommendations at the bottom.
* **Drawer Footer:**
  * Subtotal with tax notice.
  * Promo code expandable input.
  * Primary Checkout CTA button displaying calculated total: *"Proceed to Checkout • $148.00"*.

### 5.5 Checkout Workflow
* **Progress Bar:** 2-step visual tracker (`1. Shipping & Delivery` $\rightarrow$ `2. Payment & Confirmation`).
* **Order Summary Panel:** Fixed sticky summary on the right side on desktop, collapsible accordion on mobile.
* **Forms:** Floating label inputs with real-time postal code / address validation and credit card formatting.
* **Security Badges:** 256-Bit SSL Encryption, Money-Back Guarantee, and official payment network icons (Visa, Mastercard, Amex, Apple Pay, PayPal).

---

## 6. Motion, Micro-Interactions & States

* **Button Press State:** Subtle scale-down `transform: scale(0.98)` with 100ms ease.
* **Cart Drawer Transition:** `transform: translateX(0)` with `cubic-bezier(0.16, 1, 0.3, 1)` duration 320ms.
* **Toast Alerts:** Floating bottom-right notification pill with slide-up and fade-in when an item is added to cart or wishlist.
* **Skeleton Loading:** Shimmering animated gray blocks during initial product card and review list fetching to prevent Cumulative Layout Shift (CLS).
