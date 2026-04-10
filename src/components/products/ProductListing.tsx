import type {
  PaginatedResponse,
  Product,
  ProductFiltersResponse,
  ProductListParams,
} from "@spree/sdk";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { type ReactElement, Suspense } from "react";
import { InfiniteProductList } from "@/components/products/InfiniteProductList";
import { ListingAnalytics } from "@/components/products/ListingAnalytics";
import { ListingFilterBar } from "@/components/products/ListingFilterBar";
import { ProductListingSkeleton } from "@/components/products/ProductListingSkeleton";
import {
  type ListingSearchParams,
  listingKey,
} from "@/lib/utils/listing-search-params";
import {
  buildProductQueryParams,
  wrapInRansackParams,
} from "@/lib/utils/product-query";

const PAGE_SIZE = 12;

interface ProductListingProps {
  state: ListingSearchParams;
  basePath: string;
  currency?: string;
  locale: Locale;
  listId: string;
  listName: string;
  categoryId?: string;
  /** Extra params always merged into the products list fetch (e.g. in_category). */
  baseParams?: ProductListParams;
  /**
   * Server action fetching a page of products. Must be a server action
   * reference (not an inline closure) so it can be passed to the client
   * InfiniteProductList island for subsequent load-more calls.
   */
  fetchProducts: (
    params: ProductListParams,
  ) => Promise<PaginatedResponse<Product>>;
  /** Fetcher for the facet data (filters + sort options). Server-only. */
  fetchFilters: (
    params: Record<string, unknown>,
  ) => Promise<ProductFiltersResponse>;
  /** Shown when the fetch returns zero results. */
  emptyMessage?: string;
}

/**
 * Server-rendered product listing. Fetches products + facet data in
 * parallel inside a Suspense boundary so the surrounding shell (header,
 * breadcrumbs, banner) can stream immediately.
 *
 * Filter / sort / query state lives in the URL via ListingSearchParams.
 * Click handlers in the filter bar write to the URL with router.push,
 * which triggers a soft navigation and re-runs this server component.
 *
 * Pagination uses infinite scroll: the server renders page 1, and the
 * client InfiniteProductList island fetches subsequent pages via the
 * same server action on scroll. Filter changes unmount the island (via
 * the Suspense boundary key) so accumulated state resets cleanly.
 */
export function ProductListing(props: ProductListingProps): ReactElement {
  return (
    <Suspense
      key={listingKey(props.state)}
      fallback={<ProductListingSkeleton />}
    >
      <ProductListingInner {...props} />
    </Suspense>
  );
}

async function ProductListingInner({
  state,
  basePath,
  currency,
  locale,
  listId,
  listName,
  categoryId,
  baseParams,
  fetchProducts,
  fetchFilters,
  emptyMessage,
}: ProductListingProps): Promise<ReactElement> {
  const t = await getTranslations({ locale, namespace: "products" });

  const queryParams = buildProductQueryParams(state.filters, state.query);

  // Base SDK list params for the current filter/sort/query state.
  // The client island reuses this when fetching subsequent pages.
  const listParams: ProductListParams = {
    limit: PAGE_SIZE,
    ...queryParams,
    ...baseParams,
  };

  // Filters fetch: Ransack-wrapped with the same active filter context,
  // so facet counts reflect the user's current selection.
  const filterFetchParams = wrapInRansackParams({
    ...queryParams,
    ...baseParams,
  });

  // Products fetch intentionally un-caught: a failure here is a real
  // error (backend down, bad params) and should bubble to the route
  // error boundary rather than masquerade as a legitimate empty
  // results page. Filters fetch is cosmetic (facet counts) so we fall
  // back to a bare filter bar on failure.
  const [productsResponse, filtersResponse] = await Promise.all([
    fetchProducts({ ...listParams, page: 1 }),
    fetchFilters(filterFetchParams).catch((error) => {
      console.error("ProductListing: filters fetch failed", error);
      return null;
    }),
  ]);

  const products = productsResponse.data;
  const totalCount = productsResponse.meta.count;
  const totalPages = productsResponse.meta.pages;

  const hasResults = products.length > 0;

  return (
    <>
      <ListingFilterBar
        filtersData={filtersResponse}
        activeFilters={state.filters}
        totalCount={totalCount}
      />

      {hasResults ? (
        <>
          <InfiniteProductList
            initialProducts={products}
            initialPage={1}
            totalPages={totalPages}
            listParams={listParams}
            fetchPage={fetchProducts}
            basePath={basePath}
            categoryId={categoryId}
            listId={listId}
            listName={listName}
            currency={currency}
          />
          <ListingAnalytics
            products={products}
            listId={listId}
            listName={listName}
            query={state.query}
            currency={currency}
            stateKey={listingKey(state)}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Search
            className="mx-auto h-12 w-12 text-gray-400"
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("noProductsFound")}
          </h3>
          <p className="mt-2 text-gray-500">
            {emptyMessage ?? t("tryAdjustingFilters")}
          </p>
        </div>
      )}
    </>
  );
}
