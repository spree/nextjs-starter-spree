/**
 * Extract the /country/locale base path prefix from a pathname.
 * e.g. "/us/en/products" -> "/us/en"
 */
export function extractBasePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return "";
  return `/${segments[0]}/${segments[1]}`;
}

/** Any candidate that resolves off this placeholder origin is not a local path. */
export const INTERNAL_ORIGIN = "https://storefront.invalid";
/**
 * Survives URL parsing intact, but decodes to a path separator downstream.
 * Only ever tested against the path — a query value may legitimately carry an
 * encoded path of its own (a nested `?redirect=` target).
 */
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;

/**
 * Resolve a candidate into a same-origin path, or null when it points anywhere
 * else. The single guard behind every post-login return target: a leading-slash
 * check alone is not enough, because the URL parser treats a backslash as a
 * slash for http(s), so "/\evil.com" resolves to the off-site "//evil.com".
 * Repeated query keys arrive as an array — only the first is considered.
 */
export function resolveLocalPath(
  value: string | string[] | undefined | null,
): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate?.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN);
    if (
      url.origin !== INTERNAL_ORIGIN ||
      ENCODED_PATH_SEPARATOR.test(url.pathname)
    ) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Resolve a `?redirect=` value into a safe same-origin path, falling back when
 * it points anywhere else.
 */
export function safeRedirectPath(
  value: string | string[] | undefined | null,
  fallback: string,
): string {
  return resolveLocalPath(value) ?? fallback;
}

/**
 * Get the path portion after the /country/locale prefix.
 * e.g. "/us/en/products/shoes" -> "/products/shoes"
 */
export function getPathWithoutPrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 2) return "";
  return `/${segments.slice(2).join("/")}`;
}
