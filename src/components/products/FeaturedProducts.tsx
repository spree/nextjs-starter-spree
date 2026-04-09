import { LazyProductCarousel } from "@/components/products/LazyProductCarousel";
import { cachedListProducts } from "@/lib/data/products";

interface FeaturedProductsProps {
  basePath: string;
  locale: string;
  country: string;
}

export async function FeaturedProducts({
  basePath,
  locale,
  country,
}: FeaturedProductsProps) {
  const productsResponse = await cachedListProducts(
    { limit: 8 },
    { locale, country },
  );

  return (
    <LazyProductCarousel products={productsResponse.data} basePath={basePath} />
  );
}
