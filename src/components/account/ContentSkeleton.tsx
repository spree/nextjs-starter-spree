/**
 * Generic fallback skeleton for protected account sub-pages that don't yet have
 * a dedicated skeleton (mirrors a simple header + two content blocks layout).
 */
export function ContentSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  );
}
