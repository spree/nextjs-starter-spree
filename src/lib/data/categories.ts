"use server";

import type { CategoryListParams, ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getClient, getLocaleOptions } from "@/lib/spree";

async function cachedListCategories(
  params: CategoryListParams | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("categories");
  return getClient().categories.list(params, options);
}

export async function getCategories(params?: CategoryListParams) {
  const options = await getLocaleOptions();
  return cachedListCategories(params, options);
}

export async function getCategory(
  idOrPermalink: string,
  params?: CategoryListParams,
) {
  const options = await getLocaleOptions();
  return getClient().categories.get(idOrPermalink, params, options);
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const options = await getLocaleOptions();
  return getClient().products.list(
    { ...params, in_category: categoryId },
    options,
  );
}
