import { getSpreeClient } from '@/lib/spree'
import Link from 'next/link'
import type { StoreTaxon, StoreTaxonomy } from '@spree/sdk'

export const revalidate = 60

interface CategoriesPageProps {
  params: Promise<{
    country: string
    locale: string
  }>
}

async function getTaxonomies(): Promise<StoreTaxonomy[]> {
  try {
    const client = getSpreeClient()
    const response = await client.taxonomies.list({
      per_page: 100,
      includes: 'taxons',
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch taxonomies:', error)
    return []
  }
}

function getTopLevelTaxons(taxons: StoreTaxon[] | undefined): StoreTaxon[] {
  if (!taxons) return []
  // Filter to only show depth 1 taxons (direct children of root)
  return taxons.filter((taxon) => taxon.depth === 1)
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { country, locale } = await params
  const taxonomies = await getTaxonomies()
  const basePath = `/${country}/${locale}`

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
            const topLevelTaxons = getTopLevelTaxons(taxonomy.taxons)

            return (
              <div key={taxonomy.id}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {taxonomy.name}
                </h2>

                {topLevelTaxons.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {topLevelTaxons.map((taxon) => (
                      <Link
                        key={taxon.id}
                        href={`${basePath}/t/${taxon.permalink}`}
                        className="group"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                          {taxon.square_image_url || taxon.image_url ? (
                            <img
                              src={taxon.square_image_url || taxon.image_url}
                              alt={taxon.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {taxon.name}
                        </h3>
                        {taxon.children_count > 0 && (
                          <p className="text-sm text-gray-500">
                            {taxon.children_count} subcategories
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No categories in this group.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
