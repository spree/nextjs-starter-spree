import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const supportedLocales = ["en", "de", "pl"];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get("spree_locale")?.value;

  if (!locale || !supportedLocales.includes(locale)) {
    locale = "en";
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
