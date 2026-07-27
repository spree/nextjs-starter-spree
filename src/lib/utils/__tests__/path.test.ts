import { describe, expect, it } from "vitest";
import { resolveLocalPath } from "../path";

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
