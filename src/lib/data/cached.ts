import { getCategory, getProduct } from "@spree/next";
import { cache } from "react";

/** Expand list used on the product detail page (shared by page + metadata). */
export const PRODUCT_PAGE_EXPAND = [
  "variants",
  "media",
  "option_types",
  "metafields",
];

export const getCachedProduct = cache(
  (slugOrId: string, expand: string[], locale: string) =>
    getProduct(slugOrId, { expand }, { locale }),
);

export const getCachedCategory = cache(
  (idOrPermalink: string, expand: string[], locale: string) =>
    getCategory(idOrPermalink, { expand }, { locale }),
);
