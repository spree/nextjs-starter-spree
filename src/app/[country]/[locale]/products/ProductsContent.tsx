'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSpreeClient } from '@/lib/spree'
import { ProductGrid } from '@/components/products/ProductGrid'
import type { StoreProduct } from '@spree/sdk'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/contexts/StoreContext'

interface ProductsContentProps {
  basePath: string
  initialQuery: string
}

export function ProductsContent({ basePath, initialQuery }: ProductsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('q') || ''
  const { currency, locale, loading: storeLoading } = useStore()

  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(false)

  // Fetch products
  const fetchProducts = useCallback(async (query: string, page: number = 1) => {
    try {
      const client = getSpreeClient()
      const params: Record<string, string | number> = {
        page,
        per_page: 12,
      }
      if (query) {
        params['q[search_by_name]'] = query
      }
      return await client.products.list(params, { currency, locale })
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return null
    }
  }, [currency, locale])

  // Initial load and query/currency change
  useEffect(() => {
    // Wait for store context to load (to get correct currency)
    if (storeLoading) return

    let cancelled = false

    const loadProducts = async () => {
      setLoading(true)
      pageRef.current = 1

      const response = await fetchProducts(currentQuery, 1)

      if (!cancelled && response) {
        setProducts(response.data)
        setTotalCount(response.meta.count)
        const moreAvailable = 1 < response.meta.pages
        setHasMore(moreAvailable)
        hasMoreRef.current = moreAvailable
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [currentQuery, fetchProducts, storeLoading])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    if (q) {
      router.push(`${basePath}/products?q=${encodeURIComponent(q)}`)
    } else {
      router.push(`${basePath}/products`)
    }
  }

  // Load more products
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return

    setLoadingMore(true)
    const nextPage = pageRef.current + 1

    const response = await fetchProducts(currentQuery, nextPage)

    if (response) {
      setProducts((prev) => [...prev, ...response.data])
      const moreAvailable = nextPage < response.meta.pages
      setHasMore(moreAvailable)
      hasMoreRef.current = moreAvailable
      pageRef.current = nextPage
    }

    setLoadingMore(false)
  }, [currentQuery, fetchProducts, loadingMore])

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          {currentQuery && (
            <p className="mt-1 text-gray-500">
              Showing results for &ldquo;{currentQuery}&rdquo;
            </p>
          )}
        </div>
        {totalCount > 0 && (
          <div className="text-sm text-gray-500">
            {products.length} of {totalCount} products
          </div>
        )}
      </div>

      {/* Search */}
      <form className="mb-8" onSubmit={handleSearch}>
        <div className="relative max-w-md">
          <input
            type="text"
            name="q"
            placeholder="Search products..."
            defaultValue={currentQuery}
            key={currentQuery}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {currentQuery ? `No products found for "${currentQuery}"` : 'No products found'}
          </p>
        </div>
      ) : (
        <>
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
              <p className="text-gray-500">No more products to load</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
