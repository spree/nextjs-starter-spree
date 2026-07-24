"use client";

import { createContext, useContext } from "react";

/**
 * Signals to shared price-rendering components (ProductCard, ProductDetails)
 * that money fields may be `null` because the current viewer isn't entitled to
 * see them — a guest on a `prices_hidden` channel. When active, a null price is
 * a *deliberate* hide, so those components render a sign-in prompt instead of
 * silently omitting the price.
 *
 * Only the wholesale route group provides this. The DTC storefront never does,
 * so its null-price behaviour (render nothing) is unchanged.
 */
export interface HiddenPricingValue {
  /** Where the sign-in prompt links to (already includes the return `?redirect=`). */
  signInHref: string;
}

const HiddenPricingContext = createContext<HiddenPricingValue | null>(null);

export function HiddenPricingProvider({
  value,
  children,
}: {
  value: HiddenPricingValue;
  children: React.ReactNode;
}) {
  return (
    <HiddenPricingContext.Provider value={value}>
      {children}
    </HiddenPricingContext.Provider>
  );
}

/**
 * Returns the hidden-pricing context, or `null` outside a provider (i.e. the
 * DTC storefront). A null return means "prices aren't gated here" — components
 * should keep their existing behaviour.
 */
export function useHiddenPricing(): HiddenPricingValue | null {
  return useContext(HiddenPricingContext);
}
