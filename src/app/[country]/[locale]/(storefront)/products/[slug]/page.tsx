import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCachedProduct } from "@/lib/data/cached";
import { generateProductMetadata } from "@/lib/metadata/product";
import { buildCanonicalUrl, buildProductJsonLd, getStoreUrl } from "@/lib/seo";
import { ProductDetailsWrapper } from "./ProductDetailsWrapper";

interface ProductPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { country, locale, slug } = await params;
  return generateProductMetadata({ country, locale, slug });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { country, locale, slug } = await params;
  const basePath = `/${country}/${locale}`;

  let product;
  try {
    product = await getCachedProduct(slug, ["images"], locale);
  } catch {
    product = null;
  }

  const storeUrl = getStoreUrl();
  const canonicalUrl =
    product && storeUrl
      ? buildCanonicalUrl(
          storeUrl,
          `/${country}/${locale}/products/${product.slug}`,
        )
      : undefined;

  return (
    <>
      {product && canonicalUrl && (
        <JsonLd data={buildProductJsonLd(product, canonicalUrl)} />
      )}
      <ProductDetailsWrapper slug={slug} basePath={basePath} />
    </>
  );
}
