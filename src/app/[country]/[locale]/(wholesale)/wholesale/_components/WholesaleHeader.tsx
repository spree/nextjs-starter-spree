"use client";

import { ArrowLeft, LogOut, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

interface WholesaleHeaderProps {
  basePath: string;
  /** Signed-in buyer's name. Omitted for a guest browsing a prices-hidden catalog. */
  customerName?: string;
  /**
   * Whether a customer is signed in. When false (a guest on a `prices_hidden`
   * channel) the header swaps the name + cart + sign-out for a single sign-in
   * link, since a guest has no wholesale cart and nothing to sign out of.
   */
  authenticated?: boolean;
  /** Sign-in destination for the guest affordance (includes `?redirect=`). */
  signInHref?: string;
}

/**
 * Portal chrome for the wholesale surface. Distinct slate trade dress with a
 * "Wholesale" badge and a link back to the DTC store. For a signed-in buyer it
 * also shows the wholesale cart, their name, and sign-out; for a guest browsing
 * a prices-hidden catalog it shows a sign-in link instead. The cart count comes
 * from the wholesale-bound <CartProvider> the layout wraps this in.
 */
export function WholesaleHeader({
  basePath,
  customerName,
  authenticated = true,
  signInHref,
}: WholesaleHeaderProps) {
  const t = useTranslations("wholesale");
  const { itemCount } = useCart();
  const { logout } = useAuth();

  const wholesaleBase = `${basePath}/wholesale`;

  return (
    <header className="border-b border-slate-700 bg-slate-900 text-slate-100">
      <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={wholesaleBase}
          className="flex items-center gap-2 font-semibold"
        >
          {t("portalName")}
          <Badge variant="secondary" className="uppercase tracking-wide">
            {t("badge")}
          </Badge>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href={wholesaleBase} className="hover:text-white">
            {t("nav.catalog")}
          </Link>
          {/* Quick Order is an ordering surface — hidden from guests, who are
              walled off it and have no wholesale cart. */}
          {authenticated && (
            <Link
              href={`${wholesaleBase}/quick-order`}
              className="hover:text-white"
            >
              {t("nav.quickOrder")}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {authenticated && customerName && (
            <span className="hidden text-sm text-slate-300 sm:inline">
              {customerName}
            </span>
          )}

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.backToStore")}</span>
            </Link>
          </Button>

          {authenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="relative text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <Link href={`${wholesaleBase}/cart`} aria-label={t("nav.cart")}>
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-slate-900">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link href={signInHref ?? `${wholesaleBase}`}>
                {t("nav.signIn")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
