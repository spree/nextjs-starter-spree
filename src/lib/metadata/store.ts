import type { StoreStore } from "@spree/sdk";
import type { Metadata } from "next";
import { getCachedStore } from "@/lib/data/cached";
import { ensureProtocol } from "@/lib/seo";

interface StoreMetadataParams {
  locale: string;
}

export async function generateStoreMetadata({
  locale,
}: StoreMetadataParams): Promise<Metadata> {
  let store: StoreStore | null;
  try {
    store = await getCachedStore(locale);
  } catch {
    store = null;
  }

  const storeName = store?.seo_title || store?.name || "Spree Store";

  let metadataBaseSpread: { metadataBase: URL } | Record<string, never> = {};
  if (store?.url) {
    try {
      metadataBaseSpread = { metadataBase: new URL(ensureProtocol(store.url)) };
    } catch {
      metadataBaseSpread = {};
    }
  }

  return {
    ...metadataBaseSpread,
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
