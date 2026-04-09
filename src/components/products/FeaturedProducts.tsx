import { ProductCarousel } from "@/components/products/ProductCarousel";
import { getProducts } from "@/lib/data/products";

interface FeaturedProductsProps {
  basePath: string;
}

export async function FeaturedProducts({ basePath }: FeaturedProductsProps) {
  const productsResponse = await getProducts({ limit: 8 });

  return (
    <ProductCarousel products={productsResponse.data} basePath={basePath} />
  );
}
