import { cache } from "react";
import { getCategory } from "./categories";
import { getProduct } from "./products";

/** Expand list used on the product detail page. */
export const PRODUCT_PAGE_EXPAND = [
  "variants",
  "media",
  "option_types",
  "custom_fields",
  "categories.ancestors",
];

/** Slim expand used by generateProductMetadata (needs only the primary image for og:image). */
export const PRODUCT_METADATA_EXPAND = ["primary_media"];

export const getCachedProduct = cache((slugOrId: string, expand: string[]) =>
  getProduct(slugOrId, { expand }),
);

export const getCachedCategory = cache(
  (idOrPermalink: string, expand: string[]) =>
    getCategory(idOrPermalink, { expand }),
);
