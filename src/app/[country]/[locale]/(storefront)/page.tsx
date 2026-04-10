import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCarousel } from "@/components/products/ProductCarousel";
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

export default async function HomePage({ params }: HomePageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  const storeName = getStoreName();

  /* Demo-only: Remove for production. */
  const githubUrl = "https://github.com/spree/storefront";
  const quickstartUrl =
    "https://spreecommerce.org/docs/developer/storefront/nextjs/quickstart";
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              {t("welcome", { storeName })}
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t("heroDescription")}
            </p>
            {/* Demo-only: Remove for production. */}
            <p className="mt-3 text-sm text-gray-400 max-w-xl mx-auto">
              {t("heroDemoNote", {
                testCard: "4242 4242 4242 4242",
              })}
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Button size="lg" asChild>
                <Link href={`${basePath}/products`}>{t("shopNow")}</Link>
              </Button>
              {/* Demo-only: Remove for production. */}
              <Button variant="outline" size="lg" asChild>
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("forkOnGithub")}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link
                  href={quickstartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("quickstartGuide")} &rarr;
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8  py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("featuredProducts")}
          </h2>
          <Button variant="link" asChild>
            <Link href={`${basePath}/products`}>{t("viewAll")} &rarr;</Link>
          </Button>
        </div>
        <ProductCarousel basePath={basePath} />
      </section>
    </div>
  );
}
