"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { extractBasePath } from "@/lib/utils/path";

export function Footer() {
  const { storeName, storeDescription } = useStore();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  return (
    <footer className="bg-primary text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">{storeName}</span>
            <p className="mt-4 text-sm text-neutral-400">{storeDescription}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Shop</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Account</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={`${basePath}/account`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/account/orders`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Order History
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cart`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Policies</h3>
            <ul className="mt-4 space-y-3">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.slug}>
                  <Link
                    href={`${basePath}/policies/${policy.slug}`}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {policy.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-800 text-xs text-neutral-500 text-center">
          <p>
            &copy; {new Date().getFullYear()} {storeName}. Powered by Spree
            Commerce.
          </p>
        </div>
      </div>
    </footer>
  );
}
