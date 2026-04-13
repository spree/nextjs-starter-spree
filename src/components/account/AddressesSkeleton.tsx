/**
 * Skeleton mirroring `account/addresses/page.tsx` + `AddressManagement.tsx`:
 *  - Title bar: h1 `text-2xl` (32px) + mb-6
 *  - Add button row: mb-6, default Button h-11
 *  - Grid `grid-cols-1 md:grid-cols-2 gap-4` of address cards
 *  - Each card: `rounded-xl border p-6` with `flex justify-between items-start`
 *    → address block (text-sm space-y-0.5, 4 lines) + Edit/Delete buttons
 */
function AddressCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        {/* Address lines: text-sm (20px) space-y-0.5 (2px) */}
        <div className="space-y-0.5 flex-1 min-w-0">
          {/* full_name font-medium */}
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          {/* address1 */}
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          {/* city, state zip */}
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          {/* country */}
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Edit (link sm) + Delete (destructive sm), gap-2 */}
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AddressesSkeleton() {
  return (
    <div>
      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Add address button (default size h-11) */}
      <div className="mb-6">
        <div className="h-11 w-40 bg-gray-200 rounded-md animate-pulse" />
      </div>

      {/* Grid of address cards — 2 items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddressCardSkeleton />
        <AddressCardSkeleton />
      </div>
    </div>
  );
}
