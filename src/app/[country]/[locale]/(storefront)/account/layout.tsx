"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FC, SVGProps } from "react";
import { useEffect } from "react";
import {
  CreditCardIcon,
  GiftIcon,
  HomeIcon,
  MapPinIcon,
  ShoppingBagIcon,
  SignOutIcon,
  UserIcon,
} from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

const navItems: {
  href: string;
  label: string;
  icon: FC<SVGProps<SVGSVGElement>>;
}[] = [
  { href: "/account", label: "Overview", icon: HomeIcon },
  { href: "/account/orders", label: "Orders", icon: ShoppingBagIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
  {
    href: "/account/credit-cards",
    label: "Payment Methods",
    icon: CreditCardIcon,
  },
  { href: "/account/gift-cards", label: "Gift Cards", icon: GiftIcon },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
];

function ContentSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  );
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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-900">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : "My Account"}
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
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
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
              <button
                onClick={onLogout}
                disabled={isLoading}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <SignOutIcon className="w-5 h-5" />
                Sign Out
              </button>
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
  const isAuthPage = pathname.includes("/register");
  const isMainAccountPage = pathname === `${basePath}/account`;

  // Redirect to login if not authenticated and trying to access protected sub-pages
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage && !isMainAccountPage) {
      router.replace(`${basePath}/account`);
    }
  }, [
    loading,
    isAuthenticated,
    isAuthPage,
    isMainAccountPage,
    basePath,
    router,
  ]);

  // Show loading or redirect-in-progress skeleton
  if (loading || (!isAuthenticated && !isAuthPage && !isMainAccountPage)) {
    if (isAuthPage || isMainAccountPage) {
      return (
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      );
    }
    return (
      <AccountShell basePath={basePath} pathname={pathname} isLoading={true}>
        <ContentSkeleton />
      </AccountShell>
    );
  }

  // Don't show nav for login/register pages
  if (isAuthPage || !isAuthenticated) {
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
