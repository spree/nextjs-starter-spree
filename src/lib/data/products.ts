"use server";

import {
  listProducts,
  getProduct as _getProduct,
  getProductFilters as _getProductFilters,
  listTaxonProducts,
} from "@spree/next";

export async function getProducts(
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return listProducts(params, options);
}

export async function getProduct(
  slugOrId: string,
  params?: { includes?: string },
  options?: { locale?: string; currency?: string },
) {
  return _getProduct(slugOrId, params, options);
}

export async function getProductFilters(
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return _getProductFilters(params, options);
}

export async function getTaxonProducts(
  taxonId: string,
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return listTaxonProducts(taxonId, params, options);
}
