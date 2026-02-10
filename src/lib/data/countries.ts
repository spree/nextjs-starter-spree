"use server";

import { listCountries, getCountry as _getCountry } from "@spree/next";

export async function getCountries(options?: { locale?: string; currency?: string }) {
  return listCountries(options);
}

export async function getCountry(
  iso: string,
  options?: { locale?: string; currency?: string },
) {
  return _getCountry(iso, options);
}
