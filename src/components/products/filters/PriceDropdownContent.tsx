import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenuRadioGroup
      value={selectedBucket?.id ?? ""}
      onValueChange={(value) => {
        if (!value) {
          onPriceChange(undefined, undefined);
        } else {
          const bucket = priceBuckets.find((b) => b.id === value);
          if (bucket) {
            onPriceChange(bucket.min, bucket.max);
          }
        }
      }}
    >
      {priceBuckets.map((bucket) => (
        <DropdownMenuRadioItem
          key={bucket.id}
          value={bucket.id}
          onSelect={(e) => e.preventDefault()}
        >
          {bucket.label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
