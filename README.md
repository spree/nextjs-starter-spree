# Spree Next.js Storefront

A modern, headless e-commerce storefront built with Next.js 15 and the Spree Commerce API v3.

## Features

- **Server-First Architecture** - All API calls happen server-side using Next.js Server Actions
- **Secure Authentication** - JWT tokens stored in httpOnly cookies (not localStorage)
- **Product Catalog** - Browse, search, and filter products with faceted navigation
- **Product Details** - View product information with variant selection and images
- **Shopping Cart** - Add, update, and remove items with server-side state
- **Categories** - Browse products by taxonomy with nested category support
- **Customer Account** - Full account management:
  - Profile management
  - Order history with detailed order view
  - Address book (create, edit, delete)
  - Saved payment methods
- **Multi-Region Support** - Country and currency switching via URL segments
- **Responsive Design** - Mobile-first Tailwind CSS styling

## Architecture

This starter follows a **server-first pattern** similar to Medusa.js:

1. **Server Actions** (`src/lib/data/`) - All API calls are made server-side
2. **httpOnly Cookies** - Auth tokens and cart tokens are stored securely
3. **No Client-Side API Calls** - The Spree API key is never exposed to the browser
4. **Cache Revalidation** - Uses Next.js cache tags for efficient updates

```
Browser → Server Action → Spree API
         (with httpOnly cookies)
```

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- A running Spree Commerce backend with API v3 enabled

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
SPREE_API_KEY=your_publishable_api_key_here
```

> Note: These are server-side only variables (no `NEXT_PUBLIC_` prefix needed).

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

All data fetching is done through server actions in `src/lib/data/`:

```typescript
// Products
import { getProducts, getProduct, getProductFilters } from '@/lib/data/products'

const products = await getProducts({ per_page: 12 })
const product = await getProduct('product-slug', { includes: 'variants,images' })
const filters = await getProductFilters({ taxon_id: 'txn_xxx' })

// Cart
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/lib/data/cart'

const cart = await getCart()
await addToCart('var_xxx', 1)
await updateCartItem('li_xxx', 2)
await removeCartItem('li_xxx')

// Authentication
import { login, register, logout, getCustomer } from '@/lib/data/customer'

const result = await login('user@example.com', 'password')
const customer = await getCustomer()
await logout()

// Addresses
import { getAddresses, createAddress, updateAddress, deleteAddress } from '@/lib/data/addresses'

const addresses = await getAddresses()
await createAddress({ firstname: 'John', ... })
```

## Authentication Flow

1. User submits login form
2. Server action calls Spree API with credentials
3. JWT token is stored in an httpOnly cookie
4. Subsequent requests include the token automatically
5. Token is never accessible to client-side JavaScript

```typescript
// src/lib/data/cookies.ts
export async function setAuthToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('_spree_jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
```

## Multi-Region Support

The storefront supports multiple countries and currencies via URL segments:

```
/us/en/products          # US store, English
/de/de/products          # German store, German
/uk/en/products          # UK store, English
```

Use the `CountrySwitcher` component to change regions.

## Customization

### Styling

The storefront uses Tailwind CSS. Customize the design by modifying:

- `tailwind.config.ts` - Theme configuration
- `src/app/globals.css` - Global styles

### Components

All components are in `src/components/` and can be customized or replaced as needed.

### Data Layer

To customize API behavior, modify the server actions in `src/lib/data/`.

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables (`SPREE_API_URL`, `SPREE_API_KEY`)
4. Deploy

## License

BSD-3-Clause
