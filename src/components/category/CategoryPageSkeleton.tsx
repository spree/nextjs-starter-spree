import { FilterBarSkeleton } from "@/components/products/filters/FilterBarSkeleton";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

/**
 * Full-page skeleton mirroring `/c/[...permalink]/page.tsx`:
 *  - Banner `min-h-[350px] flex flex-col justify-end bg-gray-50` with Breadcrumbs,
 *    h1 (text-4xl), optional description — all bottom-anchored inside container
 *  - Subcategories strip `container mt-4` + `flex flex-wrap gap-2 border-b pb-4`
 *  - Products section `container pt-4` with FilterBar + ProductGridSkeleton
 */
export function CategoryPageSkeleton() {
  return (
    <div>
      {/* Banner */}
      <div className="min-h-[350px] flex flex-col justify-end bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs (nav mb-6, ol text-sm = 20px) */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* h1 text-4xl = 40px line-height, mb-4 wrapper */}
          <div className="mb-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Description p text-base (24px), mb-4 */}
          <div className="h-6 w-96 max-w-full bg-gray-200 rounded mb-4 animate-pulse" />
        </div>
      </div>

      {/* Subcategories */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex flex-wrap gap-2 items-center border-b border-gray-100 pb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <FilterBarSkeleton />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
