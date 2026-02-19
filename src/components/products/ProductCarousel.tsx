"use client";

import type { StoreProduct } from "@spree/sdk";
import { useEffect, useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { ProductCard } from "@/components/products/ProductCard";
import { useStore } from "@/contexts/StoreContext";
import { getProducts, getTaxonProducts } from "@/lib/data/products";

interface ProductCarouselProps {
  taxonId?: string;
  limit?: number;
  basePath: string;
}

export function ProductCarousel({
  taxonId,
  limit = 8,
  basePath,
}: ProductCarouselProps) {
  const { currency, locale, loading: storeLoading } = useStore();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeLoading) return;

    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const options = { currency, locale };
        const params = { per_page: limit };

        const response = taxonId
          ? await getTaxonProducts(taxonId, params, options)
          : await getProducts(params, options);

        if (!cancelled) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch carousel products:", error);
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
  }, [currency, locale, storeLoading, taxonId, limit]);

  if (loading || storeLoading) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[calc(25%-18px)] animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="carousel-button-prev absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center cursor-pointer rounded-full bg-white border border-gray-300 text-gray-600 shadow-md hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        className="carousel-button-next absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center cursor-pointer rounded-full bg-white border border-gray-300 text-gray-600 shadow-md hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
      <Swiper
        modules={[Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        navigation={{
          prevEl: ".carousel-button-prev",
          nextEl: ".carousel-button-next",
        }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 24 },
          768: { slidesPerView: 3, spaceBetween: 24 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="product-carousel"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="p-1">
            <ProductCard product={product} basePath={basePath} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
