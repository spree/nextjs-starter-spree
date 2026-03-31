"use client";

import type { Country, Market } from "@spree/sdk";
import { createContext, type ReactNode, useContext, useMemo } from "react";

/** Country enriched with market info (currency, locale, etc.) */
export interface CountryWithMarket extends Country {
  currency: string;
  default_locale: string;
  marketId: string | null;
}

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";
const storeDescription =
  process.env.NEXT_PUBLIC_STORE_DESCRIPTION ||
  "A modern e-commerce storefront powered by Spree Commerce and Next.js.";

interface StoreContextValue {
  storeName: string;
  storeDescription: string;
  country: string;
  locale: string;
  currency: string;
  countries: CountryWithMarket[];
  loading: boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  initialCountry: string;
  initialLocale: string;
  initialMarkets: Market[];
}

/** Build a flat country list from markets, enriching each country with market info. */
function buildCountriesFromMarkets(markets: Market[]): CountryWithMarket[] {
  const seen = new Set<string>();
  const result: CountryWithMarket[] = [];

  for (const market of markets) {
    for (const country of market.countries ?? []) {
      if (seen.has(country.iso)) continue;
      seen.add(country.iso);

      result.push({
        ...country,
        currency: market.currency,
        default_locale: market.default_locale,
        marketId: market.id,
      });
    }
  }

  return result;
}

/** Find a country by ISO code in the flat countries list. */
function findCountry(
  countries: CountryWithMarket[],
  countryIso: string,
): CountryWithMarket | undefined {
  return countries.find(
    (c) => c.iso.toLowerCase() === countryIso.toLowerCase(),
  );
}

export function StoreProvider({
  children,
  initialCountry,
  initialLocale,
  initialMarkets,
}: StoreProviderProps) {
  const countries = useMemo(
    () => buildCountriesFromMarkets(initialMarkets),
    [initialMarkets],
  );

  const selectedCountry = useMemo(
    () => findCountry(countries, initialCountry),
    [countries, initialCountry],
  );

  // The layout performs server-side validation, so the URL country should
  // always be valid. Use fallbacks only as a defensive measure.
  const country = (selectedCountry?.iso || initialCountry).toLowerCase();
  const locale = selectedCountry
    ? initialLocale
    : (countries[0]?.default_locale ?? initialLocale);
  const currency = selectedCountry?.currency ?? countries[0]?.currency ?? "USD";

  const value = useMemo<StoreContextValue>(
    () => ({
      storeName,
      storeDescription,
      country,
      locale,
      currency,
      countries,
      loading: false,
    }),
    [country, locale, currency, countries],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
