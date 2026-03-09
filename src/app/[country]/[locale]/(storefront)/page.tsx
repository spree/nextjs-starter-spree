import Link from "next/link";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { Button } from "@/components/ui/button";

interface HomePageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              Welcome to Spree Store
            </h1>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
              Discover amazing products with our modern e-commerce experience
              powered by Spree Commerce.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={`${basePath}/products`}>Shop Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`${basePath}/taxonomies`}>Browse Categories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Products
          </h2>
          <Button variant="link" asChild>
            <Link href={`${basePath}/products`}>View all &rarr;</Link>
          </Button>
        </div>
        <ProductCarousel basePath={basePath} />
      </section>
    </div>
  );
}
