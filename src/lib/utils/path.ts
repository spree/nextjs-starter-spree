/**
 * Extract the /country/locale base path prefix from a pathname.
 * e.g. "/us/en/products" -> "/us/en"
 */
export function extractBasePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return "";
  return `/${segments[0]}/${segments[1]}`;
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
