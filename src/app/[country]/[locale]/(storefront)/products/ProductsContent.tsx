"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { ProductListingLayout } from "@/components/products/ProductListingLayout";
import { useProductListing } from "@/hooks/useProductListing";
import { trackViewItemList, trackViewSearchResults } from "@/lib/analytics/gtm";
import { getProducts } from "@/lib/data/products";

interface ProductsContentProps {
  basePath: string;
}

export function ProductsContent({ basePath }: ProductsContentProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const trackedProductsRef = useRef<string | null>(null);

  const fetchFn = useCallback(
    (
      params: Record<string, unknown>,
      options: { currency: string; locale: string },
    ) => getProducts(params, options),
    [],
  );

  const listing = useProductListing({
    fetchFn,
    searchQuery: query,
  });

  const listId = query ? "search-results" : "all-products";
  const listName = query ? "Search Results" : "All Products";

  // Track view_item_list / view_search_results when products load
  useEffect(() => {
    if (listing.loading || listing.products.length === 0) return;

    // Deduplicate: only fire when the product set changes
    const key = `${query}:${listing.products.map((p) => p.id).join(",")}`;
    if (trackedProductsRef.current === key) return;
    trackedProductsRef.current = key;

    if (query) {
      trackViewSearchResults(listing.products, query);
    } else {
      trackViewItemList(listing.products, listId, listName);
    }
  }, [listing.products, listing.loading, query, listId, listName]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        {query ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900">
              Search results for &ldquo;{query}&rdquo;
            </h1>
            <p className="mt-2 text-gray-500">
              {listing.totalCount}{" "}
              {listing.totalCount === 1 ? "product" : "products"} found
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="mt-2 text-gray-500">Browse our complete collection</p>
          </>
        )}
      </div>

      <ProductListingLayout
        {...listing}
        basePath={basePath}
        onFilterChange={listing.handleFilterChange}
        listId={listId}
        listName={listName}
        emptyMessage={
          query
            ? `We couldn't find any products matching "${query}"`
            : "Try adjusting your filters"
        }
      />
    </div>
  );
}
