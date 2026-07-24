"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useHiddenPricing } from "@/contexts/HiddenPricingContext";

/**
 * Rendered in place of a price when the viewer isn't entitled to see it (a guest
 * on a `prices_hidden` channel). Links to the wholesale sign-in, returning the
 * buyer to the page they were on. Renders nothing outside a HiddenPricingProvider
 * — so on the DTC storefront a genuinely absent price stays silent.
 */
export function HiddenPricePrompt({ className }: { className?: string }) {
  const hiddenPricing = useHiddenPricing();
  const t = useTranslations("wholesale");

  if (!hiddenPricing) return null;

  return (
    <Link
      href={hiddenPricing.signInHref}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <Lock className="h-3.5 w-3.5" />
      {t("hiddenPrice.signInForPricing")}
    </Link>
  );
}
