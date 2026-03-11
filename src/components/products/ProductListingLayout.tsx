"use client";

import type { Product, ProductFiltersResponse } from "@spree/sdk";
import { Loader2, Search } from "lucide-react";
import type React from "react";
import type { RefObject } from "react";
import { FilterBar } from "@/components/products/filters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import type { ActiveFilters } from "@/types/filters";

interface ProductListingLayoutProps {
  products: Product[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  basePath: string;
  filtersData: ProductFiltersResponse | null;
  filtersLoading: boolean;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  emptyMessage?: string;
  listId?: string;
  listName?: string;
}

export function ProductListingLayout({
  products,
  loading,
  loadingMore,
  hasMore,
  totalCount,
  basePath,
  filtersData,
  filtersLoading,
  activeFilters,
  onFilterChange,
  loadMoreRef,
  emptyMessage = "Try adjusting your filters",
  listId,
  listName,
}: ProductListingLayoutProps): React.ReactElement {
  return (
    <div>
      <FilterBar
        filtersData={filtersData}
        filtersLoading={filtersLoading}
        activeFilters={activeFilters}
        totalCount={totalCount}
        onFilterChange={onFilterChange}
      />

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Search
            className="mx-auto h-12 w-12 text-gray-400"
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No products found
          </h3>
          <p className="mt-2 text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <ProductGrid
            products={products}
            basePath={basePath}
            listId={listId}
            listName={listName}
          />

          <div
            ref={loadMoreRef}
            className="h-20 flex items-center justify-center mt-8"
          >
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="animate-spin h-5 w-5" />
                Loading more...
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-gray-500 text-sm">No more products to load</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
