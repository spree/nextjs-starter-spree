"use client";

import type { Product, Image as SpreeImage, Variant } from "@spree/sdk";
import { CircleCheckBig, CircleX, Loader2, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { MediaGallery } from "@/components/products/MediaGallery";
import { VariantPicker } from "@/components/products/VariantPicker";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { trackAddToCart } from "@/lib/analytics/gtm";

interface ProductDetailsProps {
  product: Product;
  basePath: string;
}

export function ProductDetails({ product, basePath }: ProductDetailsProps) {
  const { addItem } = useCart();
  const { currency } = useStore();

  // Filter out master variant from variants list
  const variants = useMemo(() => {
    return (product.variants || []).filter((v) => !v.is_master);
  }, [product.variants]);

  const hasVariants = variants.length > 0;
  const optionTypes = product.option_types || [];

  // Initialize with default variant or first available variant
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    if (product.default_variant && !product.default_variant.is_master) {
      return product.default_variant;
    }
    if (hasVariants) {
      return variants.find((v) => v.purchasable) || variants[0];
    }
    // For products without variants, use master variant
    return product.master_variant || product.default_variant || null;
  });

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Get images for the gallery - variant images take priority
  const galleryImages = useMemo((): SpreeImage[] => {
    // If selected variant has images, show those
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    // Otherwise show product images
    return product.images || [];
  }, [selectedVariant, product.images]);

  // Get pricing info from selected variant or product (using nested price objects)
  const price = selectedVariant?.price ?? product.price;
  const originalPrice =
    selectedVariant?.original_price ?? product.original_price;
  const displayPrice = price?.display_amount;

  // Compute on_sale locally: item is on sale if current price is less than original price
  // or if compare_at_amount is set (manual markdown)
  // Use amount_in_cents for comparison (integers, no floating point issues)
  const currentAmountCents = price?.amount_in_cents;
  const originalAmountCents = originalPrice?.amount_in_cents;
  const compareAtAmountCents = price?.compare_at_amount_in_cents;
  const onSale =
    (currentAmountCents != null &&
      originalAmountCents != null &&
      currentAmountCents < originalAmountCents) ||
    (compareAtAmountCents != null &&
      currentAmountCents != null &&
      currentAmountCents < compareAtAmountCents);

  // Strikethrough price: show original_price if different from current, or compare_at_amount for manual markdowns
  const strikethroughPrice = onSale
    ? originalPrice?.display_amount !== displayPrice
      ? originalPrice?.display_amount
      : price?.display_compare_at_amount
    : null;

  // Purchasability
  const isPurchasable = hasVariants
    ? (selectedVariant?.purchasable ?? false)
    : (product.purchasable ?? false);

  const inStock = hasVariants
    ? (selectedVariant?.in_stock ?? false)
    : (product.in_stock ?? false);

  const handleAddToCart = async () => {
    const variantId =
      selectedVariant?.id ||
      product.default_variant?.id ||
      product.default_variant_id;
    if (!variantId) {
      throw new Error("No variant selected");
    }

    setLoading(true);
    try {
      await addItem(variantId, quantity);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return;
    } finally {
      setLoading(false);
    }
    trackAddToCart(product, selectedVariant, quantity, currency);
  };

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
                <CircleCheckBig className="w-5 h-5" />
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <CircleX className="w-5 h-5" />
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
              <QuantityPicker
                quantity={quantity}
                onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrement={() => setQuantity(quantity + 1)}
                size="lg"
              />

              {/* Add to Cart Button */}
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={loading || !isPurchasable}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Adding...
                  </>
                ) : isPurchasable ? (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart
                  </>
                ) : (
                  "Out of Stock"
                )}
              </Button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Description
              </h2>
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
                  <dd className="text-gray-900 text-sm">
                    {selectedVariant.sku}
                  </dd>
                </div>
              )}
              {selectedVariant?.options_text && (
                <div className="flex">
                  <dt className="w-32 text-gray-500 text-sm">Options</dt>
                  <dd className="text-gray-900 text-sm">
                    {selectedVariant.options_text}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
