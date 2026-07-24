import { expect, type Page, test } from "@playwright/test";

/**
 * Wholesale portal E2E.
 *
 * The bootstrap script (scripts/e2e/bootstrap-spree.sh) enables the portal
 * (SPREE_WHOLESALE_CHANNEL=wholesale) and puts the seeded gated channel in
 * its `prices_hidden` posture — guests can browse the catalog with prices
 * nulled. That posture exercises the most portal UI: guest browse with
 * sign-in-for-pricing prompts, the dedicated /wholesale/sign-in page and
 * its `?redirect=` return contract, the sign-in wall on ordering surfaces,
 * the apply → under-review flow, and the approved buyer's portal (sample
 * data seeds wholesale@example.com in the Wholesale customer group).
 *
 * Run with: pnpm run e2e:up && pnpm run test:e2e
 */

const WHOLESALE_HOME = "/us/en/wholesale";
const BUYER_EMAIL = "wholesale@example.com";
const BUYER_PASSWORD = "spree123";

/** Fill and submit the sign-in wall (rendered by /wholesale/sign-in and by
 * gated pages). Anchored regexes keep "Show password" and the header's
 * sign-in link from matching. */
async function submitSignInWall(page: Page, email: string, password: string) {
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

test("guest browses the prices-hidden catalog without prices or hydration errors", async ({
  page,
}) => {
  // Nested-anchor regression (ProductCard used to render the hidden-price
  // prompt's link inside the card's link): invalid markup surfaces as a
  // React hydration error on the console, not as visible breakage — so
  // listen for it rather than asserting on the DOM.
  const hydrationErrors: string[] = [];
  const isHydrationError = (text: string) =>
    /hydrat|cannot be a descendant|cannot contain a nested/i.test(text);
  page.on("console", (msg) => {
    if (msg.type() === "error" && isHydrationError(msg.text())) {
      hydrationErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    if (isHydrationError(String(err))) hydrationErrors.push(String(err));
  });

  await page.goto(WHOLESALE_HOME);
  await expect(
    page.getByRole("heading", { name: /wholesale catalog/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Prices are hidden for guests: cards carry sign-in prompts, and the
  // header offers sign-in while hiding the ordering-only Quick Order nav.
  await expect(
    page.getByRole("link", { name: /sign in for pricing/i }).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("banner").getByRole("link", { name: /^sign in$/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /quick order/i })).toHaveCount(0);

  expect(hydrationErrors).toEqual([]);
});

test("sign-in prompts lead to the sign-in page without nesting redirect params", async ({
  page,
}) => {
  // Start from a URL that already carries a redirect param — the shape the
  // old redirect-loop bug produced — to prove prompts strip it instead of
  // nesting it another level deep.
  await page.goto(
    `${WHOLESALE_HOME}?redirect=${encodeURIComponent(WHOLESALE_HOME)}`,
  );

  const prompt = page
    .getByRole("link", { name: /sign in for pricing/i })
    .first();
  await expect(prompt).toBeVisible({ timeout: 30_000 });
  // The prompt sits above the card's stretched link — this click also
  // regresses the stacking: were the overlay on top, we'd land on the PDP
  // instead of the sign-in page. A click mid-hydration can be swallowed,
  // so click-then-navigate is a bounded retry.
  await expect(async () => {
    if (!/\/wholesale\/sign-in/.test(page.url())) {
      await prompt.click({ timeout: 5_000 });
    }
    await page.waitForURL(/\/wholesale\/sign-in/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  // The dedicated sign-in page shows the wall with the request-account
  // link, and the return target is the catalog itself — exactly once.
  await expect(
    page.getByRole("heading", { name: /trade pricing for approved buyers/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("link", { name: /apply for access/i }),
  ).toBeVisible();

  const url = new URL(page.url());
  expect(url.pathname).toBe(`${WHOLESALE_HOME}/sign-in`);
  expect(url.searchParams.get("redirect")).toBe(WHOLESALE_HOME);
});

test("guest hits the sign-in wall on ordering surfaces", async ({ page }) => {
  for (const path of ["/cart", "/quick-order"]) {
    await page.goto(`${WHOLESALE_HOME}${path}`);
    await expect(
      page.getByRole("heading", { name: /trade pricing for approved buyers/i }),
    ).toBeVisible({ timeout: 30_000 });
  }
});

test("buyer signs in from a product page and returns to it with ordering unlocked", async ({
  page,
}) => {
  // Catalog → PDP → sign-in → back on the PDP → add to cart is the longest
  // flow in the suite; give it headroom beyond the config's 120s budget.
  test.setTimeout(240_000);

  await page.goto(WHOLESALE_HOME);

  // Open the first product card. Card links target the wholesale PDP; the
  // sign-in prompts point at /wholesale/sign-in, so they don't match.
  const firstProduct = page.locator('a[href*="/wholesale/products/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    if (!/\/wholesale\/products\/[^/]+/.test(page.url())) {
      await firstProduct.click({ timeout: 5_000 });
    }
    await page.waitForURL(/\/wholesale\/products\/[^/]+/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  const pdpPath = new URL(page.url()).pathname;
  const productName =
    (
      await page
        .getByRole("heading", { level: 1 })
        .first()
        .textContent({ timeout: 15_000 })
    )?.trim() ?? "";
  expect(productName).not.toBe("");

  // A guest can look but not order.
  const signInToOrder = page.getByRole("link", { name: /sign in to order/i });
  await expect(signInToOrder).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    if (!/\/wholesale\/sign-in/.test(page.url())) {
      await signInToOrder.click({ timeout: 5_000 });
    }
    await page.waitForURL(/\/wholesale\/sign-in/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  // Sign in as the seeded approved buyer; the ?redirect= contract returns
  // the buyer to the exact product page they came from.
  await submitSignInWall(page, BUYER_EMAIL, BUYER_PASSWORD);
  await page.waitForURL((url) => url.pathname === pdpPath, {
    timeout: 30_000,
  });

  // The gate re-evaluated: ordering is unlocked, prompts are gone, and the
  // ordering-only nav is back.
  const addToCart = page.getByRole("button", { name: /add to cart/i });
  await expect(addToCart).toBeEnabled({ timeout: 30_000 });
  await expect(
    page.getByText(/sign in for pricing|sign in to order/i),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /quick order/i })).toBeVisible();

  // Add to cart lands in the wholesale cart drawer. The click can be lost
  // to hydration — retry until the drawer shows the line item.
  await expect(async () => {
    const drawer = page.getByRole("dialog");
    if (!(await drawer.isVisible().catch(() => false))) {
      await addToCart.click({ timeout: 5_000 });
    }
    await expect(drawer.getByText(productName).first()).toBeVisible({
      timeout: 10_000,
    });
  }).toPass({ timeout: 45_000 });

  // An authenticated buyer landing on the sign-in page is bounced straight
  // into the portal instead of seeing the wall again.
  await page.goto(`${WHOLESALE_HOME}/sign-in`);
  await page.waitForURL((url) => url.pathname === WHOLESALE_HOME, {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { name: /wholesale catalog/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
});

test("guest applies for an account and lands in the under-review state", async ({
  page,
}) => {
  await page.goto(`${WHOLESALE_HOME}/sign-in`);
  const applyLink = page.getByRole("link", { name: /apply for access/i });
  await expect(applyLink).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    if (!/\/wholesale\/apply/.test(page.url())) {
      await applyLink.click({ timeout: 5_000 });
    }
    await page.waitForURL(/\/wholesale\/apply/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  // Unique email per run — the backend keeps earlier applicants.
  const email = `e2e-wholesale-${Date.now()}@example.com`;
  await page.getByLabel(/first name/i).fill("Wendy");
  await page.getByLabel(/last name/i).fill("Applicant");
  await page.getByLabel(/company name/i).fill("E2E Trading Co.");
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill("spree123");
  await page.getByRole("button", { name: /submit application/i }).click();

  await expect(page.getByText(/application received/i)).toBeVisible({
    timeout: 30_000,
  });

  // Registration signs the applicant in, but they're not in the Wholesale
  // group yet — the portal shows the under-review state, not the catalog.
  await page.getByRole("link", { name: /go to portal/i }).click();
  await expect(page.getByText(/application is under review/i)).toBeVisible({
    timeout: 30_000,
  });
});
