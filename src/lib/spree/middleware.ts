import { type NextRequest, NextResponse } from "next/server";

const COUNTRY_COOKIE = "spree_country";
const LOCALE_COOKIE = "spree_locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const HAS_COUNTRY_LOCALE = /^\/([a-z]{2})\/([a-z]{2})(\/|$)/i;

export interface SpreeMiddlewareConfig {
  /** Default country ISO code (default: 'us') */
  defaultCountry?: string;
  /** Default locale code (default: 'en') */
  defaultLocale?: string;
  /** Routes to skip — prefixes matched with startsWith (default: ['/_next', '/api', '/favicon.ico']) */
  staticRoutes?: string[];
}

/**
 * Set spree_country / spree_locale cookies on a response so that
 * `getLocaleOptions()` reads values matching the URL during SSR.
 */
function setLocaleCookies(
  response: NextResponse,
  country: string,
  locale: string,
): void {
  response.cookies.set(COUNTRY_COOKIE, country, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Creates a Next.js middleware that handles:
 * - Redirecting bare paths to /{country}/{locale}/...
 * - Detecting country from cookies → geo headers → default
 * - Detecting locale from cookies → accept-language → default
 * - Syncing spree_country / spree_locale cookies with URL segments so
 *   server-side data fetching (via `getLocaleOptions()`) uses the correct market
 */
export function createSpreeMiddleware(
  config: SpreeMiddlewareConfig = {},
): (request: NextRequest) => NextResponse {
  const defaultCountry = config.defaultCountry ?? "us";
  const defaultLocale = config.defaultLocale ?? "en";
  const staticRoutes = config.staticRoutes ?? [
    "/_next",
    "/api",
    "/favicon.ico",
  ];

  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static routes
    if (staticRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Skip if pathname contains a file extension (static assets)
    if (/\.\w+$/.test(pathname)) {
      return NextResponse.next();
    }

    // Already has /{country}/{locale} prefix — sync cookies with URL segments
    const match = pathname.match(HAS_COUNTRY_LOCALE);
    if (match) {
      const response = NextResponse.next();
      setLocaleCookies(
        response,
        match[1].toLowerCase(),
        match[2].toLowerCase(),
      );
      return response;
    }

    // Detect country: cookie → geo headers → default
    const country =
      request.cookies.get(COUNTRY_COOKIE)?.value ??
      request.headers.get("x-vercel-ip-country")?.toLowerCase() ??
      request.headers.get("cf-ipcountry")?.toLowerCase() ??
      defaultCountry;

    // Detect locale: cookie → accept-language → default
    const locale =
      request.cookies.get(LOCALE_COOKIE)?.value ??
      request.headers
        .get("accept-language")
        ?.split(",")[0]
        ?.split("-")[0]
        ?.toLowerCase() ??
      defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${country}/${locale}${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.redirect(url);
    setLocaleCookies(response, country, locale);
    return response;
  };
}
