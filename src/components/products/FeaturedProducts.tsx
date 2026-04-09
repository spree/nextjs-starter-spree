import { LazyProductCarousel } from "@/components/products/LazyProductCarousel";
import { getProducts } from "@/lib/data/products";

interface FeaturedProductsProps {
  basePath: string;
}

export async function FeaturedProducts({ basePath }: FeaturedProductsProps) {
  const productsResponse = await getProducts({ limit: 8 });

  return (
    <LazyProductCarousel products={productsResponse.data} basePath={basePath} />
  );
}
