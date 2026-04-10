import dynamic from "next/dynamic";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { cachedListProducts } from "@/lib/data/products";
import { getAccessToken } from "@/lib/spree";

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
  currency?: string;
}

export async function FeaturedProducts({
  basePath,
  locale,
  country,
  currency,
}: FeaturedProductsProps) {
  const userToken = await getAccessToken();
  const productsResponse = await cachedListProducts(
    { limit: 8 },
    { locale, country },
    userToken,
  );

  return (
    <LazyProductCarousel
      products={productsResponse.data ?? []}
      basePath={basePath}
      currency={currency}
    />
  );
}
