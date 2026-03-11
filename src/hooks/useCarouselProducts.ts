import type { Product } from "@spree/sdk";
import { useEffect, useState } from "react";
import { getCategoryProducts } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";

interface UseCarouselProductsOptions {
  categoryId?: string;
  limit?: number;
}

interface UseCarouselProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export function useCarouselProducts({
  categoryId,
  limit = 8,
}: UseCarouselProductsOptions = {}): UseCarouselProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit };

        const response = categoryId
          ? await getCategoryProducts(categoryId, params)
          : await getProducts(params);

        if (!cancelled) {
          setProducts(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch carousel products:", err);
        if (!cancelled) {
          setError("Failed to load products. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [categoryId, limit]);

  return { products, loading, error };
}
