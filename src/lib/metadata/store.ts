import type { Metadata } from "next";
import { getCachedStore } from "@/lib/data/cached";
import { ensureProtocol } from "@/lib/seo";

interface StoreMetadataParams {
  locale: string;
}

export async function generateStoreMetadata({
  locale,
}: StoreMetadataParams): Promise<Metadata> {
  let store;
  try {
    store = await getCachedStore({ locale });
  } catch {
    store = null;
  }

  const storeName = store?.seo_title || store?.name || "Spree Store";

  return {
    ...(store?.url ? { metadataBase: new URL(ensureProtocol(store.url)) } : {}),
    title: {
      template: `%s | ${storeName}`,
      default: storeName,
    },
    description:
      store?.meta_description || "Online store powered by Spree Commerce",
    ...(store?.meta_keywords ? { keywords: store.meta_keywords } : {}),
    openGraph: {
      siteName: store?.name || "Spree Store",
      locale,
      type: "website",
      ...(store?.social_image_url ? { images: [store.social_image_url] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(store?.twitter
        ? {
            site: store.twitter.startsWith("@")
              ? store.twitter
              : `@${store.twitter}`,
          }
        : {}),
    },
  };
}
