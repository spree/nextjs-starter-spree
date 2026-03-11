import { getCategory, getProduct } from "@spree/next";
import { cache } from "react";

export const getCachedProduct = cache(
  (slugOrId: string, expand: string[], locale: string) =>
    getProduct(slugOrId, { expand }, { locale }),
);

export const getCachedCategory = cache(
  (idOrPermalink: string, expand: string[], locale: string) =>
    getCategory(idOrPermalink, { expand }, { locale }),
);
