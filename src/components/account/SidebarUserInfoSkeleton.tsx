/**
 * Skeleton for the sidebar user-info block inside `AccountShell`.
 * Matches adjacent <p> line-heights (text-base = 24px, text-sm = 20px, no gap).
 */
export function SidebarUserInfoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 flex items-center">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="h-5 flex items-center">
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>
    </div>
  );
}
