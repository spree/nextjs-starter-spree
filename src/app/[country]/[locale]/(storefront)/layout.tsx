import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCategories } from "@/lib/data/categories";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default async function StorefrontLayout({
  children,
}: StorefrontLayoutProps) {
  const rootCategories = await getCategories({ depth_eq: 0 })
    .then((res) => res.data)
    .catch(() => []);

  return (
    <>
      <Header rootCategories={rootCategories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
