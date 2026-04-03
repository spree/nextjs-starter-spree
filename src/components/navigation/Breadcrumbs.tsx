import type { Category } from "@spree/sdk";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BreadcrumbsProps {
  category: Category;
  basePath: string;
  productName?: string;
}

export function Breadcrumbs({
  category,
  basePath,
  productName,
}: BreadcrumbsProps) {
  // Build breadcrumb items from ancestors + current category
  const items = [{ name: "Home", href: basePath }];

  // Add ancestors (they come from the API in order from root to parent)
  if (category.ancestors && category.ancestors.length > 0) {
    category.ancestors.forEach((ancestor) => {
      items.push({
        name: ancestor.name,
        href: `${basePath}/c/${ancestor.permalink}`,
      });
    });
  }

  // On PDP, the category is a link and the product name is the last item.
  // On category pages, the category itself is the last (non-clickable) item.
  if (productName) {
    items.push({
      name: category.name,
      href: `${basePath}/c/${category.permalink}`,
    });
    items.push({ name: productName, href: "" });
  } else {
    items.push({ name: category.name, href: "" });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
              {isLast ? (
                <span className="text-gray-500" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-primary hover:text-primary/70"
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
