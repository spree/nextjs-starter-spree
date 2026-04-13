"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAuth } from "@/contexts/AuthContext";

type AccountLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  basePath: string;
};

/**
 * Account link that routes directly to the correct page based on auth state:
 *  - authenticated → `/account` (dashboard)
 *  - unauthenticated → `/account/login` (skip the layout's redirect hop)
 *  - still loading → `/account` (safe default; layout handles the redirect)
 *
 * Accepts all props a `next/link` `<Link>` accepts (except `href`) and forwards
 * them onto the underlying Link so it composes correctly with Radix Slot
 * consumers like `<Button asChild>` and `<SheetClose asChild>`, which inject
 * className / onClick / data-state / ref onto their child.
 */
export function AccountLink({
  basePath,
  ...props
}: AccountLinkProps): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth();

  const href =
    loading || isAuthenticated
      ? `${basePath}/account`
      : `${basePath}/account/login`;

  return <Link href={href} {...props} />;
}
