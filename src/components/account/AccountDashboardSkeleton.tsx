import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton mirroring `account/page.tsx` (dashboard overview):
 *  - h1 `text-2xl` (32px line-height), `mb-6`
 *  - 2×2 grid of Cards (`grid-cols-1 md:grid-cols-2 gap-6`), each Card wraps
 *    CardContent (py-0) with an icon box (`p-3 rounded-xl`, size-6 icon = 48px)
 *    and a text column (h2 text-lg + mt-1 description text-sm)
 */
export function AccountDashboardSkeleton() {
  return (
    <div>
      {/* h1 Account overview */}
      <div className="h-8 bg-gray-200 rounded w-56 mb-6 animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-0">
              {/* Icon box: p-3 (12px) + size-6 icon (24px) = 48px square */}
              <div className="size-12 bg-gray-100 rounded-xl flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                {/* h2 text-lg = 28px line-height */}
                <div className="h-7 bg-gray-200 rounded w-32 animate-pulse" />
                {/* description text-sm, mt-1 */}
                <div className="mt-1 h-5 bg-gray-200 rounded w-48 max-w-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
