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
  onBeforeNavigate?: () => void;
}

interface UseCountrySwitchResult {
  isCountryNavigating: boolean;
  handleCountrySelect: (entry: CountryWithMarket) => Promise<void>;
}

export function useCountrySwitch({
  currentCountry,
  onBeforeNavigate,
}: UseCountrySwitchOptions): UseCountrySwitchResult {
  const { cart, refreshCart } = useCart();
  const pathname = usePathname();
  const [isCountryNavigating, setIsCountryNavigating] = useState(false);

  const handleCountrySelect = async (
    entry: CountryWithMarket,
  ): Promise<void> => {
    const nextCountry = entry.iso.toLowerCase();
    const activeCountry = currentCountry.toLowerCase();
    if (isCountryNavigating || nextCountry === activeCountry) {
      return;
    }

    setIsCountryNavigating(true);

    const newLocale = entry.default_locale || "en";
    const newCurrency = entry.currency;
    const pathRest = getPathWithoutPrefix(pathname);
    const newPath = `/${nextCountry}/${newLocale}${pathRest}`;

    if (cart && (cart.currency !== newCurrency || cart.locale !== newLocale)) {
      const result = await updateCartMarket(cart.id, {
        currency: newCurrency,
        locale: newLocale,
      });

      if (!result.success) {
        setIsCountryNavigating(false);
        return;
      }

      await refreshCart();
    }

    setStoreCookies(nextCountry, newLocale);
    onBeforeNavigate?.();
    window.location.assign(newPath);
  };

  return {
    isCountryNavigating,
    handleCountrySelect,
  };
}
