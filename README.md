# Spree Next.js Storefront

A modern e-commerce storefront built with Next.js 15 and the Spree Commerce SDK.

## Features

- Product Catalog - Browse and search products
- Product Details - View product information with images
- Shopping Cart - Add, update, and remove items
- Categories - Browse products by taxonomy
- Responsive Design - Mobile-first Tailwind CSS styling

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
NEXT_PUBLIC_SPREE_API_URL=http://localhost:3000
NEXT_PUBLIC_SPREE_API_KEY=your_publishable_api_key_here
```

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
├── app/                    # Next.js App Router pages
│   ├── account/           # Account pages
│   ├── cart/              # Shopping cart
│   ├── categories/        # Category listing
│   ├── products/          # Product listing & details
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── layout/            # Header, Footer
│   └── products/          # Product cards, grids
├── contexts/
│   └── CartContext.tsx    # Cart state management
└── lib/
    └── spree.ts           # Spree SDK client
```

## SDK Usage

The storefront uses the `@spree/sdk` package for all API interactions:

```typescript
import { getSpreeClient } from '@/lib/spree'

// List products
const client = getSpreeClient()
const { data: products } = await client.products.list({ per_page: 12 })

// Get a product by slug
const product = await client.products.get('product-slug', { includes: 'variants,images' })

// Create a cart
const cart = await client.orders.create()

// Add item to cart
await client.lineItems.create(cartId, { variant_id: 'var_xxx', quantity: 1 }, { orderToken })
```

## Customization

### Styling

The storefront uses Tailwind CSS. Customize the design by modifying:

- `tailwind.config.ts` - Theme configuration
- `src/app/globals.css` - Global styles

### Components

All components are in `src/components/` and can be customized or replaced as needed.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## License

BSD-3-Clause
