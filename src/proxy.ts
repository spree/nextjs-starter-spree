import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Default values from environment variables (set these from your Spree store settings)
// These should match your store's default_country_iso and default_locale
const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us";
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

// Static routes that should not be redirected
const STATIC_ROUTES = ["/_next", "/api", "/favicon.ico", "/globals.css"];

// Check if the path is a static route or asset
function isStaticRoute(pathname: string): boolean {
  return STATIC_ROUTES.some((route) => pathname.startsWith(route));
}

// Check if the path already has country/locale prefix
function hasCountryLocalePrefix(pathname: string): boolean {
  // Match pattern: /xx/xx/... where xx is 2-letter code
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/|$)/i);
  return match !== null;
}

// Parse country and locale from pathname
function parseCountryLocale(
  pathname: string,
): { country: string; locale: string; rest: string } | null {
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/.*)?$/i);
  if (match) {
    return {
      country: match[1].toLowerCase(),
      locale: match[2].toLowerCase(),
      rest: match[3] || "",
    };
  }
  return null;
}

// Get preferred country from cookie or geo headers
function getPreferredCountry(request: NextRequest): string {
  // Check cookie first
  const cookieCountry = request.cookies.get("spree_country")?.value;
  if (cookieCountry) {
    return cookieCountry.toLowerCase();
  }

  // Check Vercel geo headers
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) {
    return vercelCountry.toLowerCase();
  }

  // Check Cloudflare geo header
  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry) {
    return cfCountry.toLowerCase();
  }

  return DEFAULT_COUNTRY.toLowerCase();
}

// Get preferred locale from cookie or Accept-Language header
function getPreferredLocale(request: NextRequest): string {
  // Check cookie first
  const cookieLocale = request.cookies.get("spree_locale")?.value;
  if (cookieLocale) {
    return cookieLocale.toLowerCase();
  }

  // Parse Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")[0]
      ?.split("-")[0]
      ?.toLowerCase();
    if (preferred && preferred.length === 2) {
      return preferred;
    }
  }

  return DEFAULT_LOCALE.toLowerCase();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static routes
  if (isStaticRoute(pathname)) {
    return NextResponse.next();
  }

  // If already has country/locale prefix, continue
  if (hasCountryLocalePrefix(pathname)) {
    const parsed = parseCountryLocale(pathname);
    if (parsed) {
      // Add country/locale to request headers for server components
      const response = NextResponse.next();
      response.headers.set("x-spree-country", parsed.country);
      response.headers.set("x-spree-locale", parsed.locale);
      return response;
    }
    return NextResponse.next();
  }

  // Redirect to prefixed URL
  const country = getPreferredCountry(request);
  const locale = getPreferredLocale(request);
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${country}/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
