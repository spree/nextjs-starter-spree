"use client";

import type { ProductFiltersResponse, StoreProduct } from "@spree/sdk";
import type { RefObject } from "react";
import {
  type ActiveFilters,
  ProductFilters,
} from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";

interface ProductListingLayoutProps {
  products: StoreProduct[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  basePath: string;
  filtersData: ProductFiltersResponse | null;
  filtersLoading: boolean;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  onFilterChange: (filters: ActiveFilters) => void;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  taxonId?: string;
  emptyMessage?: string;
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
  showMobileFilters,
  setShowMobileFilters,
  onFilterChange,
  loadMoreRef,
  taxonId,
  emptyMessage = "Try adjusting your filters",
}: ProductListingLayoutProps) {
  return (
    <div className="lg:grid lg:grid-cols-4 lg:gap-8">
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </button>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/25"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ProductFilters
                taxonId={taxonId}
                filtersData={filtersData}
                loading={filtersLoading}
                onFilterChange={onFilterChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar filters */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <ProductFilters
            taxonId={taxonId}
            filtersData={filtersData}
            loading={filtersLoading}
            onFilterChange={onFilterChange}
          />
        </div>
      </div>

      {/* Products */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No products found
            </h3>
            <p className="mt-2 text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Showing {products.length} of {totalCount} products
              </p>
            </div>

            <ProductGrid products={products} basePath={basePath} />

            {/* Load more trigger */}
            <div
              ref={loadMoreRef}
              className="h-20 flex items-center justify-center mt-8"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading more...
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-gray-500 text-sm">
                  No more products to load
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
