import { cookies } from "next/headers";
import type { Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

const supportedLocales: Locale[] = ["en", "de", "pl"];

export default getRequestConfig(async ({ requestLocale }) => {
  // Prefer the route-derived locale (from the [locale] path segment),
  // fall back to the spree_locale cookie, then default to "en".
  let locale = (await requestLocale) as Locale | undefined;

  if (locale && !supportedLocales.includes(locale)) {
    // Invalid locale from route — default to "en" directly
    locale = "en";
  } else if (!locale) {
    // No locale from route — try cookie, then default to "en"
    const cookieStore = await cookies();
    locale = cookieStore.get("spree_locale")?.value as Locale | undefined;
    if (!locale || !supportedLocales.includes(locale)) {
      locale = "en";
    }
  }

  let messages: IntlMessages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to English if locale file doesn't exist
    locale = "en";
    messages = (await import("../../messages/en.json")).default;
  }

  return { locale, messages };
});
