"use server";

import { getSpreeClient } from "@/lib/spree";

interface ListOptions {
  currency?: string;
  locale?: string;
}

export async function getCountries(options?: ListOptions) {
  const client = getSpreeClient();
  return client.countries.list(options);
}

export async function getCountry(isoCode: string, options?: ListOptions) {
  const client = getSpreeClient();
  return client.countries.get(isoCode, options);
}
