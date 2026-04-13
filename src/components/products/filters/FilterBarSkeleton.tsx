/**
 * Skeleton mirroring the loaded `FilterBar` shape:
 *  - Wrapper `mb-6`
 *  - Desktop (`hidden md:flex items-center justify-between pb-4 border-b`):
 *    left cluster of filter dropdowns (h-9) + right cluster with count (text-sm) + sort
 *  - Mobile (`flex items-center gap-3 md:hidden pb-4 border-b`):
 *    filters button (h-10) + sort dropdown (h-9)
 */
export function FilterBarSkeleton() {
  return (
    <div className="mb-6">
      <div className="hidden md:flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          {/* "X products" count text-sm */}
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          {/* Sort dropdown */}
          <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-3 md:hidden pb-4 border-b border-gray-100">
        {/* Filters button: px-4 py-2 text-sm rounded-lg border = ~h-10 */}
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="ml-auto h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
