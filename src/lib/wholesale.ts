import type { Customer } from "@spree/sdk";

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
