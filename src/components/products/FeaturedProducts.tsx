import dynamic from "next/dynamic";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { getProducts } from "@/lib/data/products";

const ProductCarousel = dynamic(
  () =>
    import("@/components/products/ProductCarousel").then((mod) => ({
      default: mod.ProductCarousel,
    })),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    ),
  },
);

interface FeaturedProductsProps {
  basePath: string;
}

export async function FeaturedProducts({ basePath }: FeaturedProductsProps) {
  const productsResponse = await getProducts({ limit: 8 });

  return (
    <ProductCarousel products={productsResponse.data} basePath={basePath} />
  );
}
