"use server";

import { getClient, getLocaleOptions } from "@spree/next";
import type { CategoryListParams, ProductListParams } from "@spree/sdk";

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
