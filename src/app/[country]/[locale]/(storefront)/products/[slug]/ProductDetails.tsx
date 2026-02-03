'use client'

import { useState, useMemo, useEffect } from 'react'
import type { StoreProduct, StoreVariant, StoreImage } from '@spree/sdk'
import { MediaGallery } from '@/components/products/MediaGallery'
import { VariantPicker } from '@/components/products/VariantPicker'
import { useCart } from '@/contexts/CartContext'
import { useStore } from '@/contexts/StoreContext'

interface ProductDetailsProps {
  product: StoreProduct
  basePath: string
}

export function ProductDetails({ product, basePath }: ProductDetailsProps) {
  const { addItem } = useCart()
  const { currency } = useStore()

  // Filter out master variant from variants list
  const variants = useMemo(() => {
    return (product.variants || []).filter(v => !v.is_master)
  }, [product.variants])

  const hasVariants = variants.length > 0
  const optionTypes = product.option_types || []

  // Initialize with default variant or first available variant
  const [selectedVariant, setSelectedVariant] = useState<StoreVariant | null>(() => {
    if (product.default_variant && !product.default_variant.is_master) {
      return product.default_variant
    }
    if (hasVariants) {
      return variants.find(v => v.purchasable) || variants[0]
    }
    // For products without variants, use master variant
    return product.master_variant || product.default_variant || null
  })

  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  // Get images for the gallery - variant images take priority
  const galleryImages = useMemo((): StoreImage[] => {
    // If selected variant has images, show those
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images
    }
    // Otherwise show product images
    return product.images || []
  }, [selectedVariant, product.images])

  // Get pricing info from selected variant or product (using nested price objects)
  const price = selectedVariant?.price ?? product.price
  const originalPrice = selectedVariant?.original_price ?? product.original_price
  const displayPrice = price?.display_amount

  // Compute on_sale locally: item is on sale if current price is less than original price
  // or if compare_at_amount is set (manual markdown)
  // Use amount_in_cents for comparison (integers, no floating point issues)
  const currentAmountCents = price?.amount_in_cents
  const originalAmountCents = originalPrice?.amount_in_cents
  const compareAtAmountCents = price?.compare_at_amount_in_cents
  const onSale = (currentAmountCents != null && originalAmountCents != null && currentAmountCents < originalAmountCents) ||
                 (compareAtAmountCents != null && currentAmountCents != null && currentAmountCents < compareAtAmountCents)

  // Strikethrough price: show original_price if different from current, or compare_at_amount for manual markdowns
  const strikethroughPrice = onSale
    ? (originalPrice?.display_amount !== displayPrice
        ? originalPrice?.display_amount
        : price?.display_compare_at_amount)
    : null

  // Purchasability
  const isPurchasable = hasVariants
    ? (selectedVariant?.purchasable ?? false)
    : (product.purchasable ?? false)

  const inStock = hasVariants
    ? (selectedVariant?.in_stock ?? false)
    : (product.in_stock ?? false)

  const handleAddToCart = async () => {
    const variantId = selectedVariant?.id || product.default_variant?.id
    if (!variantId) return

    setLoading(true)
    try {
      await addItem(variantId, quantity)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update selected variant when option changes - also select first matching options if none selected
  useEffect(() => {
    if (hasVariants && !selectedVariant && optionTypes.length > 0) {
      const firstPurchasable = variants.find(v => v.purchasable)
      if (firstPurchasable) {
        setSelectedVariant(firstPurchasable)
      }
    }
  }, [hasVariants, selectedVariant, variants, optionTypes.length])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Media Gallery */}
        <div>
          <MediaGallery images={galleryImages} productName={product.name} />
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Price */}
          <div className="mt-4 flex items-center gap-4">
            {displayPrice && (
              <span className="text-3xl font-bold text-gray-900">
                {displayPrice}
              </span>
            )}
            {onSale && strikethroughPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  {strikethroughPrice}
                </span>
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  Sale
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-4">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Out of Stock
              </span>
            )}
          </div>

          {/* Variant Picker */}
          {hasVariants && optionTypes.length > 0 && (
            <div className="mt-8">
              <VariantPicker
                variants={variants}
                optionTypes={optionTypes}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="mt-8">
            <div className="flex gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-4 py-3 font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={loading || !isPurchasable}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                  ${isPurchasable
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </>
                ) : isPurchasable ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Add to Cart
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
              <div
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Product Details */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              {selectedVariant?.sku && (
                <div className="flex">
                  <dt className="w-32 text-gray-500 text-sm">SKU</dt>
                  <dd className="text-gray-900 text-sm">{selectedVariant.sku}</dd>
                </div>
              )}
              {selectedVariant?.options_text && (
                <div className="flex">
                  <dt className="w-32 text-gray-500 text-sm">Options</dt>
                  <dd className="text-gray-900 text-sm">{selectedVariant.options_text}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
