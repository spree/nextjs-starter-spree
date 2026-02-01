'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getProducts, getProductFilters } from '@/lib/data/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ProductFilters, type ActiveFilters } from '@/components/products/ProductFilters'
import type { StoreProduct, ProductFiltersResponse } from '@spree/sdk'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/contexts/StoreContext'

interface ProductsContentProps {
  basePath: string
}

export function ProductsContent({ basePath }: ProductsContentProps) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const { currency, locale, loading: storeLoading } = useStore()

  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ optionValues: [] })
  const [filtersData, setFiltersData] = useState<ProductFiltersResponse | null>(null)
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(false)
  const filtersRef = useRef<ActiveFilters>({ optionValues: [] })

  // Build query params from active filters
  const buildQueryParams = useCallback((filters: ActiveFilters, searchQuery: string) => {
    const params: Record<string, unknown> = {}

    // Search query
    if (searchQuery) {
      params['q[multi_search]'] = searchQuery
    }

    // Price range
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      params['q[price_between][]'] = [
        filters.priceMin ?? 0,
        filters.priceMax ?? 999999,
      ]
    }

    // Option values
    if (filters.optionValues.length > 0) {
      params['q[with_option_value_ids][]'] = filters.optionValues
    }

    // Availability
    if (filters.availability === 'in_stock') {
      params['q[in_stock_items]'] = true
    } else if (filters.availability === 'out_of_stock') {
      params['q[out_of_stock_items]'] = true
    }

    // Sort
    if (filters.sortBy && filters.sortBy !== 'manual') {
      switch (filters.sortBy) {
        case 'price-low-to-high':
        case 'price-high-to-low':
        case 'best-selling':
          params['q[sort_by]'] = filters.sortBy
          break
        case 'newest-first':
          params['q[s]'] = 'available_on desc'
          break
        case 'oldest-first':
          params['q[s]'] = 'available_on asc'
          break
        case 'name-a-z':
          params['q[s]'] = 'name asc'
          break
        case 'name-z-a':
          params['q[s]'] = 'name desc'
          break
      }
    }

    return params
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async (page: number = 1, filters: ActiveFilters, searchQuery: string) => {
    try {
      const queryParams = buildQueryParams(filters, searchQuery)

      return await getProducts(
        {
          page,
          per_page: 12,
          ...queryParams,
        } as Record<string, unknown>,
        { currency, locale }
      )
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return null
    }
  }, [currency, locale, buildQueryParams])

  // Load products
  const loadProducts = useCallback(async (filters: ActiveFilters, searchQuery: string) => {
    setLoading(true)
    pageRef.current = 1

    const response = await fetchProducts(1, filters, searchQuery)

    if (response) {
      setProducts(response.data)
      setTotalCount(response.meta.count)
      const moreAvailable = 1 < response.meta.pages
      setHasMore(moreAvailable)
      hasMoreRef.current = moreAvailable
    }

    setLoading(false)
  }, [fetchProducts])

  // Fetch filters
  useEffect(() => {
    if (storeLoading) return

    let cancelled = false

    const fetchFilters = async () => {
      setFiltersLoading(true)
      try {
        const response = await getProductFilters({}, { currency, locale })
        if (!cancelled) {
          setFiltersData(response)
        }
      } catch (error) {
        console.error('Failed to fetch filters:', error)
      } finally {
        if (!cancelled) {
          setFiltersLoading(false)
        }
      }
    }

    fetchFilters()

    return () => {
      cancelled = true
    }
  }, [currency, locale, storeLoading])

  // Load products when query or store context changes
  useEffect(() => {
    if (storeLoading) return
    loadProducts(activeFilters, query)
  }, [storeLoading, query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: ActiveFilters) => {
    if (JSON.stringify(filtersRef.current) !== JSON.stringify(newFilters)) {
      filtersRef.current = newFilters
      setActiveFilters(newFilters)
      loadProducts(newFilters, query)
    }
  }, [loadProducts, query])

  // Load more products
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return

    setLoadingMore(true)
    const nextPage = pageRef.current + 1

    const response = await fetchProducts(nextPage, activeFilters, query)

    if (response) {
      setProducts((prev) => [...prev, ...response.data])
      const moreAvailable = nextPage < response.meta.pages
      setHasMore(moreAvailable)
      hasMoreRef.current = moreAvailable
      pageRef.current = nextPage
    }

    setLoadingMore(false)
  }, [fetchProducts, loadingMore, activeFilters, query])

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [loadMore, loading, loadingMore])

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
              {totalCount} {totalCount === 1 ? 'product' : 'products'} found
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="mt-2 text-gray-500">
              Browse our complete collection
            </p>
          </>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/25" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <ProductFilters
                  filtersData={filtersData}
                  loading={filtersLoading}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar filters */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <ProductFilters
              filtersData={filtersData}
              loading={filtersLoading}
              onFilterChange={handleFilterChange}
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
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500">
                {query
                  ? `We couldn't find any products matching "${query}"`
                  : 'Try adjusting your filters'}
              </p>
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
                  <p className="text-gray-500 text-sm">No more products to load</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
