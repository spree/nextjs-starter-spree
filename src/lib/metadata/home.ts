import type { Metadata } from "next";
import { getCachedStore } from "@/lib/data/cached";
import { buildCanonicalUrl } from "@/lib/seo";

interface HomeMetadataParams {
  country: string;
  locale: string;
}

export async function generateHomeMetadata({
  country,
  locale,
}: HomeMetadataParams): Promise<Metadata> {
  let store;
  try {
    store = await getCachedStore({ locale });
  } catch {
    store = null;
  }

  const storeName = store?.seo_title || store?.name || "Spree Store";
  const description =
    store?.meta_description ||
    "Discover amazing products with our modern e-commerce experience.";

  return {
    title: { absolute: storeName },
    description,
    ...(store?.url
      ? {
          alternates: {
            canonical: buildCanonicalUrl(store.url, `/${country}/${locale}`),
          },
        }
      : {}),
    openGraph: {
      title: storeName,
      description,
      ...(store?.url
        ? { url: buildCanonicalUrl(store.url, `/${country}/${locale}`) }
        : {}),
      type: "website",
      ...(store?.social_image_url ? { images: [store.social_image_url] } : {}),
    },
  };
}
