import type { Category } from "@spree/sdk";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreDescription, getStoreName } from "@/lib/store";

const storeName = getStoreName();
const storeDescription = getStoreDescription();

// Demo-only: Remove for production.
const githubUrl = "https://github.com/spree/storefront";
const quickstartUrl =
  "https://spreecommerce.org/docs/developer/getting-started/quickstart";
const learnMoreUrl = "https://spreecommerce.org";

interface FooterProps {
  rootCategories: Category[];
  basePath: string;
  locale: Locale;
}

export async function Footer({
  rootCategories,
  basePath,
  locale,
}: FooterProps) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tp = await getTranslations({ locale, namespace: "policies" });

  return (
    <footer className="bg-primary text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Demo-only: Remove for production. */}
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">{storeName}</span>
            <p className="mt-4 text-sm text-neutral-400">
              {t("description") || storeDescription}
            </p>
            {/* Demo-only: Remove for production. */}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white hover:text-neutral-200 transition-colors font-medium"
              >
                {t("forkOnGithub")} &rarr;
              </Link>
              <Link
                href={quickstartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {t("quickstartGuide")}
              </Link>
              <Link
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {t("learnMore")}
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("shop")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("allProducts")}
                </Link>
              </li>
              {rootCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`${basePath}/c/${category.permalink}`}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
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
                  href={`${basePath}/account`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/account/orders`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cart`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("cart")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("policies")}
            </h3>
            <ul className="mt-4 space-y-3">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.slug}>
                  <Link
                    href={`${basePath}/policies/${policy.slug}`}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {tp(policy.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-800 text-xs text-neutral-500 text-center">
          <p>
            &copy; {new Date().getFullYear()} {storeName}. {t("poweredBy")}{" "}
            <Link
              href="https://spreecommerce.org"
              target="_blank"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Spree Commerce
            </Link>{" "}
            & Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
