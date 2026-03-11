"use client";

import type { OptionFilter, ProductFiltersResponse } from "@spree/sdk";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVAILABILITY_LABELS } from "@/lib/utils/filters";
import {
  findMatchingBucket,
  type PriceBucket,
} from "@/lib/utils/price-buckets";
import type { ActiveFilters } from "@/types/filters";

interface FilterChipsProps {
  activeFilters: ActiveFilters;
  filtersData: ProductFiltersResponse | null;
  priceBuckets: PriceBucket[];
  onRemoveOptionValue: (optionValueId: string) => void;
  onRemovePrice: () => void;
  onRemoveAvailability: () => void;
  onClearAll: () => void;
}

export function FilterChips({
  activeFilters,
  filtersData,
  priceBuckets,
  onRemoveOptionValue,
  onRemovePrice,
  onRemoveAvailability,
  onClearAll,
}: FilterChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filtersData) {
    for (const optionValueId of activeFilters.optionValues) {
      const optionFilter = filtersData.filters.find(
        (f) =>
          f.type === "option" &&
          (f as OptionFilter).options.some((o) => o.id === optionValueId),
      ) as OptionFilter | undefined;

      if (optionFilter) {
        const option = optionFilter.options.find((o) => o.id === optionValueId);
        if (option) {
          chips.push({
            key: `option-${optionValueId}`,
            label: `${optionFilter.presentation}: ${option.presentation}`,
            onRemove: () => onRemoveOptionValue(optionValueId),
          });
        }
      }
    }
  }

  if (
    activeFilters.priceMin !== undefined ||
    activeFilters.priceMax !== undefined
  ) {
    const matchingBucket = findMatchingBucket(
      priceBuckets,
      activeFilters.priceMin,
      activeFilters.priceMax,
    );
    chips.push({
      key: "price",
      label: `Price: ${matchingBucket?.label || "Custom"}`,
      onRemove: onRemovePrice,
    });
  }

  if (activeFilters.availability) {
    chips.push({
      key: "availability",
      label: `${AVAILABILITY_LABELS[activeFilters.availability] || activeFilters.availability}`,
      onRemove: onRemoveAvailability,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-gray-50 text-primary rounded-lg"
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="p-0.5 text-primary hover:text-primary transition-colors"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <Button variant="link" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
