"use client";

import { ArrowLeft, ChevronDown, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CheckoutProvider, CheckoutSummary } from "@/contexts/CheckoutContext";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { extractBasePath } from "@/lib/utils/path";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";

function CheckoutHeader() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  return (
    <header className="flex items-center justify-between">
      <Link href={basePath || "/"} className="flex items-center space-x-2">
        <Image
          src="/spree.png"
          alt={storeName}
          width={90}
          height={32}
          priority
        />
      </Link>
      <Link
        href={basePath || "/"}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        aria-label="Back to store"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Back to store</span>
      </Link>
    </header>
  );
}

function CheckoutFooter() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 text-xs text-gray-500 border-t border-gray-200 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
      <p>
        &copy; {currentYear} {storeName}. All rights reserved.
      </p>
      {POLICY_LINKS.map((policy) => (
        <Link
          key={policy.slug}
          href={`${basePath}/policies/${policy.slug}`}
          target="_blank"
          className="text-gray-500 underline hover:text-gray-700"
        >
          {policy.name}
        </Link>
      ))}
    </footer>
  );
}

function MobileSummaryToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <ShoppingBag className="w-5 h-5 text-gray-600" />
          {isOpen ? "Hide order summary" : "Show order summary"}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <CheckoutSummary />
        </div>
      )}
    </div>
  );
}

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

function CheckoutLayoutContent({ children }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile header */}
      <div className="lg:hidden border-b border-gray-200">
        <div className="px-5">
          <CheckoutHeader />
        </div>
      </div>

      {/* Mobile summary toggle */}
      <MobileSummaryToggle />

      {/* Main checkout grid — Shopify proportions */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_minmax(0,440px)_1fr]">
        {/* Main content area — white bg */}
        <div className="lg:col-start-2 flex flex-col">
          <div className="flex-1 px-5 py-6 lg:pl-10 lg:pr-12 lg:py-10">
            {/* Desktop header */}
            <div className="hidden lg:block mb-8">
              <CheckoutHeader />
            </div>
            {children}
          </div>
          <div className="px-5 lg:pl-10 lg:pr-12 pb-4">
            <CheckoutFooter />
          </div>
        </div>

        {/* Desktop summary sidebar — Shopify: light gray bg with left border */}
        <div className="hidden lg:block lg:col-start-3 border-l border-gray-200 bg-gray-50">
          <div className="sticky top-0 px-10 py-10">
            <CheckoutSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <CheckoutProvider>
      <CheckoutLayoutContent>{children}</CheckoutLayoutContent>
    </CheckoutProvider>
  );
}
