"use client";

import type { Category } from "@spree/sdk";
import { Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { extractBasePath } from "@/lib/utils/path";

interface HeaderProps {
  rootCategories: Category[];
}

export function Header({ rootCategories }: HeaderProps) {
  const { itemCount, openCart } = useCart();
  const { storeName } = useStore();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchTriggerRef.current?.focus();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 relative">
      {/* Normal header content */}
      <div
        className={`absolute inset-0 transition-all duration-300 ease-in-out ${
          searchOpen
            ? "translate-y-4 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center h-full w-full">
            {/* Left section: hamburger */}
            <div className="flex items-center flex-1">
              <MobileMenu rootCategories={rootCategories} basePath={basePath} />
            </div>

            {/* Center section: logo (always centered via equal flex-1 siblings) */}
            <div className="flex justify-center min-w-0">
              <Link
                href={basePath || "/"}
                className="flex items-center min-w-0"
              >
                <Image
                  src="/spree.png"
                  alt={storeName}
                  width={90}
                  height={32}
                  className="h-8 w-auto max-w-full object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Right section: actions */}
            <div className="flex items-center flex-1 justify-end space-x-2">
              {/* Country/Currency Switcher - desktop only (hidden on mobile+tablet) */}
              <div className="hidden lg:block">
                <CountrySwitcher />
              </div>

              {/* Search toggle */}
              <Button
                ref={searchTriggerRef}
                variant="ghost"
                size="icon-lg"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                aria-expanded={searchOpen}
                aria-controls="search-overlay"
              >
                <Search className="size-5" />
              </Button>

              {/* Account - desktop only */}
              <div className="hidden md:block">
                <Button variant="ghost" size="icon-lg" asChild>
                  <Link href={`${basePath}/account`} aria-label="Account">
                    <User className="size-5" />
                  </Link>
                </Button>
              </div>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={openCart}
                aria-label="Open cart"
                className="relative"
              >
                <ShoppingBag className="size-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside overlay — closes search when clicking anywhere outside */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSearch}
          role="presentation"
        />
      )}

      {/* Search bar - replaces header content */}
      <div
        id="search-overlay"
        inert={!searchOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeSearch();
        }}
        className={`absolute inset-0 z-50 transition-all duration-300 ease-in-out ${
          searchOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              key={String(searchOpen)}
              basePath={basePath}
              autoFocus={searchOpen}
              onNavigate={closeSearch}
            />
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={closeSearch}
            aria-label="Close search"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
