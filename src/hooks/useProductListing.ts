"use client";

import type {
  PaginatedResponse,
  Product,
  ProductFiltersResponse,
  ProductListParams,
} from "@spree/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProductFilters } from "@/lib/data/products";
import { filtersEqual } from "@/lib/utils/filters";
import { buildProductQueryParams } from "@/lib/utils/product-query";
import type { ActiveFilters } from "@/types/filters";

interface UseProductListingOptions {
  fetchFn: (params: ProductListParams) => Promise<PaginatedResponse<Product>>;
  filterParams?: ProductListParams;
  searchQuery?: string;
}

export function useProductListing({
  fetchFn,
  filterParams = {},
  searchQuery = "",
}: UseProductListingOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    optionValues: [],
  });
  const [filtersData, setFiltersData] = useState<ProductFiltersResponse | null>(
    null,
  );
  const [filtersLoading, setFiltersLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const filtersRef = useRef<ActiveFilters>({ optionValues: [] });
  const filterParamsRef = useRef(filterParams);
  filterParamsRef.current = filterParams;
  const filterParamsKey = useMemo(
    () => JSON.stringify(filterParams),
    [filterParams],
  );
  const loadIdRef = useRef(0);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const fetchProducts = useCallback(
    async (page: number, filters: ActiveFilters, query: string) => {
      try {
        const queryParams = buildProductQueryParams(filters, query);
        return await fetchFn({ page, limit: 12, ...queryParams });
      } catch (error) {
        console.error("Failed to fetch products:", error);
        return null;
      }
    },
    [fetchFn],
  );

  const loadProducts = useCallback(
    async (filters: ActiveFilters, query: string) => {
      setLoading(true);
      pageRef.current = 1;
      const currentLoadId = ++loadIdRef.current;

      const response = await fetchProducts(1, filters, query);

      if (response && loadIdRef.current === currentLoadId) {
        setProducts(response.data);
        setTotalCount(response.meta.count);
        const moreAvailable = 1 < response.meta.pages;
        setHasMore(moreAvailable);
        hasMoreRef.current = moreAvailable;
      }

      if (loadIdRef.current === currentLoadId) {
        setLoading(false);
      }
    },
    [fetchProducts],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: filterParamsKey triggers re-fetch on soft-nav
  useEffect(() => {
    let cancelled = false;

    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const params = { ...filterParamsRef.current };
        if (searchQuery) {
          params.search = searchQuery;
        }
        const response = await getProductFilters(params);
        if (!cancelled) {
          setFiltersData(response);
        }
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      } finally {
        if (!cancelled) {
          setFiltersLoading(false);
        }
      }
    };

    fetchFilters();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, filterParamsKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: filterParamsKey triggers re-fetch on soft-nav
  useEffect(() => {
    loadProducts(filtersRef.current, searchQuery);
  }, [searchQuery, loadProducts, filterParamsKey]);

  const handleFilterChange = useCallback(
    (newFilters: ActiveFilters) => {
      if (!filtersEqual(filtersRef.current, newFilters)) {
        filtersRef.current = newFilters;
        setActiveFilters(newFilters);
        loadProducts(newFilters, searchQueryRef.current);
      }
    },
    [loadProducts],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const currentLoadId = loadIdRef.current;
    const nextPage = pageRef.current + 1;

    const response = await fetchProducts(
      nextPage,
      filtersRef.current,
      searchQueryRef.current,
    );

    if (response && loadIdRef.current === currentLoadId) {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newProducts = response.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      const moreAvailable = nextPage < response.meta.pages;
      setHasMore(moreAvailable);
      hasMoreRef.current = moreAvailable;
      pageRef.current = nextPage;
    }

    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [fetchProducts]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingMoreRef.current
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, loading]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    activeFilters,
    filtersData,
    filtersLoading,
    handleFilterChange,
    loadMoreRef,
  };
}
