const INTERNAL_ORIGIN = "https://storefront.invalid";
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;

function isAllowedLocalizedDestination(
  pathname: string,
  basePath: string,
): boolean {
  const accountPath = `${basePath}/account`;
  const checkoutPath = `${basePath}/checkout`;

  return (
    pathname === accountPath ||
    pathname.startsWith(`${accountPath}/`) ||
    pathname === checkoutPath ||
    pathname.startsWith(`${checkoutPath}/`)
  );
}

/**
 * Resolve a login return target without allowing cross-origin or cross-market
 * navigation. Account and checkout are the only flows that send users through
 * the account sign-in page today.
 */
export function resolveAccountRedirect(
  redirect: string | null | undefined,
  basePath: string,
): string | null {
  if (
    !redirect?.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\") ||
    ENCODED_PATH_SEPARATOR.test(redirect)
  ) {
    return null;
  }

  try {
    const target = new URL(redirect, INTERNAL_ORIGIN);
    if (
      target.origin !== INTERNAL_ORIGIN ||
      !isAllowedLocalizedDestination(target.pathname, basePath)
    ) {
      return null;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function buildAccountLoginHref(
  basePath: string,
  returnTo?: string | null,
): string {
  const accountPath = `${basePath}/account`;
  const safeReturnTo = resolveAccountRedirect(returnTo, basePath);

  if (!safeReturnTo || safeReturnTo === accountPath) return accountPath;

  return `${accountPath}?redirect=${encodeURIComponent(safeReturnTo)}`;
}
