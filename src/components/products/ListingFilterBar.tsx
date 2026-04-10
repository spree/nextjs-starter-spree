"use client";

import type { ProductFiltersResponse } from "@spree/sdk";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { FilterBar } from "@/components/products/filters";
import { buildListingSearchParams } from "@/lib/utils/listing-search-params";
import type { ActiveFilters } from "@/types/filters";

interface ListingFilterBarProps {
  filtersData: ProductFiltersResponse | null;
  activeFilters: ActiveFilters;
  totalCount: number;
}

/**
 * Thin client wrapper around FilterBar that turns every filter change
 * into a URL update (router.push) instead of local state. The server
 * component that owns this PLP will re-render with new searchParams.
 */
export function ListingFilterBar({
  filtersData,
  activeFilters,
  totalCount,
}: ListingFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = useCallback(
    (nextFilters: ActiveFilters) => {
      const next = buildListingSearchParams(
        new URLSearchParams(searchParams.toString()),
        {
          // Preserve `q` from the URL (not in ActiveFilters).
          query: searchParams.get("q") ?? undefined,
          filters: nextFilters,
        },
      );
      const query = next.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div aria-busy={isPending}>
      <FilterBar
        filtersData={filtersData}
        filtersLoading={false}
        activeFilters={activeFilters}
        totalCount={totalCount}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
