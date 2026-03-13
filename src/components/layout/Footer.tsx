"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStore } from "@/contexts/StoreContext";

export function Footer() {
  const { storeName } = useStore();
  const t = useTranslations("footer");
  return (
    <footer className="bg-primary text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">{storeName}</span>
            <p className="mt-4 text-sm text-neutral-400">{t("description")}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("shop")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("categories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("account")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/account"
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("cart")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-800 text-xs text-neutral-500 text-center">
          <p>{t("copyright", { year: new Date().getFullYear(), storeName })}</p>
        </div>
      </div>
    </footer>
  );
}
