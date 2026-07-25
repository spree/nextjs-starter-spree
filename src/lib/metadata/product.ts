import type { Metadata } from "next";
import { getCachedProduct, PRODUCT_METADATA_EXPAND } from "@/lib/data/cached";
import { cachedGetProduct } from "@/lib/data/products";
import {
  buildLocalizedAlternates,
  translationFingerprint,
} from "@/lib/metadata/alternates";
import { stripHtml } from "@/lib/seo";
import { DEFAULT_SURFACE } from "@/lib/spree";
import { getStoreUrl } from "@/lib/store";

interface ProductMetadataParams {
  country: string;
  locale: string;
  slug: string;
}

export async function generateProductMetadata({
  country,
  locale,
  slug,
}: ProductMetadataParams): Promise<Metadata> {
  let product;
  try {
    product = await getCachedProduct(slug, PRODUCT_METADATA_EXPAND);
  } catch {
    return { title: "Product Not Found" };
  }

  const title = product.meta_title || product.name;
  const description = product.meta_description
    ? product.meta_description
    : product.description
      ? stripHtml(product.description).slice(0, 160)
      : `Shop ${product.name}`;

  const storeUrl = getStoreUrl();
  const localizedAlternates = storeUrl
    ? await buildLocalizedAlternates({
        storeUrl,
        country,
        locale,
        path: `/products/${product.slug}`,
        currentResourceFingerprint: productTranslationFingerprint(product),
        resolvePath: async (target) => {
          const localizedProduct = await cachedGetProduct(
            product.id,
            [],
            { country: target.country, locale: target.locale },
            DEFAULT_SURFACE,
          );
          return {
            path: `/products/${localizedProduct.slug}`,
            fingerprint: productTranslationFingerprint(localizedProduct),
          };
        },
      })
    : undefined;

  const primaryMedia = product.primary_media;
  const ogSrc =
    primaryMedia?.og_image_url ||
    primaryMedia?.original_url ||
    product.thumbnail_url ||
    null;
  const ogImage =
    ogSrc && storeUrl
      ? {
          url: `${storeUrl}/_next/image?url=${encodeURIComponent(ogSrc)}&w=1200&q=75`,
          ...(primaryMedia?.og_image_url ? { width: 1200, height: 630 } : {}),
          alt: primaryMedia?.alt || product.name,
        }
      : ogSrc
        ? { url: ogSrc, alt: primaryMedia?.alt || product.name }
        : null;

  return {
    title,
    description,
    ...(product.meta_keywords ? { keywords: product.meta_keywords } : {}),
    ...(localizedAlternates
      ? {
          alternates: {
            canonical: localizedAlternates.canonical,
            languages: localizedAlternates.languages,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      ...(localizedAlternates ? { url: localizedAlternates.canonical } : {}),
      type: "website",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    other: {
      ...(product.price?.amount
        ? { "product:price:amount": product.price.amount }
        : {}),
      ...(product.price?.currency
        ? { "product:price:currency": product.price.currency }
        : {}),
    },
  };
}

function productTranslationFingerprint(product: {
  name: string;
  slug: string;
  description: string | null;
  description_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
}): string {
  return translationFingerprint(
    product.name,
    product.slug,
    product.description,
    product.description_html,
    product.meta_title,
    product.meta_description,
    product.meta_keywords,
  );
}
