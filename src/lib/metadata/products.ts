import type { Metadata } from "next";
import { getCachedStore } from "@/lib/data/cached";
import { buildCanonicalUrl } from "@/lib/seo";

interface ProductsMetadataParams {
  country: string;
  locale: string;
}

export async function generateProductsMetadata({
  country,
  locale,
}: ProductsMetadataParams): Promise<Metadata> {
  let store;
  try {
    store = await getCachedStore({ locale });
  } catch {
    store = null;
  }

  const canonicalUrl = store?.url
    ? buildCanonicalUrl(store.url, `/${country}/${locale}/products`)
    : undefined;

  return {
    title: "Products",
    description: "Browse our full collection of products.",
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title: "Products",
      description: "Browse our full collection of products.",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
    },
  };
}
