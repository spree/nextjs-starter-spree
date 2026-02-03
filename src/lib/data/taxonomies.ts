"use server";

import { getSpreeClient } from "@/lib/spree";

interface TaxonomyListParams {
  page?: number;
  per_page?: number;
  includes?: string;
}

interface TaxonListParams {
  page?: number;
  per_page?: number;
  "q[parent_id_null]"?: boolean;
  "q[taxonomy_id_eq]"?: string;
  includes?: string;
}

interface ListOptions {
  currency?: string;
  locale?: string;
}

export async function getTaxonomies(
  params?: TaxonomyListParams,
  options?: ListOptions,
) {
  const client = getSpreeClient();
  return client.taxonomies.list(params, options);
}

export async function getTaxonomy(
  id: string,
  params?: { includes?: string },
  options?: ListOptions,
) {
  const client = getSpreeClient();
  return client.taxonomies.get(id, params, options);
}

export async function getTaxons(
  params?: TaxonListParams,
  options?: ListOptions,
) {
  const client = getSpreeClient();
  return client.taxons.list(params, options);
}

export async function getTaxon(
  idOrPermalink: string,
  params?: { includes?: string },
  options?: ListOptions,
) {
  const client = getSpreeClient();
  return client.taxons.get(idOrPermalink, params, options);
}
