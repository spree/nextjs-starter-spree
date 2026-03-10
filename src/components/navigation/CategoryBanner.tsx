"use client";

import Image from "next/image";
import { useState } from "react";

interface CategoryBannerProps {
  imageUrl: string | null | undefined;
  name: string;
}

/**
 * Full-width category hero image banner. Returns `null` when no image URL is
 * provided or the image fails to load, so the page gracefully falls back to
 * a plain title.
 *
 * The category name is rendered as a `<span>` (not `<h1>`) because the page
 * always renders its own `<h1>` below — this avoids duplicate headings.
 */
export function CategoryBanner({
  imageUrl,
  name,
}: CategoryBannerProps): React.JSX.Element | null {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return null;
  }

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-80 bg-gray-100">
      <Image
        src={imageUrl}
        alt={name}
        fill
        priority
        className="object-cover"
        sizes="100vw"
        onError={() => setHasError(true)}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
          aria-hidden="true"
        >
          {name}
        </span>
      </div>
    </div>
  );
}
