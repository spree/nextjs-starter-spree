"use client";

import type { Category } from "@spree/sdk";
import { ArrowLeft, Check, ChevronRight, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStore } from "@/contexts/StoreContext";
import { useCountrySwitch } from "@/hooks/useCountrySwitch";

// Convert ISO country code to flag emoji
function countryToFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "";
  const firstChar = code.charCodeAt(0) - 65 + 0x1f1e6;
  const secondChar = code.charCodeAt(1) - 65 + 0x1f1e6;
  return String.fromCodePoint(firstChar, secondChar);
}

type PanelType =
  | { kind: "main" }
  | { kind: "category"; category: Category }
  | { kind: "country" };

interface MobileMenuProps {
  rootCategories: Category[];
  basePath: string;
}

export function MobileMenu({ rootCategories, basePath }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [panelStack, setPanelStack] = useState<PanelType[]>([{ kind: "main" }]);
  // animatedIndex trails panelStack — new panels mount off-screen, then animate in
  const [animatedIndex, setAnimatedIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { country, currency, countries } = useStore();
  const router = useRouter();
  const { isCountryNavigating, handleCountrySelect } = useCountrySwitch({
    currentCountry: country,
    onBeforeNavigate: () => setOpen(false),
  });

  const currentPanel = panelStack[panelStack.length - 1];

  const cancelPendingCallbacks = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const pushPanel = (panel: PanelType) => {
    cancelPendingCallbacks();
    // Step 1: mount the new panel off-screen (translate-x-full) via flushSync
    flushSync(() => {
      setPanelStack((prev) => [...prev, panel]);
    });
    // Step 2: on next frame, update animatedIndex to trigger slide-in
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setAnimatedIndex((prev) => prev + 1);
    });
  };

  const popPanel = () => {
    cancelPendingCallbacks();
    // Step 1: animate out by decrementing animatedIndex
    setAnimatedIndex((prev) => Math.max(0, prev - 1));
    // Step 2: after transition, remove the panel from the stack
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setPanelStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, 300);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      cancelPendingCallbacks();
      setPanelStack([{ kind: "main" }]);
      setAnimatedIndex(0);
    }
  };

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Flatten root categories: show their children directly instead of taxonomy names
  const menuCategories = rootCategories.flatMap((root) => root.children ?? []);

  // Shared link style
  const linkClass =
    "text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2.5 text-base transition-colors";

  // Shared button style for items with children (chevron)
  const categoryButtonClass =
    "flex items-center justify-between w-full text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2.5 text-base transition-colors";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* Animated hamburger / X button — two-phase animation matching Lottie reference */}
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => {
          if (!hasInteracted) setHasInteracted(true);
          setOpen(!open);
        }}
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative z-[60] cursor-pointer"
      >
        <div className="relative w-5 h-5">
          {/* Top line: phase 1 translates to center, phase 2 rotates 45° */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full top-[2px] ${
              hasInteracted
                ? open
                  ? "animate-hamburger-top-open"
                  : "animate-hamburger-top-close"
                : ""
            }`}
          />
          {/* Middle line: fades out in phase 1, fades in after delay on close */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full top-1/2 -translate-y-1/2 ${
              hasInteracted
                ? open
                  ? "animate-hamburger-mid-open"
                  : "animate-hamburger-mid-close"
                : ""
            }`}
            style={
              hasInteracted && !open
                ? { animationDelay: "0.2s", opacity: 0 }
                : undefined
            }
          />
          {/* Bottom line: phase 1 translates to center, phase 2 rotates -45° */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full bottom-[2px] ${
              hasInteracted
                ? open
                  ? "animate-hamburger-bottom-open"
                  : "animate-hamburger-bottom-close"
                : ""
            }`}
          />
        </div>
      </Button>

      <SheetContent
        side="left"
        className="flex flex-col !gap-0 !rounded-none overflow-hidden max-md:!top-16 max-md:!h-[calc(100%-4rem)] max-md:!w-full max-md:!max-w-none max-md:!border-r-0"
        showCloseButton={false}
        overlayClassName="max-md:!top-16 max-md:!bg-transparent"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        {/* Menu header — changes based on active panel */}
        <div className="hidden md:flex items-center justify-between px-4 h-16 border-b border-gray-200 relative overflow-hidden">
          {/* "Menu" title — visible when on main panel */}
          <span
            className={`text-base font-semibold transition-all duration-300 ease-in-out absolute left-4 ${
              currentPanel.kind === "main"
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0 pointer-events-none"
            }`}
          >
            Menu
          </span>
          {/* Back button + category name — visible on sub-panels */}
          <button
            type="button"
            onClick={popPanel}
            className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out absolute left-4 ${
              currentPanel.kind !== "main"
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0 pointer-events-none"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>
              {currentPanel.kind === "category"
                ? currentPanel.category.name
                : currentPanel.kind === "country"
                  ? "Select Country"
                  : ""}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="cursor-pointer ml-auto"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Sliding panels container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Main menu panel */}
          <div
            className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out ${
              animatedIndex === 0 && currentPanel.kind === "main"
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          >
            <nav className="flex flex-col gap-1 px-4 flex-1 overflow-y-auto pt-2">
              <button
                type="button"
                onClick={() => handleNavigate(basePath || "/")}
                className={linkClass}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavigate(`${basePath}/products`)}
                className={linkClass}
              >
                All Products
              </button>
              {menuCategories.map((category) =>
                category.children && category.children.length > 0 ? (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => pushPanel({ kind: "category", category })}
                    className={categoryButtonClass}
                  >
                    <span>{category.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      handleNavigate(`${basePath}/c/${category.permalink}`)
                    }
                    className={linkClass}
                  >
                    {category.name}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => handleNavigate(`${basePath}/#contact`)}
                className={linkClass}
              >
                Contact
              </button>
            </nav>

            {/* Footer: Country switcher (mobile + tablet) + Account (mobile only) */}
            <SheetFooter className="lg:hidden border-t border-gray-200 pt-4 gap-2">
              <button
                type="button"
                onClick={() => pushPanel({ kind: "country" })}
                className="flex items-center gap-2 px-4 py-2.5 text-base text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
              >
                <span className="text-lg leading-none">
                  {countryToFlag(country)}
                </span>
                <span className="font-medium">{country.toUpperCase()}</span>
                <span className="text-gray-400">|</span>
                <span>{currency}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </button>

              <SheetClose asChild className="md:hidden">
                <Link
                  href={`${basePath}/account`}
                  className="flex items-center justify-center gap-2 mx-4 mb-2 px-4 py-3 bg-black text-white rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
                >
                  <User className="size-5" />
                  <span>My Account</span>
                </Link>
              </SheetClose>
            </SheetFooter>
          </div>

          {/* Category sub-panels — one for each level in the stack */}
          {panelStack.map((panel, index) => {
            if (panel.kind !== "category") return null;
            const isAnimatedIn = index <= animatedIndex;
            let translateClass = "translate-x-full";
            if (isAnimatedIn && index < panelStack.length - 1)
              translateClass = "-translate-x-full";
            else if (isAnimatedIn) translateClass = "translate-x-0";

            return (
              <div
                key={`cat-${panel.category.id}-${index}`}
                className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out ${translateClass}`}
              >
                {/* Back button (mobile only — desktop uses the global header) */}
                <div className="md:hidden px-4 py-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={popPanel}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 py-2 text-base font-medium"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{panel.category.name}</span>
                  </button>
                </div>

                {/* Children */}
                <nav className="flex flex-col gap-1 px-4 flex-1 overflow-y-auto pt-2">
                  {panel.category.children?.map((child) =>
                    child.children && child.children.length > 0 ? (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() =>
                          pushPanel({ kind: "category", category: child })
                        }
                        className={categoryButtonClass}
                      >
                        <span>{child.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ) : (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() =>
                          handleNavigate(`${basePath}/c/${child.permalink}`)
                        }
                        className={linkClass}
                      >
                        {child.name}
                      </button>
                    ),
                  )}
                </nav>

                {/* "View all" at the bottom */}
                <div className="border-t border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleNavigate(
                        `${basePath}/c/${panel.category.permalink}`,
                      )
                    }
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-900 py-2 transition-colors"
                  >
                    View all {panel.category.name}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Country selector panel */}
          <div
            className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out ${
              currentPanel.kind === "country" &&
              animatedIndex === panelStack.length - 1
                ? "translate-x-0"
                : "translate-x-full"
            }`}
          >
            <div className="md:hidden px-4 py-2 border-b border-gray-200">
              <button
                type="button"
                onClick={popPanel}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 py-2 text-base font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Select Country</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {countries.map((c) => {
                const isSelected =
                  c.iso.toLowerCase() === country.toLowerCase();
                return (
                  <button
                    key={c.iso}
                    type="button"
                    disabled={isCountryNavigating}
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors ${
                      isSelected
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg leading-none">
                      {countryToFlag(c.iso)}
                    </span>
                    <span className="flex-1 text-left font-medium">
                      {c.name}
                    </span>
                    <span className="text-sm text-gray-500">{c.currency}</span>
                    {isSelected && <Check className="w-4 h-4 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
