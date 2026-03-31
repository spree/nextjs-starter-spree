"use server";

import type { CategoryListParams, ProductListParams } from "@spree/sdk";
import { getClient, getLocaleOptions } from "@/lib/spree";

export async function getCategories(params?: CategoryListParams) {
  const options = await getLocaleOptions();
  return getClient().categories.list(params, options);
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
