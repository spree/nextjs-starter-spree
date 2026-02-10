"use server";

import {
  listTaxonomies,
  getTaxonomy as _getTaxonomy,
  listTaxons,
  getTaxon as _getTaxon,
} from "@spree/next";

export async function getTaxonomies(
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return listTaxonomies(params, options);
}

export async function getTaxonomy(
  id: string,
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return _getTaxonomy(id, params, options);
}

export async function getTaxons(
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return listTaxons(params, options);
}

export async function getTaxon(
  idOrPermalink: string,
  params?: Record<string, unknown>,
  options?: { locale?: string; currency?: string },
) {
  return _getTaxon(idOrPermalink, params, options);
}
