/**
 * Skeleton matching the horizontal FilterBar's desktop layout (filter
 * chips on the left, sort on the right). Rendered by FilterBar's own
 * loading state and by the PLP Suspense fallback.
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
      <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
      <div className="ml-auto h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  );
}
