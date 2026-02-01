import Link from "next/link";
import Image from "next/image";
import type { StoreProduct } from "@spree/sdk";

interface ProductCardProps {
  product: StoreProduct;
  basePath?: string;
}

export function ProductCard({ product, basePath = '' }: ProductCardProps) {
  const imageUrl = product.thumbnail_url || null;

  // Current display price
  const displayPrice = product.price?.display_amount;

  // Compute on_sale locally: product is on sale if current price is less than original price
  // or if compare_at_amount is set (manual markdown)
  // Use amount_in_cents for comparison (integers, no floating point issues)
  const currentAmountCents = product.price?.amount_in_cents;
  const originalAmountCents = product.original_price?.amount_in_cents;
  const compareAtAmountCents = product.price?.compare_at_amount_in_cents;
  const onSale = (currentAmountCents != null && originalAmountCents != null && currentAmountCents < originalAmountCents) ||
                 (compareAtAmountCents != null && currentAmountCents != null && currentAmountCents < compareAtAmountCents);

  // Strikethrough price: show original_price if different from current, or compare_at_amount for manual markdowns
  const strikethroughPrice = onSale
    ? (product.original_price?.display_amount !== displayPrice
        ? product.original_price?.display_amount
        : product.price?.display_compare_at_amount)
    : null;

  return (
    <Link
      href={`${basePath}/products/${product.slug}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            Sale
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          {displayPrice && (
            <span className="text-lg font-semibold text-gray-900">
              {displayPrice}
            </span>
          )}
          {onSale && strikethroughPrice && (
            <span className="text-sm text-gray-500 line-through">
              {strikethroughPrice}
            </span>
          )}
        </div>

        {!product.purchasable && (
          <span className="mt-2 text-sm text-gray-500">Out of Stock</span>
        )}
      </div>
    </Link>
  );
}
