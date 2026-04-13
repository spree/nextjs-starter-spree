/**
 * Skeleton mirroring `order-placed/[id]/page.tsx` (2 items scenario):
 *  - Success header (text-center mb-10): check icon (w-16 h-16) + thanks h1 (text-2xl)
 *    + order number (text-base) + email confirmation note (text-sm mt-2)
 *  - Order items card (rounded-xl border mb-6): header (text-lg) + list (divide-y)
 *    + totals footer (border-t)
 *  - Shipping & payment card: 2-col grid with icon/text pairs
 *  - Contact & addresses card: 2-col grid + email footer
 *  - Continue shopping Button (size="lg" h-13)
 */
export function OrderPlacedSkeleton() {
  return (
    <div className="py-8 max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
        <div className="h-8 w-72 max-w-full bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-6 w-40 bg-gray-200 rounded mx-auto animate-pulse" />
        <div className="mt-2 h-5 w-56 bg-gray-200 rounded mx-auto animate-pulse" />
      </div>

      {/* Order Items card — 2 items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <ul className="divide-y divide-gray-200">
          {[0, 1].map((i) => (
            <li key={i} className="px-6 py-4 flex gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="mt-1 h-5 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </li>
          ))}
        </ul>
        {/* Totals footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Payment card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* Shipping method */}
          <div className="px-6 py-4">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="mt-0.5 h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* Payment */}
          <div className="px-6 py-4">
            <div className="h-5 w-20 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="mt-0.5 h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Addresses card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {[0, 1].map((i) => (
            <div key={i} className="px-6 py-4">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="space-y-0.5">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="h-5 w-72 max-w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Continue shopping button */}
      <div className="text-center">
        <div className="h-13 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse" />
      </div>
    </div>
  );
}
