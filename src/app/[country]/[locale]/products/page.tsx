import { ProductsContent } from './ProductsContent'

interface ProductsPageProps {
  params: Promise<{
    country: string
    locale: string
  }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { country, locale } = await params
  const basePath = `/${country}/${locale}`

  return <ProductsContent basePath={basePath} />
}
