"use client";

import type { ProductListParams } from "@spree/sdk";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ProductListingLayout } from "@/components/products/ProductListingLayout";
import { useStore } from "@/contexts/StoreContext";
import { useProductListing } from "@/hooks/useProductListing";
import { trackViewItemList } from "@/lib/analytics/gtm";
import { getCategoryProducts } from "@/lib/data/categories";

interface CategoryProductsContentProps {
  categoryId: string;
  categoryName: string;
  basePath: string;
}

export function CategoryProductsContent({
  categoryId,
  categoryName,
  basePath,
}: CategoryProductsContentProps) {
  const { currency } = useStore();

  const fetchFn = useCallback(
    (params: ProductListParams) => getCategoryProducts(categoryId, params),
    [categoryId],
  );

  const filterParams = useMemo(
    () => ({ in_category: categoryId }),
    [categoryId],
  );

  const listing = useProductListing({
    fetchFn,
    filterParams,
  });

  const listId = useMemo(() => `category-${categoryId}`, [categoryId]);
  const listName = useMemo(() => `Category: ${categoryName}`, [categoryName]);

  // Track view_item_list only on fresh loads (not loadMore).
  const prevLoadingRef = useRef(true);
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = listing.loading;

    if (!wasLoading || listing.loading || listing.totalCount === 0) return;

    trackViewItemList(listing.products, listId, listName, currency);
  }, [
    listing.loading,
    listing.products,
    listing.totalCount,
    listId,
    listName,
    currency,
  ]);

  return (
    <ProductListingLayout
      {...listing}
      basePath={basePath}
      categoryId={categoryId}
      onFilterChange={listing.handleFilterChange}
      listId={listId}
      listName={listName}
      emptyMessage="No products found matching your filters."
    />
  );
}
