"use server";

import type { ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";

/**
 * Cached product list fetch. Cache key is derived from all function
 * arguments by Next.js "use cache":
 *
 * - locale/country: determines language and market-specific pricing
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Each user's JWT is unique so the cache is segmented per user.
 *   Guest users pass undefined.
 */
export async function cachedListProducts(
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("products");
  return getClient().products.list(params, options);
}

export async function getProducts(params?: ProductListParams) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListProducts(params, options, userToken);
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
