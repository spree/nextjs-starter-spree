"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, ChevronDownIcon, ShoppingBagIcon } from "@/components/icons";
import { CheckoutProvider, CheckoutSummary } from "@/contexts/CheckoutContext";
import { useStore } from "@/contexts/StoreContext";
import { extractBasePath } from "@/lib/utils/path";

function CheckoutHeader() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  return (
    <header className="py-4 lg:py-6 flex items-center justify-between">
      <Link href={basePath || "/"} className="inline-flex items-center">
        <span className="text-xl font-bold text-gray-900">Spree Store</span>
      </Link>
      <Link
        href={basePath || "/"}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Back to store</span>
      </Link>
    </header>
  );
}

function CheckoutFooter() {
  const { store } = useStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 text-sm text-gray-500 border-t border-gray-200 mt-auto">
      <p>
        &copy; {currentYear} {store?.name || "Spree Store"}. All rights
        reserved.
      </p>
    </footer>
  );
}

function MobileSummaryToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden bg-gray-50 border-b border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <ShoppingBagIcon className="w-5 h-5 text-gray-600" />
          {isOpen ? "Hide order summary" : "Show order summary"}
        </span>
        <ChevronDownIcon
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
      {/* Mobile header - visible on small screens */}
      <div className="lg:hidden border-b border-gray-200">
        <div className="px-5">
          <CheckoutHeader />
        </div>
      </div>

      {/* Mobile summary toggle */}
      <MobileSummaryToggle />

      {/* Main checkout grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,650px)_minmax(0,455px)_1fr]">
        {/* Main content area */}
        <div className="lg:col-start-2 flex flex-col">
          <div className="flex-1 px-5 py-6 lg:px-10 lg:py-10">
            {/* Desktop header - hidden on mobile */}
            <div className="hidden lg:block mb-6">
              <CheckoutHeader />
            </div>
            {children}
          </div>
          <div className="px-5 lg:px-10 pb-4">
            <CheckoutFooter />
          </div>
        </div>

        {/* Desktop summary sidebar */}
        <div className="hidden lg:block lg:col-start-3 bg-gray-50">
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
