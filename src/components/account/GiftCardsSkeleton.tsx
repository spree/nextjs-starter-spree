/**
 * Skeleton mirroring `account/gift-cards/page.tsx` + `GiftCardList.tsx`:
 *  - h1 `text-2xl font-bold` (32px) + `mb-6`
 *  - Active cards section: h2 text-lg (28px) + `mb-4`, then `space-y-4` list of GiftCardItems
 *    - Each item: `rounded-xl border p-6` with header row (code + copy + status badge | amount right)
 *      and progress bar section
 *  - Help text footer: `mt-6 p-4 bg-gray-50 rounded-xl` with text-sm
 */
function GiftCardItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            {/* code font-mono text-lg = 28px */}
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
            {/* Copy button size="sm" = h-9 */}
            <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
            {/* status badge: px-2.5 py-0.5 rounded-lg text-xs ≈ 20px */}
            <div className="h-5 w-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          {/* expires p text-sm mt-1 */}
          <div className="mt-1 h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="text-right">
          {/* amount_remaining text-2xl = 32px */}
          <div className="h-8 w-24 bg-gray-200 rounded ml-auto animate-pulse" />
          {/* "remaining" label text-sm */}
          <div className="mt-0.5 h-5 w-20 bg-gray-200 rounded ml-auto animate-pulse" />
        </div>
      </div>

      {/* Progress bar section mb-4 */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* bar h-2 rounded-lg */}
        <div className="w-full bg-gray-200 rounded-lg h-2 animate-pulse" />
        {/* percent used text-xs = 16px */}
        <div className="mt-1 h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function GiftCardsSkeleton() {
  return (
    <div>
      {/* h1 Gift cards */}
      <div className="h-8 w-40 bg-gray-200 rounded mb-6 animate-pulse" />

      {/* Active cards section */}
      <div className="mb-8">
        {/* h2 text-lg font-semibold + mb-4 */}
        <div className="h-7 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          <GiftCardItemSkeleton />
          <GiftCardItemSkeleton />
        </div>
      </div>

      {/* Help text footer: mt-6 p-4 bg-gray-50 rounded-xl */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
