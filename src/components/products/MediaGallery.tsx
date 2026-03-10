"use client";

import type { Image as SpreeImage } from "@spree/sdk";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "@/components/ui/product-image";

/** Tiny 10×10 neutral gray PNG used as a blur placeholder while images load. */
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIElEQVQYV2P4////MwwMDAxMDAwMDGQJMJCvkGwNZCsEAGebBwVss9lRAAAAAElFTkSuQmCC";

interface MediaGalleryProps {
  images: SpreeImage[];
  productName: string;
}

export function MediaGallery({ images, productName }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
        <ProductImage
          src={null}
          alt={productName}
          fill
          iconClassName="w-24 h-24"
        />
      </div>
    );
  }

  const selectImage = (index: number | ((prev: number) => number)) => {
    setSelectedIndex(index);
    setMainImageError(false);
  };

  const selectedImage = images[selectedIndex];
  const mainImageUrl = selectedImage?.original_url || null;
  const showMainImage = mainImageUrl && !mainImageError;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <button
        type="button"
        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in w-full"
        onClick={() => showMainImage && setIsZoomed(true)}
        aria-label="Open image zoom"
        disabled={!showMainImage}
      >
        <ProductImage
          key={selectedIndex}
          src={mainImageUrl}
          alt={selectedImage?.alt || productName}
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          iconClassName="w-24 h-24"
          onError={() => setMainImageError(true)}
        />
        {/* Zoom hint */}
        {showMainImage && (
          <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-gray-600 flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4" />
            Click to zoom
          </div>
        )}
      </button>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = image.original_url;
            return (
              <button
                type="button"
                key={image.id}
                onClick={() => selectImage(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors bg-gray-100 ${
                  index === selectedIndex
                    ? "border-gray-600"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <ProductImage
                  src={thumbUrl}
                  alt={image.alt || `${productName} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {isZoomed && showMainImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsZoomed(false)}
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  selectImage((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1,
                  );
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  selectImage((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1,
                  );
                }}
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="relative max-w-4xl max-h-[90vh] w-full h-full m-4">
            <Image
              src={selectedImage?.original_url || mainImageUrl!}
              alt={selectedImage?.alt || productName}
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-lg text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
