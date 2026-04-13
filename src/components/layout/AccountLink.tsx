"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AccountLinkProps {
  basePath: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}

/**
 * Account link that routes directly to the correct page based on auth state:
 *  - authenticated → `/account` (dashboard)
 *  - unauthenticated → `/account/login` (skip the layout's redirect hop)
 *  - still loading → `/account` (safe default; layout handles the redirect)
 *
 * Used by Header / Footer / MobileMenu so anonymous users go straight to login
 * without a flash of the dashboard skeleton.
 */
export function AccountLink({
  basePath,
  className,
  "aria-label": ariaLabel,
  children,
}: AccountLinkProps) {
  const { isAuthenticated, loading } = useAuth();

  const href =
    loading || isAuthenticated
      ? `${basePath}/account`
      : `${basePath}/account/login`;

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
