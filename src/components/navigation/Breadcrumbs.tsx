import Link from 'next/link'
import type { StoreTaxon } from '@spree/sdk'

interface BreadcrumbsProps {
  taxon: StoreTaxon
  basePath: string
}

export function Breadcrumbs({ taxon, basePath }: BreadcrumbsProps) {
  // Build breadcrumb items from ancestors + current taxon
  const items = [
    { name: 'Home', href: basePath },
    { name: 'Categories', href: `${basePath}/taxonomies` },
  ]

  // Add ancestors (they come from the API in order from root to parent)
  if (taxon.ancestors && taxon.ancestors.length > 0) {
    taxon.ancestors.forEach((ancestor) => {
      // Skip the root taxon (it's usually just the taxonomy name)
      if (!ancestor.is_root) {
        items.push({
          name: ancestor.name,
          href: `${basePath}/t/${ancestor.permalink}`,
        })
      }
    })
  }

  // Add current taxon (not a link)
  items.push({ name: taxon.name, href: '' })

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="text-gray-500" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
