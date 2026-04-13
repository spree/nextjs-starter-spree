/**
 * Generic fallback skeleton for auth pages without a dedicated skeleton yet
 * (forgot-password, reset-password). Kept minimal and centered to match the
 * `max-w-md mx-auto py-16` container used by those pages.
 */
export function AuthFallbackSkeleton(): React.JSX.Element {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="animate-pulse motion-reduce:animate-none space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
