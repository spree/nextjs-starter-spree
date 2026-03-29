# Spree Storefront

A modern, headless e-commerce storefront built with Next.js 16, React 19, and [Spree API v3](https://spreecommerce.org/docs/api-reference).

## Features

- **Product Catalog** - Browse, search, filter products by categories, and use faceted navigation. Search and facet filtering powered by [Meilisearch](https://spreecommerce.org/docs/integrations/search/meilisearch)
- **Product Details** - View product information with variant selection and media
- **Shopping Cart** - Add, update, and remove items with server-side state
- **One-page Checkout** - Guest visitors and signed-in users supported, multi-shipments supported natively, Coupon Codes, Gift Cards, Store Credit
- **Stripe payments** - native Stripe payment support with Stripe SDKs, PCI-Compliant, 3DS-Secure, use Credit Cards, Apple Pay, Google Pay, Klarna, Affirm, SEPA payments, and all other payment methods provided by [Spree Stripe integration](https://github.com/spree/spree_stripe)
- **Customer Account** - Full account management:
  - Profile management
  - Order history with detailed order view
  - Address book (create, edit, delete)
  - Gift Cards and Store Credit
  - Saved payment methods
- **Multi-Region Support** - Country, currency, and language switching via URL segments, powered by [Spree Markets](https://spreecommerce.org/docs/developer/core-concepts/markets)
- **Responsive Design** - Mobile-first Tailwind CSS styling
- **Google Tag Mananager** and **Google Analytics 4 Ecommerce events** tracking supported natively
- **SEO-ready** - meta tags, JSON-LD, OpenGraph - all built in!
- **Error Tracking** - Sentry integration for both server-side and client-side error monitoring with source maps

## Technology

- **Next.js 16** - App Router, Server Actions, Turbopack
- **React 19** - Latest React with improved Server Components
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Full type safety
- **Sentry** - Error tracking and performance monitoring with source maps
- [@spree/sdk](https://spreecommerce.org/docs/developer/sdk/quickstart) - Official Spree Commerce SDK
- [@spree/next](https://spreecommerce.org/docs/developer/storefront/nextjs/spree-next-package) - Cookie-based auth, middleware, and webhook helpers

## Architecture

This starter follows a **server-first pattern**:

1. **Server-First Architecture** - All API calls happen server-side using Next.js Server Actions
2. **httpOnly Cookies** - Auth tokens and cart tokens are stored securely
3. **No Client-Side API Calls** - The Spree API key is never exposed to the browser
4. **Cache Revalidation** - Uses Next.js cache tags for efficient updates

```
Browser → Server Action → @spree/sdk → Spree API
         (with httpOnly cookies via @spree/next helpers)
```

## Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 16)
- A running Spree Commerce 5.4+

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and configure:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your Spree API credentials:

```env
SPREE_API_URL=http://localhost:3000
SPREE_PUBLISHABLE_KEY=your_publishable_api_key_here
```

> Note: These are server-side only variables (no `NEXT_PUBLIC_` prefix needed).

#### Optional variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GTM_ID` | Google Tag Manager container ID (e.g. `GTM-XXXXXXX`) | _(disabled)_ |
| `SENTRY_DSN` | Sentry DSN for error tracking (e.g. `https://key@o0.ingest.sentry.io/0`) | _(disabled)_ |
| `SENTRY_ORG` | Sentry organization slug (for source map uploads) | _(none)_ |
| `SENTRY_PROJECT` | Sentry project slug (for source map uploads) | _(none)_ |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (for source map uploads in CI) | _(none)_ |
| `SPREE_WEBHOOK_SECRET` | Webhook endpoint secret key (for transactional emails) | _(disabled)_ |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for sending emails in production | _(dev: writes to disk)_ |
| `EMAIL_FROM` | "From" address for transactional emails (e.g. `Store <orders@mystore.com>`) | `orders@example.com` |
| `SENTRY_SEND_DEFAULT_PII` | Send PII (IP addresses, cookies, user data) to Sentry server-side | `false` |
| `NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII` | Send PII to Sentry client-side | `false` |

> **Privacy note:** PII collection is disabled by default. Only set `SENTRY_SEND_DEFAULT_PII` / `NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII` to `true` if you have appropriate user consent or a privacy policy covering this data.

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   └── [country]/[locale]/     # Localized routes
│       ├── account/            # Customer account pages
│       │   ├── addresses/      # Address management
│       │   ├── credit-cards/   # Saved payment methods
│       │   ├── orders/         # Order history
│       │   │   └── [id]/       # Order details
│       │   ├── register/       # Registration
│       │   └── profile/        # Profile settings
│       ├── cart/               # Shopping cart
│       ├── products/           # Product listing
│       │   └── [slug]/         # Product details
│       ├── t/[...permalink]/   # Taxon/category pages
│       └── taxonomies/         # Category overview
├── components/
│   ├── layout/                 # Header, Footer, CountrySwitcher
│   ├── products/               # ProductCard, ProductGrid, Filters
│   └── search/                 # SearchBar
├── contexts/
│   ├── AuthContext.tsx         # Client-side auth state
│   └── CartContext.tsx         # Client-side cart state sync
└── lib/
    ├── spree.ts                # SDK client configuration
    └── data/                   # Server Actions
        ├── addresses.ts        # Address CRUD operations
        ├── cart.ts             # Cart operations
        ├── cookies.ts          # Auth token management
        ├── countries.ts        # Countries/regions list
        ├── credit-cards.ts     # Payment methods
        ├── customer.ts         # Auth & profile
        ├── orders.ts           # Order history
        ├── products.ts         # Product queries
        ├── store.ts            # Store configuration
        └── taxonomies.ts       # Categories/taxons
```

## Server Actions

All data fetching is done through server actions in `src/lib/data/`. These call `@spree/sdk` directly, using `@spree/next` helpers for auth cookies and locale resolution:

```typescript
// Products — uses getLocaleOptions() for locale-aware reads
import { getProducts, getProduct, getProductFilters } from '@/lib/data/products'

const products = await getProducts({ limit: 12 })
const product = await getProduct('product-slug', { expand: ['variants', 'media'] })
const filters = await getProductFilters()

// Cart — uses getCartOptions()/requireCartId() for cart operations
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/lib/data/cart'

const cart = await getCart()
await addToCart('var_xxx', 1)
await updateCartItem('li_xxx', 2)
await removeCartItem('li_xxx')

// Authentication — uses withAuthRefresh() for authenticated endpoints
import { login, register, logout, getCustomer } from '@/lib/data/customer'

const result = await login('user@example.com', 'password')
await register({
  email: 'user@example.com',
  password: 'password',
  password_confirmation: 'password',
  first_name: 'John',
  last_name: 'Doe',
})
const customer = await getCustomer()
await logout()

// Addresses — uses withAuthRefresh() for customer data
import { getAddresses, createAddress, updateAddress, deleteAddress } from '@/lib/data/addresses'

const addresses = await getAddresses()
await createAddress({ first_name: 'John', ... })
```

## Authentication Flow

1. User submits login form
2. Server action calls `@spree/sdk` to authenticate
3. JWT token is stored in an httpOnly cookie via `@spree/next` cookie helpers
4. Subsequent requests use `withAuthRefresh()` which reads the token automatically
5. Token is never accessible to client-side JavaScript

```typescript
// src/lib/data/customer.ts
import { getClient, withAuthRefresh, setAccessToken, setRefreshToken } from '@spree/next'

export async function login(email: string, password: string) {
  const result = await getClient().auth.login({ email, password })
  await setAccessToken(result.token)
  await setRefreshToken(result.refresh_token)
  return { success: true, user: result.user }
}

export async function getCustomer() {
  return withAuthRefresh(async (options) => {
    return getClient().customer.get(options)
  })
}
```

## Multi-Region Support

The storefront supports multiple countries and currencies via URL segments:

```
/us/en/products          # US Market, English language
/de/de/products          # European Market, German language
/uk/en/products          # UK Market, English
```

Use the `CountrySwitcher` component to change [Markets](https://spreecommerce.org/docs/developer/core-concepts/markets).

## Customization

### Styling

The storefront uses Tailwind CSS. Customize the design by modifying:

- `tailwind.config.ts` - Theme configuration
- `src/app/globals.css` - Global styles

### Components

All components are in `src/components/` and can be customized or replaced as needed.

### Data Layer

To customize API behavior, modify the server actions in `src/lib/data/`. These call `@spree/sdk` directly, using `@spree/next` helpers for auth cookies and locale resolution.

## Transactional Emails

Customer-facing emails (order confirmation, shipping notification, password reset) are rendered in the storefront using [react-email](https://react.email) and sent via [Resend](https://resend.com). The Spree backend delivers events to the storefront via webhooks.

### Setup

1. **Create a webhook endpoint** in Spree Admin → Settings → Developers → Webhooks:
   - Subscribe to: `order.completed`, `order.canceled`, `order.shipped`, `customer.password_reset_requested`
   - Copy the secret key

2. **Add environment variables** to `.env.local`:

```env
SPREE_WEBHOOK_SECRET=your_webhook_endpoint_secret_key
RESEND_API_KEY=re_your_resend_api_key        # production only
EMAIL_FROM=Your Store <orders@your-domain.com>  # production only
```

3. **For local development**, use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/) to expose your storefront:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3001
```

Use the tunnel URL as the webhook endpoint URL in Spree Admin. No `RESEND_API_KEY` needed in dev — emails are rendered to HTML files in `.next/emails/` with a `file://` link logged to the console.

### Email Templates

Templates are in `src/lib/emails/` as React components:

| Template | Event | Description |
|----------|-------|-------------|
| `order-confirmation.tsx` | `order.completed` | Order placed with items, totals, addresses |
| `order-canceled.tsx` | `order.canceled` | Cancellation notice |
| `shipment-shipped.tsx` | `order.shipped` | Shipping notification with tracking link |
| `password-reset.tsx` | `customer.password_reset_requested` | Password reset link |

### Previewing Templates

```bash
npm run email:dev
```

Opens the [react-email](https://react.email) dev server with all templates and mock data for live preview.

### How It Works

```
Spree Backend → Webhook POST → /api/webhooks/spree → render email → send via Resend
                (signed HMAC)   (signature verified)   (react-email)   (or write to disk in dev)
```

The webhook route handler (`src/app/api/webhooks/spree/route.ts`) uses `createWebhookHandler` from `@spree/next/webhooks` — signature verification and event routing are handled automatically.

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables:
   - `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` (required)
   - `SPREE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` (for transactional emails)
   - `GTM_ID` (optional — Google Tag Manager)
   - `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (optional — for error tracking with readable stack traces)
4. Deploy

## License

MIT
