"use client";

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Gift,
  Home,
  LogOut,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AccountDashboardSkeleton } from "@/components/account/AccountDashboardSkeleton";
import { AddressesSkeleton } from "@/components/account/AddressesSkeleton";
import { AuthFallbackSkeleton } from "@/components/account/AuthFallbackSkeleton";
import { ContentSkeleton } from "@/components/account/ContentSkeleton";
import { CreditCardsSkeleton } from "@/components/account/CreditCardsSkeleton";
import { ForgotPasswordFormSkeleton } from "@/components/account/ForgotPasswordFormSkeleton";
import { GiftCardsSkeleton } from "@/components/account/GiftCardsSkeleton";
import { LoginFormSkeleton } from "@/components/account/LoginFormSkeleton";
import { OrdersListSkeleton } from "@/components/account/OrdersListSkeleton";
import { ProfileSkeleton } from "@/components/account/ProfileSkeleton";
import { RegisterFormSkeleton } from "@/components/account/RegisterFormSkeleton";
import { ResetPasswordFormSkeleton } from "@/components/account/ResetPasswordFormSkeleton";
import { SidebarUserInfoSkeleton } from "@/components/account/SidebarUserInfoSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

function getNavItems(t: ReturnType<typeof useTranslations<"account">>): {
  href: string;
  label: string;
  icon: LucideIcon;
}[] {
  return [
    { href: "/account", label: t("overview"), icon: Home },
    { href: "/account/orders", label: t("orders"), icon: ShoppingBag },
    { href: "/account/addresses", label: t("addresses"), icon: MapPin },
    {
      href: "/account/credit-cards",
      label: t("paymentMethods"),
      icon: CreditCard,
    },
    { href: "/account/gift-cards", label: t("giftCards"), icon: Gift },
    { href: "/account/profile", label: t("profile"), icon: User },
  ];
}

interface AccountShellProps {
  children: React.ReactNode;
  basePath: string;
  pathname: string;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  } | null;
  onLogout?: () => void;
  isLoading?: boolean;
}

function AccountShell({
  children,
  basePath,
  pathname,
  user,
  onLogout,
  isLoading,
}: AccountShellProps) {
  const t = useTranslations("account");
  const navItems = getNavItems(t);
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8  py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              {isLoading ? (
                <SidebarUserInfoSkeleton />
              ) : (
                <>
                  <p className="font-medium text-gray-900">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : t("myAccount")}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>
                </>
              )}
            </div>

            {/* Navigation */}
            <nav className="p-2">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const href = `${basePath}${item.href}`;
                  const isActive =
                    pathname === href ||
                    (item.href !== "/account" && pathname.startsWith(href));

                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-gray-50 text-primary"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-gray-200">
              <Button variant="ghost" onClick={onLogout} disabled={isLoading}>
                <LogOut className="w-5 h-5" />
                {t("signOut")}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = extractBasePath(pathname);
  const { user, logout, isAuthenticated, loading } = useAuth();

  // Pages that don't require authentication
  const authPagePaths = new Set([
    `${basePath}/account/login`,
    `${basePath}/account/register`,
    `${basePath}/account/forgot-password`,
    `${basePath}/account/reset-password`,
  ]);
  const isAuthPage = authPagePaths.has(pathname);

  // Redirect to login if not authenticated and trying to access protected pages
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.replace(`${basePath}/account/login`);
    }
  }, [loading, isAuthenticated, isAuthPage, basePath, router]);

  // Show loading or redirect-in-progress skeleton
  if (loading || (!isAuthenticated && !isAuthPage)) {
    if (pathname === `${basePath}/account/login`) {
      return <LoginFormSkeleton />;
    }
    if (pathname === `${basePath}/account/register`) {
      return <RegisterFormSkeleton />;
    }
    if (pathname === `${basePath}/account/forgot-password`) {
      return <ForgotPasswordFormSkeleton />;
    }
    if (pathname === `${basePath}/account/reset-password`) {
      return <ResetPasswordFormSkeleton />;
    }
    if (isAuthPage) {
      // generic fallback for any future auth page
      return <AuthFallbackSkeleton />;
    }
    const isDashboardPage = pathname === `${basePath}/account`;
    const isProfilePage = pathname === `${basePath}/account/profile`;
    const isOrdersPage = pathname === `${basePath}/account/orders`;
    const isGiftCardsPage = pathname === `${basePath}/account/gift-cards`;
    const isCreditCardsPage = pathname === `${basePath}/account/credit-cards`;
    const isAddressesPage = pathname === `${basePath}/account/addresses`;
    let content: React.ReactNode = <ContentSkeleton />;
    if (isDashboardPage) content = <AccountDashboardSkeleton />;
    else if (isProfilePage) content = <ProfileSkeleton />;
    else if (isOrdersPage) content = <OrdersListSkeleton />;
    else if (isGiftCardsPage) content = <GiftCardsSkeleton />;
    else if (isCreditCardsPage) content = <CreditCardsSkeleton />;
    else if (isAddressesPage) content = <AddressesSkeleton />;
    return (
      <AccountShell basePath={basePath} pathname={pathname} isLoading={true}>
        {content}
      </AccountShell>
    );
  }

  // Don't show nav for login/register/forgot/reset pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AccountShell
      basePath={basePath}
      pathname={pathname}
      user={user}
      onLogout={logout}
    >
      {children}
    </AccountShell>
  );
}
