import type { Category } from "@spree/sdk";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCategories } from "@/lib/data/categories";

function CategoryLinks({
  categories,
  basePath,
}: {
  categories: Category[];
  basePath: string;
}) {
  return (
    <ul>
      {categories.map((category) => (
        <li key={category.id}>
          <a href={`${basePath}/c/${category.permalink}`}>{category.name}</a>
          {category.children && category.children.length > 0 && (
            <CategoryLinks categories={category.children} basePath={basePath} />
          )}
        </li>
      ))}
    </ul>
  );
}

interface ShellProps {
  basePath: string;
  locale: string;
  country: string;
}

async function fetchCategories() {
  return getCategories({
    depth_eq: 0,
    expand: ["children.children"],
  })
    .then((res) => res.data)
    .catch(() => [] as Category[]);
}

export async function StorefrontHeader({
  basePath,
  locale,
  country: _country,
}: ShellProps) {
  const rootCategories = await fetchCategories();

  return (
    <>
      <Header
        rootCategories={rootCategories}
        basePath={basePath}
        locale={locale as Locale}
      />
      {rootCategories.length > 0 && (
        <nav aria-label="Category navigation" className="sr-only">
          <CategoryLinks categories={rootCategories} basePath={basePath} />
        </nav>
      )}
    </>
  );
}

export async function StorefrontFooter({
  basePath,
  locale,
  country: _country,
}: ShellProps) {
  const rootCategories = await fetchCategories();

  return (
    <Footer
      rootCategories={rootCategories}
      basePath={basePath}
      locale={locale as Locale}
    />
  );
}
