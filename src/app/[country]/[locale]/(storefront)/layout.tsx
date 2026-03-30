import type { Category } from "@spree/sdk";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCategories } from "@/lib/data/categories";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ country: string; locale: string }>;
}

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

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  const rootCategories = await getCategories({
    depth_eq: 0,
    expand: ["children.children"],
  })
    .then((res) => res.data)
    .catch(() => [] as Category[]);

  return (
    <>
      <Header rootCategories={rootCategories} />
      {rootCategories.length > 0 && (
        <nav aria-label="Category navigation" className="sr-only">
          <CategoryLinks categories={rootCategories} basePath={basePath} />
        </nav>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
