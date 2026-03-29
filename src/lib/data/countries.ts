"use server";

import { getClient, getLocaleOptions } from "@spree/next";

export async function getCountries() {
  const options = await getLocaleOptions();
  return getClient().countries.list(options);
}

export async function getCountry(iso: string) {
  const options = await getLocaleOptions();
  return getClient().countries.get(iso, { expand: ["states"] }, options);
}
