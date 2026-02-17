import type { StoreTaxon } from "@spree/sdk";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

interface BreadcrumbsProps {
  taxon: StoreTaxon;
  basePath: string;
}

export function Breadcrumbs({ taxon, basePath }: BreadcrumbsProps) {
  // Build breadcrumb items from ancestors + current taxon
  const items = [
    { name: "Home", href: basePath },
    { name: "Categories", href: `${basePath}/taxonomies` },
  ];

  // Add ancestors (they come from the API in order from root to parent)
  if (taxon.ancestors && taxon.ancestors.length > 0) {
    taxon.ancestors.forEach((ancestor) => {
      // Skip the root taxon (it's usually just the taxonomy name)
      if (!ancestor.is_root) {
        items.push({
          name: ancestor.name,
          href: `${basePath}/t/${ancestor.permalink}`,
        });
      }
    });
  }

  // Add current taxon (not a link)
  items.push({ name: taxon.name, href: "" });

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
              )}
              {isLast ? (
                <span className="text-gray-500" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
