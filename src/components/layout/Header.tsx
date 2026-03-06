"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon, UserIcon } from "@/components/icons";
import { SearchBar } from "@/components/search/SearchBar";
import { useCart } from "@/contexts/CartContext";
import { extractBasePath } from "@/lib/utils/path";
import { CountrySwitcher } from "./CountrySwitcher";

export function Header() {
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("header");
  const tc = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={basePath || "/"} className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              {tc("spreeStore")}
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchBar basePath={basePath} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={`${basePath}/taxonomies`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t("categories")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Country/Currency Switcher */}
            <CountrySwitcher />

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={t("openCart")}
            >
              <ShoppingBagIcon className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Account */}
            <Link
              href={`${basePath}/account`}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={t("account")}
            >
              <UserIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
