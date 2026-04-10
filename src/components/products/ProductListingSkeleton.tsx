import { FilterBarSkeleton } from "@/components/products/filters";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

/**
 * Full PLP skeleton mirroring the layout rendered by ProductListing:
 * a horizontal FilterBar strip above the product grid. Used as the
 * Suspense fallback so route navigation and filter/sort changes show
 * a placeholder with the same shape as the final UI.
 */
export function ProductListingSkeleton() {
  return (
    <>
      <FilterBarSkeleton />
      <ProductGridSkeleton />
    </>
  );
}
