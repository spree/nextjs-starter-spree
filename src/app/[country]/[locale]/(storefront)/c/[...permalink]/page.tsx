import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { CategoryBanner } from "@/components/navigation/CategoryBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategory } from "@/lib/data/categories";
import { generateCategoryMetadata } from "@/lib/metadata/category";
import { buildBreadcrumbJsonLd, getStoreUrl } from "@/lib/seo";
import { CategoryProductsContent } from "./CategoryProductsContent";

interface CategoryPageProps {
  params: Promise<{
    country: string;
    locale: string;
    permalink: string[];
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { country, locale, permalink } = await params;
  return generateCategoryMetadata({ country, locale, permalink });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { country, locale, permalink } = await params;
  const fullPermalink = permalink.join("/");
  const basePath = `/${country}/${locale}`;

  let category;
  try {
    category = await getCategory(fullPermalink, {
      expand: ["ancestors", "children"],
    });
  } catch (error) {
    console.error("Failed to fetch category:", error);
    notFound();
  }

  if (!category) {
    notFound();
  }

  const storeUrl = getStoreUrl();

  return (
    <div>
      {storeUrl && (
        <JsonLd data={buildBreadcrumbJsonLd(category, basePath, storeUrl)} />
      )}

      {/* Banner Image — returns null when image missing or fails to load */}
      <CategoryBanner imageUrl={category.image_url} name={category.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs category={category} basePath={basePath} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        </div>

        {/* Description */}
        {category.description && (
          <p className="mb-8 text-gray-600">{category.description}</p>
        )}

        {/* Subcategories */}
        {category.children && category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subcategories
            </h2>
            <div className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`${basePath}/c/${child.permalink}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <CategoryProductsContent
          categoryPermalink={fullPermalink}
          categoryId={category.id}
          categoryName={category.name}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
