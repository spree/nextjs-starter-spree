import { ProductsContent } from './ProductsContent'

interface ProductsPageProps {
  params: Promise<{
    country: string
    locale: string
  }>
  searchParams: Promise<{ q?: string }>
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { country, locale } = await params
  const { q: query } = await searchParams
  const basePath = `/${country}/${locale}`

  return <ProductsContent basePath={basePath} initialQuery={query || ''} />
}
