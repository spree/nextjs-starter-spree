"use client";

import type {
  AvailabilityFilter,
  OptionFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isColorOption, resolveColor } from "@/lib/utils/color-map";
import { AVAILABILITY_LABELS, getActiveFilterCount } from "@/lib/utils/filters";
import type { PriceBucket } from "@/lib/utils/price-buckets";
import { findMatchingBucket } from "@/lib/utils/price-buckets";
import {
  type ActiveFilters,
  type AvailabilityStatus,
  isAvailabilityStatus,
} from "@/types/filters";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filtersData: ProductFiltersResponse | null;
  activeFilters: ActiveFilters;
  priceBuckets: PriceBucket[];
  onApply: (filters: ActiveFilters) => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filtersData,
  activeFilters,
  priceBuckets,
  onApply,
}: MobileFilterDrawerProps) {
  const [stagedFilters, setStagedFilters] =
    useState<ActiveFilters>(activeFilters);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only sync when the drawer opens, not when activeFilters changes while open
  useEffect(() => {
    if (isOpen) {
      setStagedFilters(activeFilters);
    }
  }, [isOpen]);

  const handleOptionValueToggle = useCallback((optionValueId: string) => {
    setStagedFilters((prev) => {
      const newOptionValues = prev.optionValues.includes(optionValueId)
        ? prev.optionValues.filter((id) => id !== optionValueId)
        : [...prev.optionValues, optionValueId];
      return { ...prev, optionValues: newOptionValues };
    });
  }, []);

  const handlePriceChange = useCallback((min?: number, max?: number) => {
    setStagedFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }));
  }, []);

  const handleAvailabilityChange = useCallback((value?: AvailabilityStatus) => {
    setStagedFilters((prev) => ({ ...prev, availability: value }));
  }, []);

  const handleClearAll = useCallback(() => {
    setStagedFilters((prev) => ({
      optionValues: [],
      priceMin: undefined,
      priceMax: undefined,
      availability: undefined,
      sortBy: prev.sortBy,
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(stagedFilters);
    onClose();
  }, [stagedFilters, onApply, onClose]);

  const stagedCount = getActiveFilterCount(stagedFilters);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="left"
        className="w-full max-w-sm flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Filters</SheetTitle>

        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-lg font-semibold uppercase">Filters</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-7">
          {filtersData?.filters.map((filter) => {
            switch (filter.type) {
              case "option":
                return (
                  <MobileOptionSection
                    key={filter.id}
                    filter={filter as OptionFilter}
                    selectedValues={stagedFilters.optionValues}
                    onToggle={handleOptionValueToggle}
                  />
                );
              case "price_range":
                return (
                  <MobilePriceSection
                    key={filter.id}
                    priceBuckets={priceBuckets}
                    activeFilters={stagedFilters}
                    onPriceChange={handlePriceChange}
                  />
                );
              case "availability":
                return (
                  <MobileAvailabilitySection
                    key={filter.id}
                    filter={filter as AvailabilityFilter}
                    selected={stagedFilters.availability}
                    onChange={handleAvailabilityChange}
                  />
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          {stagedCount > 0 && (
            <Button variant="ghost" onClick={handleClearAll}>
              Clear all filters ({stagedCount})
            </Button>
          )}
          <Button onClick={handleApply}>Show results</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileOptionSection({
  filter,
  selectedValues,
  onToggle,
}: {
  filter: OptionFilter;
  selectedValues: string[];
  onToggle: (id: string) => void;
}) {
  const isColorFilter = isColorOption(filter.presentation);

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {filter.presentation}
      </h3>
      {isColorFilter ? (
        <div className="space-y-1">
          {filter.options.map((option) => {
            const isSelected = selectedValues.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg shrink-0 border-2 transition-colors ${
                    isSelected
                      ? "border-gray-500 ring-2 ring-primary-200"
                      : "border-gray-200"
                  }`}
                  style={{
                    backgroundColor: resolveColor(option.presentation),
                  }}
                />
                <span
                  className={`text-sm flex-1 text-left ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}
                >
                  {option.presentation}
                </span>
                <span className="text-xs text-gray-400">({option.count})</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filter.options.map((option) => {
            const isSelected = selectedValues.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.id)}
                className={`px-3.5 py-2 text-sm rounded-xl border transition-colors ${
                  isSelected
                    ? "border-gray-500 bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {option.presentation}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobilePriceSection({
  priceBuckets,
  activeFilters,
  onPriceChange,
}: {
  priceBuckets: PriceBucket[];
  activeFilters: ActiveFilters;
  onPriceChange: (min?: number, max?: number) => void;
}) {
  if (priceBuckets.length === 0) return null;

  const selectedBucket = findMatchingBucket(
    priceBuckets,
    activeFilters.priceMin,
    activeFilters.priceMax,
  );

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Price
      </h3>
      <div className="space-y-1">
        {priceBuckets.map((bucket) => {
          const isSelected = selectedBucket?.id === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onPriceChange(undefined, undefined);
                } else {
                  onPriceChange(bucket.min, bucket.max);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isSelected
                  ? "bg-gray-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 text-left">{bucket.label}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileAvailabilitySection({
  filter,
  selected,
  onChange,
}: {
  filter: AvailabilityFilter;
  selected?: AvailabilityStatus;
  onChange: (value?: AvailabilityStatus) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Availability
      </h3>
      <div className="space-y-1">
        {filter.options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onChange(undefined);
                } else if (isAvailabilityStatus(option.id)) {
                  onChange(option.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isSelected
                  ? "bg-gray-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 text-left">
                {AVAILABILITY_LABELS[option.id] || option.id}
              </span>
              <span className="text-xs text-gray-400">({option.count})</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
