"use client";

import { ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { extractBasePath } from "@/lib/utils/path";
import { CountrySwitcher } from "./CountrySwitcher";

export function Header() {
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={basePath || "/"} className="flex items-center space-x-2">
            <Image src="/spree.png" alt="Spree Store" width={90} height={32} />
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
              Categories
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Country/Currency Switcher */}
            <CountrySwitcher />

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              aria-label="Open cart"
              className="relative"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* Account */}
            <Link
              href={`${basePath}/account`}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Account"
            >
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
