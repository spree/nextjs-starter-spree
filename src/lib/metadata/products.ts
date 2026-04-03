import type { Metadata } from "next";
import { buildCanonicalUrl } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";

interface ProductsMetadataParams {
  country: string;
  locale: string;
}

export async function generateProductsMetadata({
  country,
  locale,
}: ProductsMetadataParams): Promise<Metadata> {
  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(storeUrl, `/${country}/${locale}/products`)
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
