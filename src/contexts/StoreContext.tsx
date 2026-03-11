"use client";

import type { Country, Market } from "@spree/sdk";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
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
  setCountry: (country: string) => void;
  setLocale: (locale: string) => void;
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
  country: CountryWithMarket | undefined;
  currency: string;
  locale: string;
  needsRedirect: boolean;
} {
  const country = findCountry(countries, urlCountry);

  if (country) {
    return {
      country,
      currency: country.currency || "USD",
      locale: country.default_locale || "en",
      needsRedirect: false,
    };
  }

  // Country not found — redirect to first available country
  const defaultCountry = countries[0];
  if (defaultCountry) {
    return {
      country: defaultCountry,
      currency: defaultCountry.currency || "USD",
      locale: defaultCountry.default_locale || "en",
      needsRedirect: true,
    };
  }

  return {
    country: undefined,
    currency: "USD",
    locale: "en",
    needsRedirect: false,
  };
}

export function StoreProvider({
  children,
  initialCountry,
  initialLocale,
  initialMarkets,
}: StoreProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const initialCountries = useMemo(
    () => buildCountriesFromMarkets(initialMarkets),
    [initialMarkets],
  );

  const initialResolved = useMemo(
    () => resolveCountryAndCurrency(initialCountries, initialCountry),
    [initialCountries, initialCountry],
  );

  const [country, setCountryState] = useState(
    initialResolved.country?.iso.toLowerCase() || initialCountry,
  );
  const [locale, setLocaleState] = useState(
    initialResolved.locale || initialLocale,
  );
  const [currency, setCurrency] = useState(initialResolved.currency);
  const [countries] = useState(initialCountries);
  const loading = false;

  // Handle redirect if country from URL is not valid
  const redirectHandled = useRef(false);
  if (
    initialResolved.needsRedirect &&
    initialResolved.country &&
    !redirectHandled.current
  ) {
    redirectHandled.current = true;
    const newLocale = initialResolved.locale;
    const pathRest = getPathWithoutPrefix(pathname);
    const newPath = `/${initialResolved.country.iso.toLowerCase()}/${newLocale}${pathRest}`;
    setStoreCookies(initialResolved.country.iso.toLowerCase(), newLocale);
    router.replace(newPath);
  }

  const setCountry = useCallback(
    (newCountry: string): void => {
      setCountryState(newCountry);
      const countryObj = findCountry(countries, newCountry);
      if (countryObj) {
        setCurrency(countryObj.currency);
        setLocaleState(countryObj.default_locale);
      }
    },
    [countries],
  );

  const setLocale = useCallback((newLocale: string): void => {
    setLocaleState(newLocale);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      storeName,
      storeDescription,
      country,
      locale,
      currency,
      countries,
      setCountry,
      setLocale,
      loading,
    }),
    [country, locale, currency, countries, setCountry, setLocale],
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
