import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { CategoryBanner } from "@/components/navigation/CategoryBanner";
import { getTaxon } from "@/lib/data/taxonomies";
import { CategoryProductsContent } from "./CategoryProductsContent";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{
    country: string;
    locale: string;
    permalink: string[];
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { country, locale, permalink } = await params;
  const fullPermalink = permalink.join("/");
  const basePath = `/${country}/${locale}`;

  let taxon;
  try {
    taxon = await getTaxon(fullPermalink, {
      expand: ["ancestors", "children"],
    });
  } catch (error) {
    console.error("Failed to fetch taxon:", error);
    notFound();
  }

  if (!taxon) {
    notFound();
  }

  return (
    <div>
      {/* Banner Image — returns null when image missing or fails to load */}
      <CategoryBanner imageUrl={taxon.image_url} name={taxon.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs taxon={taxon} basePath={basePath} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{taxon.name}</h1>
        </div>

        {/* Description */}
        {taxon.description && (
          <p className="mb-8 text-gray-600">{taxon.description}</p>
        )}

        {/* Subcategories */}
        {taxon.children && taxon.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subcategories
            </h2>
            <div className="flex flex-wrap gap-2">
              {taxon.children.map((child) => (
                <a
                  key={child.id}
                  href={`${basePath}/t/${child.permalink}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {child.name}
                  {child.children_count > 0 && (
                    <span className="ml-1 text-gray-400">
                      ({child.children_count})
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <CategoryProductsContent
          taxonPermalink={fullPermalink}
          taxonId={taxon.id}
          taxonName={taxon.name}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
