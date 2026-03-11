"use server";

import {
  getCategory as _getCategory,
  listCategories,
  listCategoryProducts,
} from "@spree/next";
import type { CategoryListParams, ProductListParams } from "@spree/sdk";

export async function getCategories(params?: CategoryListParams) {
  return listCategories(params);
}

export async function getCategory(
  idOrPermalink: string,
  params?: CategoryListParams,
) {
  return _getCategory(idOrPermalink, params);
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  return listCategoryProducts(categoryId, params);
}
