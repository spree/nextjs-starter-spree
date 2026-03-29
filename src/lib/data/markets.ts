"use server";

import { getClient, getLocaleOptions } from "@spree/next";
import type { Market } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";

async function cachedListMarkets(options: {
  locale?: string;
  country?: string;
}) {
  "use cache";
  cacheLife("hours");
  cacheTag("markets");
  return getClient().markets.list(options);
}

async function cachedResolveMarket(
  country: string,
  options: { locale?: string; country?: string },
) {
  "use cache";
  cacheLife("hours");
  cacheTag("resolved-market");
  return getClient().markets.resolve(country, options);
}

async function cachedListMarketCountries(
  marketId: string,
  options: { locale?: string; country?: string },
) {
  "use cache";
  cacheLife("hours");
  cacheTag("market-countries");
  return getClient().markets.countries.list(marketId, options);
}

export async function getMarkets(options?: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
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
