"use client";

import type { Product } from "@spree/sdk";
import dynamic from "next/dynamic";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";

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

interface LazyProductCarouselProps {
  products: Product[];
  basePath: string;
}

export function LazyProductCarousel({
  products,
  basePath,
}: LazyProductCarouselProps) {
  return <ProductCarousel products={products} basePath={basePath} />;
}
