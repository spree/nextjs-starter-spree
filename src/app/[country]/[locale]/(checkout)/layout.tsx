"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreName } from "@/lib/store";
import { extractBasePath } from "@/lib/utils/path";

const storeName = getStoreName();

function CheckoutHeader() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");

  return (
    <header className="flex items-center justify-between">
      <Link href={basePath || "/"} className="flex items-center space-x-2">
        <Image
          src="/spree.png"
          alt={storeName}
          width={90}
          height={32}
          fetchPriority="high"
          loading="eager"
        />
      </Link>
      <Link
        href={basePath || "/"}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        aria-label={t("backToStore")}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("backToStore")}</span>
      </Link>
    </header>
  );
}

function CheckoutFooter() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");
  const tp = useTranslations("policies");

  return (
    <footer className="py-4 text-xs text-gray-500 border-t border-gray-200 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
      <p>
        {t("allRightsReserved", { year: new Date().getFullYear(), storeName })}
      </p>
      {POLICY_LINKS.map((policy) => (
        <Link
          key={policy.slug}
          href={`${basePath}/policies/${policy.slug}`}
          target="_blank"
          className="text-gray-500 underline hover:text-gray-700"
        >
          {tp(policy.nameKey)}
        </Link>
      ))}
    </footer>
  );
}

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile header */}
      <div className="lg:hidden border-b border-gray-200">
        <div className="px-5">
          <CheckoutHeader />
        </div>
      </div>

      {/* Main checkout grid — Shopify proportions */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_minmax(0,440px)_1fr]">
        {/* Content area — pages render form + sidebar in columns 2-3 */}
        <div className="lg:col-start-2 lg:col-span-2 flex flex-col">
          <div className="flex-1">
            {/* Desktop header */}
            <div className="hidden lg:block px-5 lg:pl-10 lg:pr-12 pt-10">
              <CheckoutHeader />
            </div>
            {children}
          </div>
          <div className="px-5 lg:pl-10 lg:pr-12 pb-4">
            <CheckoutFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
