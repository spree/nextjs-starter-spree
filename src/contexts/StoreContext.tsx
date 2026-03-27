"use client";

import type { Country, Market } from "@spree/sdk";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { setStoreCookies } from "@/lib/utils/cookies";
import { getPathWithoutPrefix } from "@/lib/utils/path";

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

function resolveCountryAndCurrency(
  countries: CountryWithMarket[],
  urlCountry: string,
): {
  selectedCountry: CountryWithMarket | undefined;
  effectiveCountry: CountryWithMarket | undefined;
  needsRedirect: boolean;
} {
  const selectedCountry = findCountry(countries, urlCountry);

  if (selectedCountry) {
    return {
      selectedCountry,
      effectiveCountry: selectedCountry,
      needsRedirect: false,
    };
  }

  const defaultCountry = countries[0];
  return {
    selectedCountry: undefined,
    effectiveCountry: defaultCountry,
    needsRedirect: Boolean(defaultCountry),
  };
}

export function StoreProvider({
  children,
  initialCountry,
  initialLocale,
  initialMarkets,
}: StoreProviderProps) {
  const pathname = usePathname();
  const countries = useMemo(
    () => buildCountriesFromMarkets(initialMarkets),
    [initialMarkets],
  );

  const resolved = useMemo(
    () => resolveCountryAndCurrency(countries, initialCountry),
    [countries, initialCountry],
  );

  const country = (
    resolved.effectiveCountry?.iso || initialCountry
  ).toLowerCase();
  const locale = resolved.selectedCountry
    ? initialLocale
    : (resolved.effectiveCountry?.default_locale ?? initialLocale);
  const currency = resolved.effectiveCountry?.currency ?? "USD";
  const loading = false;

  useEffect(() => {
    if (!resolved.needsRedirect || !resolved.effectiveCountry) return;

    const newLocale = resolved.effectiveCountry.default_locale || "en";
    const pathRest = getPathWithoutPrefix(pathname);
    const nextCountry = resolved.effectiveCountry.iso.toLowerCase();
    const newPath = `/${nextCountry}/${newLocale}${pathRest}`;
    setStoreCookies(nextCountry, newLocale);
    window.location.replace(newPath);
  }, [pathname, resolved]);

  const value = useMemo<StoreContextValue>(
    () => ({
      storeName,
      storeDescription,
      country,
      locale,
      currency,
      countries,
      loading,
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
