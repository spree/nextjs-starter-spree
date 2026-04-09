import dynamic from "next/dynamic";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { cachedListProducts } from "@/lib/data/products";

const LazyProductCarousel = dynamic(
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
    <LazyProductCarousel
      products={productsResponse.data ?? []}
      basePath={basePath}
    />
  );
}
