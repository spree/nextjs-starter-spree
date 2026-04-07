"use server";

import type { ProductListParams } from "@spree/sdk";
import { getClient, getLocaleOptions } from "@/lib/spree";

export async function getProducts(params?: ProductListParams) {
  const options = await getLocaleOptions();
  return getClient().products.list(params, options);
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  return getClient().products.get(slugOrId, params, options);
}

export async function getProductFilters(params?: Record<string, unknown>) {
  const options = await getLocaleOptions();
  return getClient().products.filters(params, options);
}
