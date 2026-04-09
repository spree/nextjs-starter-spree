"use server";

import type { ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getClient, getLocaleOptions } from "@/lib/spree";

async function cachedListProducts(
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("products");
  return getClient().products.list(params, options);
}

export async function getProducts(params?: ProductListParams) {
  const options = await getLocaleOptions();
  return cachedListProducts(params, options);
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
