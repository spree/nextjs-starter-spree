/**
 * Centralized store configuration.
 *
 * All store-level environment variables are accessed here so the rest of the
 * codebase has a single source of truth with consistent fallback values.
 */

/**
 * Ensure a URL has a protocol prefix.
 * If the URL doesn't start with http:// or https://, prepend https://.
 */
export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Get the store URL, preferring NEXT_PUBLIC_SITE_URL and falling back to
 * NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL. Returns the URL with protocol
 * (https:// by default), or undefined if neither variable is set.
 */
export function getStoreUrl(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  return raw ? ensureProtocol(raw) : undefined;
}

/**
 * Get the store name from environment variables.
 */
export function getStoreName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";
}

/**
 * Get the store description from environment variables.
 */
export function getStoreDescription(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_DESCRIPTION ||
    "A modern e-commerce storefront powered by Spree Commerce and Next.js."
  );
}

/**
 * Get the default country ISO code (lowercase).
 */
export function getDefaultCountry(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us";
}

/**
 * Get the default locale code.
 */
export function getDefaultLocale(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
}

/**
 * Get the "from" address for transactional emails.
 */
export function getStoreEmailFrom(): string {
  return process.env.EMAIL_FROM || "orders@example.com";
}
