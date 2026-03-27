import { getCategory, getProduct } from "@spree/next";
import { cache } from "react";

/** Expand list used on the product detail page (shared by page + metadata). */
export const PRODUCT_PAGE_EXPAND = [
  "variants",
  "media",
  "option_types",
  "metafields",
];

export const getCachedProduct = cache((slugOrId: string, expand: string[]) =>
  getProduct(slugOrId, { expand }),
);

export const getCachedCategory = cache(
  (idOrPermalink: string, expand: string[]) =>
    getCategory(idOrPermalink, { expand }),
);
