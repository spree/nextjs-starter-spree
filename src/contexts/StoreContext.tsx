"use client";

import type { StoreCountry, StoreStore } from "@spree/sdk";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCountries as getCountriesAction } from "@/lib/data/countries";
import { getStore as getStoreAction } from "@/lib/data/store";
import { setStoreCookies } from "@/lib/utils/cookies";
import { getPathWithoutPrefix } from "@/lib/utils/path";

interface StoreContextValue {
  country: string;
  locale: string;
  currency: string;
  store: StoreStore | null;
  countries: StoreCountry[];
  setCountry: (country: string) => void;
  setLocale: (locale: string) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  initialCountry: string;
  initialLocale: string;
}

function resolveCountryAndCurrency(
  countriesData: StoreCountry[],
  storeData: StoreStore,
  urlCountry: string,
): {
  country: StoreCountry | undefined;
  currency: string;
  needsRedirect: boolean;
} {
  const urlCountryInList = countriesData.find(
    (c) => c.iso.toLowerCase() === urlCountry.toLowerCase(),
  );

  if (!urlCountryInList && countriesData.length > 0) {
    const defaultCountryIso = storeData.default_country_iso?.toLowerCase();
    const defaultCountry = defaultCountryIso
      ? countriesData.find((c) => c.iso.toLowerCase() === defaultCountryIso)
      : countriesData[0];

    return {
      country: defaultCountry,
      currency: defaultCountry?.default_currency || storeData.default_currency,
      needsRedirect: true,
    };
  }

  const currentCountry = urlCountryInList || countriesData[0];
  const currency =
    currentCountry?.default_currency || storeData.default_currency || "USD";

  return { country: currentCountry, currency, needsRedirect: false };
}

export function StoreProvider({
  children,
  initialCountry,
  initialLocale,
}: StoreProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [country, setCountryState] = useState(initialCountry);
  const [locale, setLocaleState] = useState(initialLocale);
  const [currency, setCurrency] = useState("USD");
  const [store, setStore] = useState<StoreStore | null>(null);
  const [countries, setCountries] = useState<StoreCountry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch store and countries data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeData, countriesData] = await Promise.all([
          getStoreAction(),
          getCountriesAction(),
        ]);

        setStore(storeData);
        setCountries(countriesData.data);

        const resolved = resolveCountryAndCurrency(
          countriesData.data,
          storeData,
          initialCountry,
        );

        if (resolved.needsRedirect && resolved.country) {
          const newLocale =
            resolved.country.default_locale || storeData.default_locale || "en";
          const pathRest = getPathWithoutPrefix(pathname);
          const newPath = `/${resolved.country.iso.toLowerCase()}/${newLocale}${pathRest}`;

          setStoreCookies(resolved.country.iso.toLowerCase(), newLocale);
          setCountryState(resolved.country.iso.toLowerCase());
          setLocaleState(newLocale);
          setCurrency(resolved.currency);
          router.replace(newPath);
          setLoading(false);
          return;
        }

        if (resolved.country) {
          setCountryState(resolved.country.iso.toLowerCase());
        }
        setCurrency(resolved.currency);
      } catch (error) {
        console.error("Failed to fetch store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // pathname is intentionally excluded — this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCountry, router]);

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    const countryData = countries.find(
      (c) => c.iso.toLowerCase() === newCountry.toLowerCase(),
    );
    if (countryData?.default_currency) {
      setCurrency(countryData.default_currency);
    }
  };

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
  };

  return (
    <StoreContext.Provider
      value={{
        country,
        locale,
        currency,
        store,
        countries,
        setCountry,
        setLocale,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
