"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import type { CountryWithMarket } from "@/contexts/StoreContext";
import { updateCartMarket } from "@/lib/data/checkout";
import { setStoreCookies } from "@/lib/utils/cookies";
import { getPathWithoutPrefix } from "@/lib/utils/path";

interface UseCountrySwitchOptions {
  currentCountry: string;
  currentLocale: string;
  onBeforeNavigate?: () => void;
}

interface UseCountrySwitchResult {
  isCartLoading: boolean;
  isCountryNavigating: boolean;
  handleCountrySelect: (
    entry: CountryWithMarket,
    locale?: string,
  ) => Promise<boolean>;
}

export function useCountrySwitch({
  currentCountry,
  currentLocale,
  onBeforeNavigate,
}: UseCountrySwitchOptions): UseCountrySwitchResult {
  const { cart, loading: isCartLoading, refreshCart } = useCart();
  const pathname = usePathname();
  const [isCountryNavigating, setIsCountryNavigating] = useState(false);

  const handleCountrySelect = async (
    entry: CountryWithMarket,
    locale?: string,
  ): Promise<boolean> => {
    const nextCountry = entry.iso.toLowerCase();
    const activeCountry = currentCountry.toLowerCase();
    const newLocale = locale || entry.default_locale || "en";

    if (isCountryNavigating) {
      return false;
    }

    if (nextCountry === activeCountry && newLocale === currentLocale) {
      return true;
    }

    if (isCartLoading) {
      return false;
    }

    setIsCountryNavigating(true);

    const newCurrency = entry.currency;
    const pathRest = getPathWithoutPrefix(pathname);
    const newPath = `/${nextCountry}/${newLocale}${pathRest}`;

    try {
      if (
        cart &&
        (cart.currency !== newCurrency || cart.locale !== newLocale)
      ) {
        const result = await updateCartMarket(cart.id, {
          currency: newCurrency,
          locale: newLocale,
        });

        if (!result.success) {
          return false;
        }

        await refreshCart();
      }

      setStoreCookies(nextCountry, newLocale);
      onBeforeNavigate?.();
      window.location.assign(
        `${newPath}${window.location.search}${window.location.hash}`,
      );
      return true;
    } catch {
      return false;
    } finally {
      setIsCountryNavigating(false);
    }
  };

  return {
    isCartLoading,
    isCountryNavigating,
    handleCountrySelect,
  };
}
