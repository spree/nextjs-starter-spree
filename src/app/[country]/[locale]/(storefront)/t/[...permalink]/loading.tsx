import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

export default function CategoryLoading() {
  return (
    <div>
      {/* Banner skeleton */}
      <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-200 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </div>

        {/* Filter button skeleton (mobile) */}
        <div className="lg:hidden mb-4">
          <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar skeleton (desktop) */}
          <div className="hidden lg:block space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Product grid skeleton */}
          <div className="lg:col-span-3">
            <ProductGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
