import { cookies } from "next/headers";
import { getConfig } from "./config";

const DEFAULT_COUNTRY_COOKIE = "spree_country";
const DEFAULT_LOCALE_COOKIE = "spree_locale";

/**
 * Read locale/country from cookies (set by middleware).
 * Falls back to config defaults.
 */
export async function getLocaleOptions(): Promise<{
  locale?: string;
  country?: string;
}> {
  const config = getConfig();
  const cookieStore = await cookies();

  const country = cookieStore.get(
    config.countryCookieName ?? DEFAULT_COUNTRY_COOKIE,
  )?.value;
  const locale = cookieStore.get(
    config.localeCookieName ?? DEFAULT_LOCALE_COOKIE,
  )?.value;

  return {
    locale: locale || config.defaultLocale,
    country: country || config.defaultCountry,
  };
}
