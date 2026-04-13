/**
 * Skeleton mirroring `account/orders/page.tsx` + `OrderList.tsx`:
 *  - h1 `text-2xl font-bold` (32px line-height) + `mb-6`
 *  - Table card (`rounded-xl border`): thead bg-gray-50 with 6 cols (text-xs uppercase, py-3),
 *    tbody with 3 rows (px-6 py-4, text-sm or rounded-lg badges).
 */
export function OrdersListSkeleton() {
  return (
    <div>
      {/* h1 Order history */}
      <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* 6 columns: Order / Date / Payment / Shipment / Total / Actions */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  {/* #number (text-sm) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  </td>
                  {/* date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  </td>
                  {/* payment badge: px-2.5 py-0.5 rounded-lg text-xs ≈ 20px */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-20 bg-gray-200 rounded-lg animate-pulse" />
                  </td>
                  {/* shipment badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-20 bg-gray-200 rounded-lg animate-pulse" />
                  </td>
                  {/* total (right) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-5 w-16 bg-gray-200 rounded ml-auto animate-pulse" />
                  </td>
                  {/* view link (right) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-5 w-12 bg-gray-200 rounded ml-auto animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
