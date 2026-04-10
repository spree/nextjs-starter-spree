"use client";

import type { Media } from "@spree/sdk";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";

interface MediaLightboxProps {
  images: Media[];
  activeIndex: number;
  productName: string;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Fullscreen image lightbox. Lazy-loaded from MediaGallery so its
 * keyboard handlers, navigation UI, and next/image full-size render
 * don't ship in the initial product page bundle.
 *
 * Exposed as a real modal dialog (role="dialog", aria-modal="true") with
 * focus moved to the close button on open and restored on close so
 * screen-reader and keyboard users can't get stuck in the page behind
 * the overlay.
 */
export function MediaLightbox({
  images,
  activeIndex,
  productName,
  onClose,
  onNavigate,
}: MediaLightboxProps): React.ReactElement | null {
  const t = useTranslations("products");
  const current = images[activeIndex];
  const src =
    current?.xlarge_url || current?.large_url || current?.original_url || null;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const goPrev = useCallback(() => {
    onNavigate(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }, [activeIndex, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, images.length, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  // Focus management: capture the previously focused element when the
  // lightbox mounts, move focus into the dialog, then restore it on
  // unmount so keyboard users return to the element that opened it.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("openImageZoom")}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        onClick={onClose}
        aria-label={t("lightboxClose")}
      >
        <X className="w-8 h-8" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label={t("lightboxPrev")}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label={t("lightboxNext")}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div className="relative max-w-4xl max-h-[90vh] w-full h-full m-4">
        <Image
          src={src}
          alt={current?.alt || productName}
          fill
          className="object-contain"
          sizes="100vw"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-lg text-sm">
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
