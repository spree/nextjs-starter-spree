/**
 * Skeleton mirroring `account/profile/page.tsx`:
 *  - h1 (text-2xl = 32px line-height, mb-6)
 *  - Form card: p-6 space-y-6 (first/last grid + email field), footer with save button
 *  - Account info card: header (text-lg = 28px) + 2-col grid of label/value pairs
 */
export function ProfileSkeleton() {
  return (
    <div>
      {/* h1 Profile */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* first / last name grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
          </div>
          {/* email */}
          <div className="flex flex-col gap-2">
            <div className="h-5 bg-gray-200 rounded w-28 animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
          </div>
        </div>
        {/* Save button footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <div className="h-11 w-32 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Account info card */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          {/* h2 Account Information (text-lg = 28px) */}
          <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="mt-1 h-5 bg-gray-200 rounded w-40 animate-pulse" />
            </div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
              <div className="mt-1 h-5 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
