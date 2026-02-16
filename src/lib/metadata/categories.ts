import type { Metadata } from "next";
import { getCachedStore } from "@/lib/data/cached";
import { buildCanonicalUrl } from "@/lib/seo";

interface CategoriesMetadataParams {
  country: string;
  locale: string;
}

export async function generateCategoriesMetadata({
  country,
  locale,
}: CategoriesMetadataParams): Promise<Metadata> {
  let store;
  try {
    store = await getCachedStore({ locale });
  } catch {
    store = null;
  }

  const canonicalUrl = store?.url
    ? buildCanonicalUrl(store.url, `/${country}/${locale}/taxonomies`)
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
