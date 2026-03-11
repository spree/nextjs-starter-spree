import type { Metadata } from "next";
import {
  buildCanonicalUrl,
  getStoreDescription,
  getStoreName,
  getStoreUrl,
  SOCIAL_IMAGE_PATH,
} from "@/lib/seo";

interface HomeMetadataParams {
  country: string;
  locale: string;
}

export async function generateHomeMetadata({
  country,
  locale,
}: HomeMetadataParams): Promise<Metadata> {
  const storeName = process.env.STORE_SEO_TITLE || getStoreName();
  const description =
    process.env.STORE_META_DESCRIPTION || getStoreDescription();
  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(storeUrl, `/${country}/${locale}`)
    : undefined;

  return {
    title: { absolute: storeName },
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title: storeName,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
      images: [SOCIAL_IMAGE_PATH],
    },
  };
}
