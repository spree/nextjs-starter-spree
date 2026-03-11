import type { Metadata } from "next";
import {
  ensureProtocol,
  getStoreDescription,
  getStoreName,
  getStoreUrl,
  SOCIAL_IMAGE_PATH,
} from "@/lib/seo";

function normalizeOpenGraphLocale(locale: string): string {
  const parts = locale.split(/[-_]/);
  if (parts.length < 2) return locale;
  return `${parts[0].toLowerCase()}_${parts[1].toUpperCase()}`;
}

interface StoreMetadataParams {
  locale: string;
}

export async function generateStoreMetadata({
  locale,
}: StoreMetadataParams): Promise<Metadata> {
  const storeName = process.env.STORE_SEO_TITLE || getStoreName();
  const storeUrl = getStoreUrl();
  const metaDescription =
    process.env.STORE_META_DESCRIPTION || getStoreDescription();
  const metaKeywords = process.env.STORE_META_KEYWORDS;
  const twitter = process.env.STORE_TWITTER;

  let metadataBaseSpread: Partial<{ metadataBase: URL }> = {};
  if (storeUrl) {
    try {
      metadataBaseSpread = { metadataBase: new URL(ensureProtocol(storeUrl)) };
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
    description: metaDescription,
    ...(metaKeywords ? { keywords: metaKeywords } : {}),
    openGraph: {
      siteName: getStoreName(),
      locale: normalizeOpenGraphLocale(locale),
      type: "website",
      images: [SOCIAL_IMAGE_PATH],
    },
    twitter: {
      card: "summary_large_image",
      ...(twitter
        ? {
            site: twitter.startsWith("@") ? twitter : `@${twitter}`,
          }
        : {}),
    },
  };
}
