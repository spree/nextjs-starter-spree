import type { Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

const supportedLocales: Locale[] = ["en", "de", "pl"];

function isValidLocale(value: string | undefined): value is Locale {
  return !!value && supportedLocales.includes(value as Locale);
}

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // 1. Use explicit locale if provided (e.g. getMessages({ locale: 'en' }))
  // 2. Fall back to requestLocale from the [locale] route segment
  // 3. Default to "en"
  let resolvedLocale: Locale;

  if (isValidLocale(locale)) {
    resolvedLocale = locale;
  } else {
    const requested = await requestLocale;
    resolvedLocale = isValidLocale(requested) ? requested : "en";
  }

  let messages: IntlMessages;
  try {
    messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
  } catch {
    messages = (await import("../../messages/en.json")).default;
  }

  return { locale: resolvedLocale, messages };
});
