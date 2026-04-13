/**
 * Skeleton mirroring the cart drawer items list (inside `SheetContent`).
 * Renders 2 placeholder rows — each `flex gap-4` with a w-24 h-24 image block
 * and two text lines (matching the drawer's loaded item layout).
 */
export function CartDrawerSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
