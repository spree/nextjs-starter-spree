import type { Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  loadMessages,
  resolveSupportedLocale,
} from "@/i18n/locales";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // 1. Use explicit locale if provided (e.g. getMessages({ locale: 'en' }))
  // 2. Fall back to requestLocale from the [locale] route segment
  // 3. Default to "en"
  const requested = locale ?? (await requestLocale);
  const resolvedLocale: Locale =
    resolveSupportedLocale(requested) ?? DEFAULT_LOCALE;
  const messages = await loadMessages(resolvedLocale);

  return { locale: resolvedLocale, messages };
});
