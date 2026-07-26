import { describe, expect, it } from "vitest";
import {
  buildAccountLoginHref,
  resolveAccountRedirect,
} from "../account-redirect";

describe("resolveAccountRedirect", () => {
  const basePath = "/us/en";

  it.each([
    [
      "/us/en/account/orders?state=complete#latest",
      "/us/en/account/orders?state=complete#latest",
    ],
    ["/us/en/checkout/cart_123", "/us/en/checkout/cart_123"],
  ])("allows a localized account or checkout path", (redirect, expected) => {
    expect(resolveAccountRedirect(redirect, basePath)).toBe(expected);
  });

  it.each([
    "https://example.com/us/en/account/orders",
    "//example.com/us/en/account/orders",
    "/\\example.com/us/en/account/orders",
    "/us/en/account%2forders",
    "/fr/fr/account/orders",
    "/us/en/products",
  ])("rejects an unsafe return target: %s", (redirect) => {
    expect(resolveAccountRedirect(redirect, basePath)).toBeNull();
  });
});

describe("buildAccountLoginHref", () => {
  it("adds a validated return target", () => {
    expect(
      buildAccountLoginHref("/us/en", "/us/en/account/orders?state=complete"),
    ).toBe(
      "/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
  });

  it("falls back to the account page for an invalid target", () => {
    expect(buildAccountLoginHref("/us/en", "https://example.com")).toBe(
      "/us/en/account",
    );
  });
});
