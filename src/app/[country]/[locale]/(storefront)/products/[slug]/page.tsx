import { ProductDetailsWrapper } from "./ProductDetailsWrapper";

interface ProductPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { country, locale, slug } = await params;
  const basePath = `/${country}/${locale}`;

  return <ProductDetailsWrapper slug={slug} basePath={basePath} />;
}
