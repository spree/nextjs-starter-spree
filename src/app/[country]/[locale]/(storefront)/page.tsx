import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { generateHomeMetadata } from "@/lib/metadata/home";
import { getStoreName } from "@/lib/store";

interface HomePageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { country, locale } = await params;
  return generateHomeMetadata({ country, locale });
}

function CarouselSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  const storeName = getStoreName();

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-gray-200 min-h-[823px] md:min-h-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              {t("welcome", { storeName })}
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              {t("heroDescription")}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={`${basePath}/products`}>{t("shopNow")}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`${basePath}/products`}>
                  {t("browseCategories")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}
      >
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
            locale={locale}
            country={country}
          />
        </Suspense>
      </section>
    </div>
  );
}
