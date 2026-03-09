"use client";

import type {
  AvailabilityFilter,
  OptionFilter,
  PriceRangeFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { memo, useCallback, useMemo, useState } from "react";
import { FilterIcon } from "@/components/icons";
import { getActiveFilterCount } from "@/lib/utils/filters";
import { generatePriceBuckets } from "@/lib/utils/price-buckets";
import type { ActiveFilters, AvailabilityStatus } from "@/types/filters";
import { AvailabilityDropdownContent } from "./AvailabilityDropdownContent";
import { FilterChips } from "./FilterChips";
import { FilterDropdown } from "./FilterDropdown";
import { MobileFilterDrawer } from "./MobileFilterDrawer";
import { OptionDropdownContent } from "./OptionDropdownContent";
import { PriceDropdownContent } from "./PriceDropdownContent";
import { SortDropdownContent } from "./SortDropdownContent";

interface FilterBarProps {
  filtersData: ProductFiltersResponse | null;
  filtersLoading: boolean;
  activeFilters: ActiveFilters;
  totalCount: number;
  onFilterChange: (filters: ActiveFilters) => void;
}

export const FilterBar = memo(function FilterBar({
  filtersData,
  filtersLoading,
  activeFilters,
  totalCount,
  onFilterChange,
}: FilterBarProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const handleOptionValueToggle = useCallback(
    (optionValueId: string) => {
      const newOptionValues = activeFilters.optionValues.includes(optionValueId)
        ? activeFilters.optionValues.filter((id) => id !== optionValueId)
        : [...activeFilters.optionValues, optionValueId];
      onFilterChange({ ...activeFilters, optionValues: newOptionValues });
    },
    [activeFilters, onFilterChange],
  );

  const handlePriceChange = useCallback(
    (min?: number, max?: number) => {
      onFilterChange({ ...activeFilters, priceMin: min, priceMax: max });
    },
    [activeFilters, onFilterChange],
  );

  const handleAvailabilityChange = useCallback(
    (availability?: AvailabilityStatus) => {
      onFilterChange({ ...activeFilters, availability });
    },
    [activeFilters, onFilterChange],
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      onFilterChange({ ...activeFilters, sortBy });
      closeDropdown();
    },
    [activeFilters, onFilterChange, closeDropdown],
  );

  const clearFilters = useCallback(() => {
    onFilterChange({ optionValues: [] });
  }, [onFilterChange]);

  const priceBuckets = useMemo(() => {
    if (!filtersData) return [];
    const priceFilter = filtersData.filters.find(
      (f) => f.type === "price_range",
    ) as PriceRangeFilter | undefined;
    if (!priceFilter) return [];
    return generatePriceBuckets(
      priceFilter.min,
      priceFilter.max,
      priceFilter.currency,
    );
  }, [filtersData]);

  const optionFilters = useMemo(() => {
    if (!filtersData) return [];
    return filtersData.filters.filter(
      (f) => f.type === "option",
    ) as OptionFilter[];
  }, [filtersData]);

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const filter of optionFilters) {
      counts[filter.id] = filter.options.filter((o) =>
        activeFilters.optionValues.includes(o.id),
      ).length;
    }
    return counts;
  }, [optionFilters, activeFilters.optionValues]);

  const priceBadge =
    activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined
      ? 1
      : 0;

  const availabilityBadge = activeFilters.availability ? 1 : 0;

  const totalActiveFilters = getActiveFilterCount(activeFilters);

  const hasActiveFilters = totalActiveFilters > 0;

  const activeSortBy = activeFilters.sortBy || filtersData?.default_sort;

  if (filtersLoading) {
    return (
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="h-10 w-20 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="ml-auto h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!filtersData) return null;

  const availabilityFilter = filtersData.filters.find(
    (f) => f.type === "availability",
  ) as AvailabilityFilter | undefined;

  const hasPriceFilter =
    filtersData.filters.some((f) => f.type === "price_range") &&
    priceBuckets.length > 0;

  return (
    <div className="mb-6">
      <div className="hidden md:flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {optionFilters.map((filter) => (
            <FilterDropdown
              key={filter.id}
              label={filter.presentation}
              badgeCount={badgeCounts[filter.id]}
              isOpen={openDropdownId === filter.id}
              onToggle={() => toggleDropdown(filter.id)}
              onClose={closeDropdown}
            >
              <OptionDropdownContent
                filter={filter}
                selectedValues={activeFilters.optionValues}
                onToggle={handleOptionValueToggle}
              />
            </FilterDropdown>
          ))}

          {hasPriceFilter && (
            <FilterDropdown
              label="Price"
              badgeCount={priceBadge}
              isOpen={openDropdownId === "price"}
              onToggle={() => toggleDropdown("price")}
              onClose={closeDropdown}
            >
              <PriceDropdownContent
                priceBuckets={priceBuckets}
                activeFilters={activeFilters}
                onPriceChange={handlePriceChange}
              />
            </FilterDropdown>
          )}

          {availabilityFilter && (
            <FilterDropdown
              label="Availability"
              badgeCount={availabilityBadge}
              isOpen={openDropdownId === "availability"}
              onToggle={() => toggleDropdown("availability")}
              onClose={closeDropdown}
            >
              <AvailabilityDropdownContent
                filter={availabilityFilter}
                selected={activeFilters.availability}
                onChange={handleAvailabilityChange}
              />
            </FilterDropdown>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalCount} {totalCount === 1 ? "product" : "products"}
          </span>
          <FilterDropdown
            label="Sort"
            isOpen={openDropdownId === "sort"}
            onToggle={() => toggleDropdown("sort")}
            onClose={closeDropdown}
            align="right"
          >
            <SortDropdownContent
              sortOptions={filtersData.sort_options}
              activeSortBy={activeSortBy}
              onSortChange={handleSortChange}
            />
          </FilterDropdown>
        </div>
      </div>

      <div className="flex items-center gap-3 md:hidden pb-4 border-b border-gray-100">
        <button
          onClick={() => setShowMobileDrawer(true)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
            hasActiveFilters
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-300 text-gray-700"
          }`}
        >
          <FilterIcon className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 text-xs bg-primary-500 text-white rounded-full">
              {totalActiveFilters}
            </span>
          )}
        </button>

        <div className="ml-auto">
          <FilterDropdown
            label="Sort"
            isOpen={openDropdownId === "sort-mobile"}
            onToggle={() => toggleDropdown("sort-mobile")}
            onClose={closeDropdown}
            align="right"
          >
            <SortDropdownContent
              sortOptions={filtersData.sort_options}
              activeSortBy={activeSortBy}
              onSortChange={handleSortChange}
            />
          </FilterDropdown>
        </div>
      </div>

      {hasActiveFilters && (
        <FilterChips
          activeFilters={activeFilters}
          filtersData={filtersData}
          priceBuckets={priceBuckets}
          onRemoveOptionValue={(id) => handleOptionValueToggle(id)}
          onRemovePrice={() => handlePriceChange(undefined, undefined)}
          onRemoveAvailability={() => handleAvailabilityChange(undefined)}
          onClearAll={clearFilters}
        />
      )}

      <MobileFilterDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        filtersData={filtersData}
        activeFilters={activeFilters}
        priceBuckets={priceBuckets}
        onOptionValueToggle={handleOptionValueToggle}
        onPriceChange={handlePriceChange}
        onAvailabilityChange={handleAvailabilityChange}
        onClearAll={clearFilters}
      />
    </div>
  );
});
