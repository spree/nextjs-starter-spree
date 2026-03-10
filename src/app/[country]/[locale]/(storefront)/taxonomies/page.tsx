import type { Taxon, Taxonomy } from "@spree/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryImage } from "@/components/ui/category-image";
import { getTaxonomies } from "@/lib/data/taxonomies";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Categories",
    description: "Browse product categories",
  };
}

interface CategoriesPageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

function getTopLevelTaxons(taxons: Taxon[] | undefined): Taxon[] {
  if (!taxons) return [];
  // Filter to only show depth 1 taxons (direct children of root)
  return taxons.filter((taxon) => taxon.depth === 1);
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  let taxonomies: Taxonomy[] = [];
  try {
    const response = await getTaxonomies({
      limit: 100,
      expand: ["taxons"],
    });
    taxonomies = response.data;
  } catch (error) {
    console.error("Failed to fetch taxonomies:", error);
    taxonomies = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Categories</h1>

      {taxonomies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories found.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {taxonomies.map((taxonomy) => {
            const topLevelTaxons = getTopLevelTaxons(taxonomy.taxons);

            return (
              <div key={taxonomy.id}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {taxonomy.name}
                </h2>

                {topLevelTaxons.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {topLevelTaxons.map((taxon) => {
                      const imageSrc =
                        taxon.square_image_url || taxon.image_url || null;
                      return (
                        <Link
                          key={taxon.id}
                          href={`${basePath}/t/${taxon.permalink}`}
                          className="group"
                        >
                          <div className="relative aspect-square bg-white border border-gray-200 rounded-xl overflow-hidden mb-3 group-hover:ring-2 group-hover:ring-gray-500 transition-all">
                            <CategoryImage
                              src={imageSrc}
                              alt={taxon.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              iconClassName="w-12 h-12"
                            />
                          </div>
                          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                            {taxon.name}
                          </h3>
                          {taxon.children_count > 0 && (
                            <p className="text-sm text-gray-500">
                              {taxon.children_count} subcategories
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No categories in this group.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
