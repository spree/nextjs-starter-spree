import { describe, expect, it } from "vitest";
import { resolveLocalPath, safeRedirectPath } from "../path";

describe("resolveLocalPath", () => {
  it.each([
    ["/us/en/wholesale", "/us/en/wholesale"],
    [
      "/us/en/wholesale/products/mug?category_id=3#specs",
      "/us/en/wholesale/products/mug?category_id=3#specs",
    ],
    [["/us/en/wholesale", "/us/en/account"], "/us/en/wholesale"],
    // An encoded path is ordinary data inside a query value.
    [
      "/us/en/wholesale?redirect=%2Fus%2Fen%2Fwholesale",
      "/us/en/wholesale?redirect=%2Fus%2Fen%2Fwholesale",
    ],
  ])("resolves a same-origin path: %s", (value, expected) => {
    expect(resolveLocalPath(value)).toBe(expected);
  });

  it.each([
    "https://example.com/us/en/wholesale",
    "//example.com/us/en/wholesale",
    "/\\example.com/us/en/wholesale",
    "/us/en/wholesale%2f%2fexample.com",
    "us/en/wholesale",
    "//[",
    "",
  ])("rejects a value that is not a local path: %s", (value) => {
    expect(resolveLocalPath(value)).toBeNull();
  });

  it.each([null, undefined, []])("rejects %s", (value) => {
    expect(resolveLocalPath(value)).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  const fallback = "/us/en/wholesale";

  it("returns the resolved path when it is local", () => {
    expect(safeRedirectPath("/us/en/wholesale/cart", fallback)).toBe(
      "/us/en/wholesale/cart",
    );
  });

  it("returns the fallback when the value points elsewhere", () => {
    expect(safeRedirectPath("https://example.com", fallback)).toBe(fallback);
  });
});
