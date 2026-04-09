"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { Button } from "@/components/ui/button";

function CarouselSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeaturedProductsSection() {
  const t = useTranslations("home");
  const params = useParams<{ country: string; locale: string }>();
  const basePath = `/${params.country}/${params.locale}`;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 featured-products">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("featuredProducts")}
        </h2>
        <Button variant="link" asChild>
          <Link href={`${basePath}/products`}>{t("viewAll")} &rarr;</Link>
        </Button>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <FeaturedProducts
          basePath={basePath}
          locale={params.locale}
          country={params.country}
        />
      </Suspense>
    </section>
  );
}
