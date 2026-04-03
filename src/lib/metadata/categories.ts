import type { Metadata } from "next";
import { buildCanonicalUrl } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";

interface CategoriesMetadataParams {
  country: string;
  locale: string;
}

export async function generateCategoriesMetadata({
  country,
  locale,
}: CategoriesMetadataParams): Promise<Metadata> {
  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(storeUrl, `/${country}/${locale}/c`)
    : undefined;

  return {
    title: "Categories",
    description: "Browse all product categories.",
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title: "Categories",
      description: "Browse all product categories.",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
    },
  };
}
