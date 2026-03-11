"use client";

import { LayoutGrid } from "lucide-react";
import type { ImageProps } from "next/image";
import { ProductImage } from "./product-image";

type CategoryImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  iconClassName?: string;
};

/**
 * Thin wrapper around `ProductImage` that uses the `LayoutGrid` icon as
 * its placeholder. This exists because Lucide components (classes) cannot
 * be passed as props from Server Components to Client Components — the
 * import must happen inside a `"use client"` module.
 */
export function CategoryImage({
  iconClassName,
  ...rest
}: CategoryImageProps): React.JSX.Element {
  return (
    <ProductImage icon={LayoutGrid} iconClassName={iconClassName} {...rest} />
  );
}
