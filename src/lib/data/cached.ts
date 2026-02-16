import { getProduct, getStore, getTaxon } from "@spree/next";
import { cache } from "react";

export const getCachedProduct = cache(getProduct);
export const getCachedTaxon = cache(getTaxon);
export const getCachedStore = cache(getStore);
