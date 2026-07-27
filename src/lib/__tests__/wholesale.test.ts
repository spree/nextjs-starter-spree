import { describe, expect, it } from "vitest";
import { wholesaleRedirectPath, wholesaleSignInHref } from "../wholesale";

describe("wholesaleRedirectPath", () => {
  const basePath = "/us/en";
  const portalRoot = "/us/en/wholesale";

  it.each([
    "/us/en/wholesale",
    "/us/en/wholesale/products/mug?ref=grid",
    "/us/en/wholesale/quick-order",
  ])("keeps a target inside the portal: %s", (value) => {
    expect(wholesaleRedirectPath(value, basePath)).toBe(value);
  });

  it.each([
    "/us/en/account/orders",
    "/us/en/checkout/cart_123",
    "/us/en/wholesale-partners",
    "https://example.com/us/en/wholesale",
    "/fr/fr/wholesale",
    // Bouncing back to sign-in would loop.
    "/us/en/wholesale/sign-in",
    null,
  ])("falls back to the portal root for: %s", (value) => {
    expect(wholesaleRedirectPath(value, basePath)).toBe(portalRoot);
  });
});

describe("wholesaleSignInHref", () => {
  const basePath = "/us/en";

  it("points at the dedicated sign-in page", () => {
    expect(wholesaleSignInHref(basePath)).toBe("/us/en/wholesale/sign-in");
  });

  it("carries a return target", () => {
    expect(
      wholesaleSignInHref(basePath, "/us/en/wholesale/products/mug?ref=grid"),
    ).toBe(
      "/us/en/wholesale/sign-in?redirect=%2Fus%2Fen%2Fwholesale%2Fproducts%2Fmug%3Fref%3Dgrid",
    );
  });

  it("drops a stale redirect instead of nesting it", () => {
    expect(
      wholesaleSignInHref(
        basePath,
        "/us/en/wholesale?redirect=%2Fus%2Fen%2Fwholesale",
      ),
    ).toBe("/us/en/wholesale/sign-in?redirect=%2Fus%2Fen%2Fwholesale");
  });

  it.each([
    "https://example.com/us/en/wholesale",
    "//example.com",
    "/us/en/wholesale/sign-in",
    null,
  ])("omits an unusable return target: %s", (returnTo) => {
    expect(wholesaleSignInHref(basePath, returnTo)).toBe(
      "/us/en/wholesale/sign-in",
    );
  });
});
