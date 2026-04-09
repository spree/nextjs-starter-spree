"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";

export function HeroSection() {
  const t = useTranslations("home");
  const params = useParams<{ country: string; locale: string }>();
  const basePath = `/${params.country}/${params.locale}`;

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
