import Link from "next/link";
import { getTranslations } from "next-intl/server";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">{storeName}</span>
            <p className="mt-4 text-sm">{t("description")}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("shop")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link
                  href="/taxonomies"
                  className="hover:text-white transition-colors"
                >
                  {t("categories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("account")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/account"
                  className="hover:text-white transition-colors"
                >
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-white transition-colors"
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:text-white transition-colors"
                >
                  {t("cart")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <p>{t("copyright", { year: new Date().getFullYear(), storeName })}</p>
        </div>
      </div>
    </footer>
  );
}
