"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

const navItems = [
  { href: "/account", label: "Overview", icon: "home" },
  { href: "/account/orders", label: "Orders", icon: "orders" },
  { href: "/account/addresses", label: "Addresses", icon: "location" },
  { href: "/account/credit-cards", label: "Payment Methods", icon: "card" },
  { href: "/account/gift-cards", label: "Gift Cards", icon: "gift" },
  { href: "/account/profile", label: "Profile", icon: "user" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "home":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case "orders":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      );
    case "location":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    case "card":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case "user":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "gift":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      );
    default:
      return null;
  }
}

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
                        <NavIcon icon={item.icon} />
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
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

  // Show loading state with full layout shell while checking auth
  if (loading) {
    // For auth pages or main account page, show simple skeleton
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
    // For protected pages, show full layout with content skeleton
    return (
      <AccountShell basePath={basePath} pathname={pathname} isLoading={true}>
        <ContentSkeleton />
      </AccountShell>
    );
  }

  // Redirect in progress for unauthenticated users on protected pages
  if (!isAuthenticated && !isAuthPage && !isMainAccountPage) {
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
