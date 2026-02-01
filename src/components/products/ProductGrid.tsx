import type { StoreProduct } from '@spree/sdk'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: StoreProduct[]
  basePath?: string
}

export function ProductGrid({ products, basePath = '' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} basePath={basePath} />
      ))}
    </div>
  )
}
