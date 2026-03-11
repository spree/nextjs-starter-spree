"use client";

import type { Category } from "@spree/sdk";
import { ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { extractBasePath } from "@/lib/utils/path";
import { CountrySwitcher } from "./CountrySwitcher";

interface HeaderProps {
  rootCategories: Category[];
}

export function Header({ rootCategories }: HeaderProps) {
  const { itemCount, openCart } = useCart();
  const { storeName } = useStore();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          <div className="flex items-center w-full max-w-lg">
            {/* Logo */}
            <Link
              href={basePath || "/"}
              className="flex items-center space-x-2"
            >
              <Image
                src="/spree.png"
                alt={storeName}
                width={90}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar basePath={basePath} />
            </div>
          </div>

          <div className="flex items-center">
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 mr-6">
              {rootCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`${basePath}/c/${category.permalink}`}
                  className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Country/Currency Switcher */}
              <CountrySwitcher />

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

              {/* Account */}
              <Button variant="ghost" size="icon-lg" asChild>
                <Link href={`${basePath}/account`} aria-label="Account">
                  <User className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
