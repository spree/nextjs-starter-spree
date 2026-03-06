import type { Metadata } from "next";
import { generateProductsMetadata } from "@/lib/metadata/products";
import { ProductsContent } from "./ProductsContent";

interface ProductsPageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { country, locale } = await params;
  return generateProductsMetadata({ country, locale });
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  return <ProductsContent basePath={basePath} />;
}
