const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the selected country and locale in client-side cookies.
 */
export function setStoreCookies(country: string, locale: string): void {
  document.cookie = `spree_country=${encodeURIComponent(country)}; path=/; max-age=${ONE_YEAR}`;
  document.cookie = `spree_locale=${encodeURIComponent(locale)}; path=/; max-age=${ONE_YEAR}`;
}
