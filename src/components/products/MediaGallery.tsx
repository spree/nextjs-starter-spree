"use client";

import type { Media } from "@spree/sdk";
import { ZoomIn } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProductImage } from "@/components/ui/product-image";

/** Tiny 10×10 neutral gray PNG used as a blur placeholder while images load. */
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIElEQVQYV2P4////MwwMDAxMDAwMDGQJMJCvkGwNZCsEAGebBwVss9lRAAAAAElFTkSuQmCC";

/** Lazy-loaded lightbox — only pulled into the bundle when a user zooms. */
const LazyMediaLightbox = dynamic(
  () =>
    import("@/components/products/MediaLightbox").then((mod) => ({
      default: mod.MediaLightbox,
    })),
  {
    ssr: false,
    // Minimal fullscreen overlay so the zoom click gives immediate
    // feedback on slow networks while the chunk downloads.
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/90" aria-hidden="true" />
    ),
  },
);

interface MediaGalleryProps {
  images: Media[];
  productName: string;
  activeIndex?: number | null;
}

/** Prefer pre-sized Spree media URLs over the full-resolution original,
 * so the Next.js image optimizer doesn't have to fetch the source file. */
function getMainImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return media.xlarge_url || media.large_url || media.original_url || null;
}

function getThumbImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return media.small_url || media.mini_url || media.original_url || null;
}

export function MediaGallery(props: MediaGalleryProps) {
  // Reset internal state when the parent changes activeIndex by rekeying.
  // Avoids the useEffect-to-sync-prop antipattern.
  return <MediaGalleryInner key={props.activeIndex ?? "default"} {...props} />;
}

function MediaGalleryInner({
  images,
  productName,
  activeIndex,
}: MediaGalleryProps) {
  const t = useTranslations("products");
  const [selectedIndex, setSelectedIndex] = useState(activeIndex ?? 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mainImageErrorUrl, setMainImageErrorUrl] = useState<string | null>(
    null,
  );

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

  const selectImage = (index: number) => {
    setSelectedIndex(index);
    setMainImageErrorUrl(null);
  };

  const safeIndex = Math.max(0, Math.min(selectedIndex, images.length - 1));
  const selectedImage = images[safeIndex];
  const mainImageUrl = getMainImageUrl(selectedImage);
  const showMainImage = mainImageUrl && mainImageErrorUrl !== mainImageUrl;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <button
        type="button"
        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in w-full"
        onClick={() => showMainImage && setIsZoomed(true)}
        aria-label={t("openImageZoom")}
        disabled={!showMainImage}
      >
        <ProductImage
          key={safeIndex}
          src={mainImageUrl}
          alt={selectedImage?.alt || productName}
          fill
          className="object-cover"
          fetchPriority="high"
          loading="eager"
          priority
          quality={85}
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          iconClassName="w-24 h-24"
          onError={() => mainImageUrl && setMainImageErrorUrl(mainImageUrl)}
        />
        {/* Zoom hint */}
        {showMainImage && (
          <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-gray-600 flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4" />
            {t("clickToZoom")}
          </div>
        )}
      </button>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = getThumbImageUrl(image);
            return (
              <button
                type="button"
                key={image.id}
                onClick={() => selectImage(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors bg-gray-100 ${
                  index === safeIndex
                    ? "border-gray-600"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <ProductImage
                  src={thumbUrl}
                  alt={image.alt || `${productName} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox (lazy) */}
      {isZoomed && showMainImage && (
        <LazyMediaLightbox
          images={images}
          activeIndex={safeIndex}
          productName={productName}
          onClose={() => setIsZoomed(false)}
          onNavigate={selectImage}
        />
      )}
    </div>
  );
}
