/**
 * Skeleton mirroring `account/credit-cards/page.tsx` + `CreditCardList.tsx`:
 *  - h1 `text-2xl font-bold` (32px) + `mb-6`
 *  - Card list: `space-y-4` of `rounded-xl border p-6` items with
 *    [PaymentIcon(48x32) + label/expiry] | [Remove button h-9]
 *  - Help text footer: `mt-6 p-4 bg-gray-50 rounded-xl` with text-sm
 */
function CreditCardItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {/* PaymentIcon width=48, flatRounded aspect ≈ 48×30 */}
          <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
          <div>
            {/* "Visa ending in 4242" text-sm */}
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            {/* expires text-xs = 16px */}
            <div className="mt-0.5 h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Remove button size="sm" = h-9 */}
        <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

export function CreditCardsSkeleton() {
  return (
    <div>
      {/* h1 Payment methods */}
      <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />

      {/* Card list space-y-4 — 2 items */}
      <div className="space-y-4">
        <CreditCardItemSkeleton />
        <CreditCardItemSkeleton />
      </div>

      {/* Help text footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
