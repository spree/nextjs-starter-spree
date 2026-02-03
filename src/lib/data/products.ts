"use server";

import type { ProductFiltersResponse, StoreProduct } from "@spree/sdk";
import { getSpreeClient } from "@/lib/spree";

interface ProductListOptions {
  currency?: string;
  locale?: string;
}

interface ProductListParams {
  page?: number;
  per_page?: number;
  "q[multi_search]"?: string;
  "q[in_taxon]"?: string;
  "q[price_between][]"?: number[];
  "q[with_option_value][]"?: string[];
  "q[in_stock]"?: boolean;
  "q[s]"?: string;
  [key: string]: unknown;
}

export async function getProducts(
  params?: ProductListParams,
  options?: ProductListOptions,
) {
  const client = getSpreeClient();
  return client.products.list(params as Record<string, unknown>, options);
}

export async function getProduct(
  slug: string,
  params?: { includes?: string },
  options?: ProductListOptions,
): Promise<StoreProduct> {
  const client = getSpreeClient();
  return client.products.get(slug, params, options);
}

export async function getProductFilters(
  params?: {
    taxon_id?: string;
    "q[multi_search]"?: string;
    [key: string]: unknown;
  },
  options?: ProductListOptions,
): Promise<ProductFiltersResponse> {
  const client = getSpreeClient();
  return client.products.filters(params, options);
}

export async function getTaxonProducts(
  taxonPermalink: string,
  params?: ProductListParams,
  options?: ProductListOptions,
) {
  const client = getSpreeClient();
  return client.taxons.products.list(
    taxonPermalink,
    params as Record<string, unknown>,
    options,
  );
}
