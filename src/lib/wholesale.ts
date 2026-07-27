import type { Customer } from "@spree/sdk";
import { INTERNAL_ORIGIN, resolveLocalPath } from "@/lib/utils/path";

/**
 * Name of the customer group whose members are approved wholesale buyers.
 * Approval is exactly membership in this group — the admin adds an applicant to
 * it to approve them.
 */
export const WHOLESALE_GROUP_NAME = "Wholesale";

/**
 * Minimum quantity of a single item required to unlock wholesale (trade) pricing.
 * Mirrors the VolumeRule min_quantity on the seeded "Wholesale" price list
 * (spree/core/db/sample_data/wholesale.rb). This is a demo constant — the
 * production version would read the applicable volume rule's min_quantity from
 * the API per variant. Keep in sync with the seed if the seed changes.
 */
export const WHOLESALE_MIN_QUANTITY = 10;

/** Whether a customer is an approved wholesale buyer. */
export function isWholesaleApproved(customer: Customer | null): boolean {
  return Boolean(
    customer?.customer_groups?.some((g) => g.name === WHOLESALE_GROUP_NAME),
  );
}

/**
 * The portal's sign-in destination, optionally carrying `returnTo` as the
 * `?redirect=` target. On a `prices_hidden` channel the catalog root renders for
 * guests, so sign-in affordances need this dedicated page — pointing them at the
 * catalog would land the buyer back where they started. A `redirect` already on
 * `returnTo` is dropped: it is a stale return target from an earlier round trip,
 * and keeping it would nest redirects inside redirects.
 */
export function wholesaleSignInHref(
  basePath: string,
  returnTo?: string | null,
): string {
  const signInPath = `${basePath}/wholesale/sign-in`;
  const target = resolveLocalPath(returnTo);
  if (!target) return signInPath;

  const url = new URL(target, INTERNAL_ORIGIN);
  url.searchParams.delete("redirect");
  const returnPath = `${url.pathname}${url.search}${url.hash}`;
  if (returnPath === signInPath) return signInPath;

  return `${signInPath}?redirect=${encodeURIComponent(returnPath)}`;
}
