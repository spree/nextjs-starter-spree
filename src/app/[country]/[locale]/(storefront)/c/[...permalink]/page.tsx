import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategory } from "@/lib/data/categories";
import { generateCategoryMetadata } from "@/lib/metadata/category";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";
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

      <div
        className="flex flex-col justify-end min-h-[350px] bg-gray-50 bg-cover bg-center"
        style={{ backgroundImage: `url(${category.image_url})` }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            category={category}
            basePath={basePath}
            locale={locale}
          />

          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {category.name}
            </h1>
          </div>

          {/* Description */}
          {category.description && (
            <p className="mb-4 text-gray-600">{category.description}</p>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex flex-wrap gap-2 items-center border-b border-gray-100 pb-4">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`${basePath}/c/${child.permalink}`}
                className="px-1.5 py-1 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Products */}
        <CategoryProductsContent
          categoryId={category.id}
          categoryName={category.name}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
