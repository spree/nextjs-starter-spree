import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getStoreName } from "@/lib/store";

interface HeroSectionProps {
  basePath: string;
  locale: string;
}

export async function HeroSection({ basePath, locale }: HeroSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  const storeName = getStoreName();

  return (
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
              <Link href={`${basePath}/products`}>{t("browseCategories")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
