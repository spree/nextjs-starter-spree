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

        // Check if current URL country is in the available countries list
        const urlCountryInList = countriesData.data.find(
          (c) => c.iso.toLowerCase() === initialCountry.toLowerCase(),
        );

        if (!urlCountryInList && countriesData.data.length > 0) {
          // URL country is not in the checkout zone - redirect to store default
          const defaultCountryIso =
            storeData.default_country_iso?.toLowerCase();
          const defaultCountry = defaultCountryIso
            ? countriesData.data.find(
                (c) => c.iso.toLowerCase() === defaultCountryIso,
              )
            : countriesData.data[0];

          if (defaultCountry) {
            const newLocale =
              defaultCountry.default_locale || storeData.default_locale || "en";
            const pathRest = getPathWithoutPrefix(pathname);
            const newPath = `/${defaultCountry.iso.toLowerCase()}/${newLocale}${pathRest}`;

            // Set cookies for persistence
            document.cookie = `spree_country=${defaultCountry.iso.toLowerCase()}; path=/; max-age=31536000`;
            document.cookie = `spree_locale=${newLocale}; path=/; max-age=31536000`;

            // Update state and redirect
            setCountryState(defaultCountry.iso.toLowerCase());
            setLocaleState(newLocale);
            setCurrency(
              defaultCountry.default_currency || storeData.default_currency,
            );
            router.replace(newPath);
            setLoading(false);
            return;
          }
        }

        // URL country is valid - use it
        const currentCountry = urlCountryInList || countriesData.data[0];
        if (currentCountry) {
          setCountryState(currentCountry.iso.toLowerCase());
          if (currentCountry.default_currency) {
            setCurrency(currentCountry.default_currency);
          } else if (storeData.default_currency) {
            setCurrency(storeData.default_currency);
          }
        } else if (storeData.default_currency) {
          setCurrency(storeData.default_currency);
        }
      } catch (error) {
        console.error("Failed to fetch store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialCountry, router]);

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    // Update currency based on new country
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
