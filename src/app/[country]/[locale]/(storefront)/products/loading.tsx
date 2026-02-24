import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
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
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Product grid skeleton */}
        <div className="lg:col-span-3">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
