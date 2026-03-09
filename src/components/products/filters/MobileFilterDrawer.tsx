"use client";

import type {
  AvailabilityFilter,
  OptionFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { isColorOption, resolveColor } from "@/lib/utils/color-map";
import { AVAILABILITY_LABELS, getActiveFilterCount } from "@/lib/utils/filters";
import type { PriceBucket } from "@/lib/utils/price-buckets";
import { findMatchingBucket } from "@/lib/utils/price-buckets";
import type { ActiveFilters, AvailabilityStatus } from "@/types/filters";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filtersData: ProductFiltersResponse | null;
  activeFilters: ActiveFilters;
  priceBuckets: PriceBucket[];
  onOptionValueToggle: (optionValueId: string) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onAvailabilityChange: (value?: AvailabilityStatus) => void;
  onClearAll: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filtersData,
  activeFilters,
  priceBuckets,
  onOptionValueToggle,
  onPriceChange,
  onAvailabilityChange,
  onClearAll,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  const activeCount = getActiveFilterCount(activeFilters);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl flex flex-col animate-slide-in-left">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close filters"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
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
                    selectedValues={activeFilters.optionValues}
                    onToggle={onOptionValueToggle}
                  />
                );
              case "price_range":
                return (
                  <MobilePriceSection
                    key={filter.id}
                    priceBuckets={priceBuckets}
                    activeFilters={activeFilters}
                    onPriceChange={onPriceChange}
                  />
                );
              case "availability":
                return (
                  <MobileAvailabilitySection
                    key={filter.id}
                    filter={filter as AvailabilityFilter}
                    selected={activeFilters.availability}
                    onChange={onAvailabilityChange}
                  />
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear all filters ({activeCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
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
                onClick={() => onToggle(option.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isSelected ? "bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full shrink-0 border-2 transition-colors ${
                    isSelected
                      ? "border-primary-500 ring-2 ring-primary-200"
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
                  <CheckIcon className="w-4 h-4 text-primary-500 shrink-0" />
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
                onClick={() => onToggle(option.id)}
                className={`px-3.5 py-2 text-sm rounded-xl border transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-500 text-white"
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
              onClick={() => {
                if (isSelected) {
                  onPriceChange(undefined, undefined);
                } else {
                  onPriceChange(bucket.min, bucket.max);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isSelected
                  ? "bg-primary-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 text-left">{bucket.label}</span>
              {isSelected && (
                <CheckIcon className="w-4 h-4 text-primary-500 shrink-0" />
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
              onClick={() => {
                if (isSelected) {
                  onChange(undefined);
                } else {
                  onChange(option.id as AvailabilityStatus);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isSelected
                  ? "bg-primary-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 text-left">
                {AVAILABILITY_LABELS[option.id] || option.id}
              </span>
              <span className="text-xs text-gray-400">({option.count})</span>
              {isSelected && (
                <CheckIcon className="w-4 h-4 text-primary-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
