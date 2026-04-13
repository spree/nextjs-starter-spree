/**
 * Skeleton mirroring `checkout/[id]/page.tsx` main content:
 *  - Contact (h2 text-lg + mb-3 + email input, mb-6)
 *  - Shipping address (h2 + 7 rows: country, first/last grid, address, apartment,
 *    city/state/zip grid, phone — all h-11 with `gap-3`)
 *  - Shipping method (mt-6, h2 + gray placeholder box)
 *  - Payment (mt-6, h2 + subline + note + bordered container with header + form area)
 *  - Pay now button (mt-8, h-[54px] rounded-sm)
 *
 * Headings use `text-lg font-bold` (28px = h-7), inputs `h-11`, button `h-[54px]`.
 * Company and policy consent intentionally omitted (optional / guest-only — avoids
 * layout shift across authed vs guest flows).
 */
export function CheckoutPageSkeleton() {
  return (
    <div>
      {/* Contact */}
      <div className="mb-6">
        <div className="h-7 bg-gray-200 rounded w-48 mb-3 animate-pulse" />
        <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
      </div>

      {/* Shipping address */}
      <div>
        <div className="h-7 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
        <div className="flex flex-col gap-3">
          {/* Country */}
          <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          {/* First / Last */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          </div>
          {/* Address */}
          <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          {/* Apartment */}
          <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          {/* City / State / Zip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          </div>
          {/* Phone */}
          <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
        </div>
      </div>

      {/* Shipping method */}
      <div className="mt-6">
        <div className="h-7 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
        {/* gray placeholder box (px-4 py-3.5 + text-sm line 20 = ~48px) */}
        <div className="h-12 bg-gray-100 rounded-sm animate-pulse" />
      </div>

      {/* Payment method */}
      <div className="mt-6">
        <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
        {/* "Secure transactions" subline (text-sm, mt-0.5) */}
        <div className="h-5 bg-gray-200 rounded w-56 mt-0.5 animate-pulse" />
        {/* "Test card note" (text-xs, mb-3) */}
        <div className="h-4 bg-gray-200 rounded w-48 mt-0.5 mb-3 animate-pulse" />
        <div className="rounded-sm border border-gray-200 overflow-hidden">
          <div className="h-12 bg-blue-50 animate-pulse" />
          <div className="h-48 bg-gray-50 border-t border-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Pay now button (h-[54px]) */}
      <div className="w-full mt-8 h-[54px] bg-gray-200 rounded-sm animate-pulse" />
    </div>
  );
}
