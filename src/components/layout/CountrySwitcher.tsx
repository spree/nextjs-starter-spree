"use client";

import { Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { type CountryWithMarket, useStore } from "@/contexts/StoreContext";
import { updateOrderMarket } from "@/lib/data/checkout";
import { setStoreCookies } from "@/lib/utils/cookies";
import { getPathWithoutPrefix } from "@/lib/utils/path";

// Convert ISO country code to flag emoji
// Uses regional indicator symbols: A=🇦 (U+1F1E6), B=🇧 (U+1F1E7), etc.
function countryToFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "";

  const firstChar = code.charCodeAt(0) - 65 + 0x1f1e6;
  const secondChar = code.charCodeAt(1) - 65 + 0x1f1e6;

  return String.fromCodePoint(firstChar, secondChar);
}

export function CountrySwitcher() {
  const { country, currency, countries, setCountry, loading } = useStore();
  const { cart, refreshCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Handle country selection — derive locale and currency from the country's market
  const handleCountrySelect = async (entry: CountryWithMarket) => {
    const newLocale = entry.default_locale || "en";
    const newCurrency = entry.currency;
    const pathRest = getPathWithoutPrefix(pathname);
    const newPath = `/${entry.iso.toLowerCase()}/${newLocale}${pathRest}`;

    // Update existing cart if currency or locale changed
    if (cart && (cart.currency !== newCurrency || cart.locale !== newLocale)) {
      const result = await updateOrderMarket(cart.id, {
        currency: newCurrency,
        locale: newLocale,
      });
      if (!result.success) {
        return;
      }
      await refreshCart();
    }

    setStoreCookies(entry.iso.toLowerCase(), newLocale);
    setCountry(entry.iso.toLowerCase());

    router.push(newPath);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <span className="text-lg leading-none">{countryToFlag(country)}</span>
          <span className="font-medium">{country.toUpperCase()}</span>
          <span className="text-gray-400">|</span>
          <span>{currency}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Country</DropdownMenuLabel>
        {countries.map((c) => {
          const isSelected = c.iso.toLowerCase() === country.toLowerCase();
          return (
            <DropdownMenuItem
              key={c.iso}
              onSelect={() => handleCountrySelect(c)}
            >
              <span className="text-lg leading-none">
                {countryToFlag(c.iso)}
              </span>
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.currency}
              </span>
              {isSelected && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
