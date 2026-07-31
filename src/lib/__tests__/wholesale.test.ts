import { describe, expect, it } from "vitest";
import { wholesaleSignInHref } from "../wholesale";

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
