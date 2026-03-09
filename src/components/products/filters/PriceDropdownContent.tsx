import type { PriceBucket } from "@/lib/utils/price-buckets";
import { findMatchingBucket } from "@/lib/utils/price-buckets";
import type { ActiveFilters } from "@/types/filters";

interface PriceDropdownContentProps {
  priceBuckets: PriceBucket[];
  activeFilters: ActiveFilters;
  onPriceChange: (min?: number, max?: number) => void;
}

export function PriceDropdownContent({
  priceBuckets,
  activeFilters,
  onPriceChange,
}: PriceDropdownContentProps) {
  const selectedBucket = findMatchingBucket(
    priceBuckets,
    activeFilters.priceMin,
    activeFilters.priceMax,
  );

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-2">Price Range</p>
      <ul className="space-y-1">
        {priceBuckets.map((bucket) => {
          const isSelected = selectedBucket?.id === bucket.id;
          return (
            <li key={bucket.id}>
              <button
                onClick={() => {
                  if (isSelected) {
                    onPriceChange(undefined, undefined);
                  } else {
                    onPriceChange(bucket.min, bucket.max);
                  }
                }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {bucket.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
