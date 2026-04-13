/**
 * Skeleton mirroring `(storefront)/cart/page.tsx` (2-item scenario):
 *  - h1 `text-3xl font-bold` (36px line-height), `mb-8`
 *  - Grid `lg:grid-cols-3 gap-8`: items card (col-span-2) + summary sidebar (col-span-1)
 *  - Items: `rounded-xl border divide-y`, each row `p-6 flex gap-6` with
 *    image (w-24 h-24), details (title text-lg + options text-sm + price text-lg),
 *    and actions (QuantityPicker h-9 + Remove button sm h-9)
 *  - Summary: `sticky top-24 p-6 rounded-xl border` with header, subtotal/total rows,
 *    and CTA buttons (Button size="lg" h-13 + Button variant="link" h-11)
 */
export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8  py-8">
      {/* h1 "Shopping cart" — text-3xl line-height 36px, mb-8 */}
      <div className="h-9 bg-gray-200 rounded w-56 mb-8 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list (2 rows) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {[0, 1].map((i) => (
              <div key={i} className="p-6 flex gap-6">
                {/* Image w-24 h-24 rounded-xl */}
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 animate-pulse" />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* title text-lg = 28px */}
                  <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse" />
                  {/* options text-sm, mt-1 */}
                  <div className="mt-1 h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                  {/* price text-lg, mt-2 */}
                  <div className="mt-2 h-7 bg-gray-200 rounded w-20 animate-pulse" />
                </div>

                {/* Quantity + Remove */}
                <div className="flex flex-col items-end gap-2">
                  {/* QuantityPicker ~h-9 */}
                  <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                  {/* Remove Button size="sm" h-9 */}
                  <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            {/* h2 text-lg = 28px */}
            <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />

            <div className="mt-6 space-y-4">
              {/* Subtotal row — text-base line-height 24 */}
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              {/* Total row — border-t pt-4, text-lg = 28 */}
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <div className="h-7 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {/* Button size="lg" h-13 rounded-lg */}
              <div className="h-13 bg-gray-200 rounded-lg w-full animate-pulse" />
              {/* Button variant="link" size default h-11 */}
              <div className="h-11 bg-gray-200 rounded-md w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
