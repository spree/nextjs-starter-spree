/**
 * Policy slugs that users accept during registration.
 * Used to filter them out in checkout for authenticated users.
 */
export const REGISTRATION_POLICY_SLUGS = ["privacy-policy", "terms-of-service"];

/**
 * Policy slugs that require explicit consent at checkout (checkbox).
 * Only shown to guest users — authenticated users accepted these during registration.
 */
export const CHECKOUT_CONSENT_POLICY_SLUGS = ["terms-of-service"];
