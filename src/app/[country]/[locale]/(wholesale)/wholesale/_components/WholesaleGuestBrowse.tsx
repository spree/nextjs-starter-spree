"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { HiddenPricingProvider } from "@/contexts/HiddenPricingContext";
import { WholesaleHeader } from "./WholesaleHeader";

interface WholesaleGuestBrowseProps {
  basePath: string;
  children: React.ReactNode;
}

/**
 * Guest view of a `prices_hidden` wholesale channel: the catalog renders, but
 * money fields come back null and every price becomes a "sign in for pricing"
 * prompt (via HiddenPricingProvider). Ordering is gated behind sign-in too.
 *
 * Client component so it can read the current path/query and build a sign-in
 * link that returns the buyer here after they authenticate — matching the
 * `?redirect=` contract the sign-in wall already honours.
 */
export function WholesaleGuestBrowse({
  basePath,
  children,
}: WholesaleGuestBrowseProps) {
  const wholesaleBase = `${basePath}/wholesale`;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Return the buyer to exactly where they were, query string included.
  const query = searchParams.toString();
  const returnTo = query ? `${pathname}?${query}` : pathname;
  const signInHref = `${wholesaleBase}?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <HiddenPricingProvider value={{ signInHref }}>
      <WholesaleHeader
        basePath={basePath}
        authenticated={false}
        signInHref={signInHref}
      />
      <main>{children}</main>
    </HiddenPricingProvider>
  );
}
