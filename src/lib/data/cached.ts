import { getProduct, getStore, getTaxon } from "@spree/next";
import { cache } from "react";

export const getCachedProduct = cache(
  (slugOrId: string, includes: string, locale: string) =>
    getProduct(slugOrId, { includes }, { locale }),
);

export const getCachedTaxon = cache(
  (idOrPermalink: string, includes: string, locale: string) =>
    getTaxon(idOrPermalink, { includes }, { locale }),
);

export const getCachedStore = cache((locale: string) => getStore({ locale }));
