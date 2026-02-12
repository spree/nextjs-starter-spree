"use client";

import { useCallback } from "react";
import { ProductListingLayout } from "@/components/products/ProductListingLayout";
import { useProductListing } from "@/hooks/useProductListing";
import { getTaxonProducts } from "@/lib/data/products";

interface CategoryProductsContentProps {
  taxonPermalink: string;
  taxonId: string;
  basePath: string;
}

export function CategoryProductsContent({
  taxonPermalink,
  taxonId,
  basePath,
}: CategoryProductsContentProps) {
  const fetchFn = useCallback(
    (
      params: Record<string, unknown>,
      options: { currency: string; locale: string },
    ) => getTaxonProducts(taxonPermalink, params, options),
    [taxonPermalink],
  );

  const listing = useProductListing({
    fetchFn,
    filterParams: { taxon_id: taxonId },
  });

  return (
    <ProductListingLayout
      {...listing}
      basePath={basePath}
      taxonId={taxonId}
      onFilterChange={listing.handleFilterChange}
      emptyMessage="No products found matching your filters."
    />
  );
}
