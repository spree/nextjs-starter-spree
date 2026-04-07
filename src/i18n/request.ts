import type { Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

const supportedLocales: Locale[] = ["en", "de", "pl"];

function isValidLocale(value: string | undefined): value is Locale {
  return !!value && supportedLocales.includes(value as Locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Prefer the route-derived locale (from the [locale] path segment).
  // Default to "en" if the route segment is invalid or missing.
  const requested = (await requestLocale) as string | undefined;
  const locale: Locale = isValidLocale(requested) ? requested : "en";

  let messages: IntlMessages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to English if locale file doesn't exist
    messages = (await import("../../messages/en.json")).default;
  }

  return { locale, messages };
});
