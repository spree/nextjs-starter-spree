"use server";

import type { SpreeNextOptions } from "@spree/next";
import {
  listMarketCountries as _listMarketCountries,
  listMarkets as _listMarkets,
  resolveMarket as _resolveMarket,
} from "@spree/next";
import type { Market } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

const DEFAULT_COUNTRY_COOKIE = "spree_country";
const DEFAULT_LOCALE_COOKIE = "spree_locale";

async function getLocaleOptions(): Promise<SpreeNextOptions> {
  const cookieStore = await cookies();
  return {
    locale: cookieStore.get(DEFAULT_LOCALE_COOKIE)?.value,
    country: cookieStore.get(DEFAULT_COUNTRY_COOKIE)?.value,
  };
}

async function cachedListMarkets(options: SpreeNextOptions) {
  "use cache";
  cacheLife("hours");
  cacheTag("markets");
  return _listMarkets(options);
}

async function cachedResolveMarket(country: string, options: SpreeNextOptions) {
  "use cache";
  cacheLife("hours");
  cacheTag("resolved-market");
  return _resolveMarket(country, options);
}

async function cachedListMarketCountries(
  marketId: string,
  options: SpreeNextOptions,
) {
  "use cache";
  cacheLife("hours");
  cacheTag("market-countries");
  return _listMarketCountries(marketId, options);
}

export async function getMarkets(
  options?: SpreeNextOptions,
): Promise<{ data: Market[] }> {
  const resolvedOptions = options ?? (await getLocaleOptions());
  return cachedListMarkets(resolvedOptions);
}

export async function resolveMarket(country: string) {
  const options = await getLocaleOptions();
  return cachedResolveMarket(country, options);
}

export async function getMarketCountries(marketId: string) {
  const options = await getLocaleOptions();
  return cachedListMarketCountries(marketId, options);
}
