import type { Metadata } from "next";
import { getCachedCategory } from "@/lib/data/cached";
import { buildCanonicalUrl, getStoreUrl } from "@/lib/seo";

export interface CategoryMetadataParams {
  country: string;
  locale: string;
  permalink: string[];
}

export async function generateCategoryMetadata({
  country,
  locale,
  permalink,
}: CategoryMetadataParams): Promise<Metadata> {
  const fullPermalink = permalink.join("/");

  let category;
  try {
    category = await getCachedCategory(
      fullPermalink,
      ["ancestors", "children"],
      locale,
    );
  } catch {
    return { title: "Category Not Found" };
  }

  const title = category.meta_title || category.name;
  const description =
    category.meta_description ||
    category.description ||
    `Browse ${category.name} products.`;

  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(
        storeUrl,
        `/${country}/${locale}/c/${category.permalink}`,
      )
    : undefined;

  return {
    title,
    description,
    ...(category.meta_keywords ? { keywords: category.meta_keywords } : {}),
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
      ...(category.image_url
        ? { images: [{ url: category.image_url, alt: category.name }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(category.image_url ? { images: [category.image_url] } : {}),
    },
  };
}
