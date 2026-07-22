import { expect, type FrameLocator, type Page, test } from "@playwright/test";

/**
 * Checkout golden-path E2E.
 *
 * Walks a guest user through products listing → PDP → cart → checkout,
 * fills the shipping address, selects a delivery rate, pays with a Stripe
 * test card, and confirms the order-placed page renders.
 *
 * Backend: e2e-backend/docker-compose.yml (Spree 5.4.3.1 with sample data).
 * Payments: real Stripe test mode (pk_test_...) — card 4242 4242 4242 4242.
 *
 * Run with: pnpm e2e:up && pnpm test:e2e
 */

const TEST_CARD = "4242424242424242";
const TEST_EMAIL = "e2e-buyer@example.com";

test("guest can complete a checkout with a Stripe test card", async ({
  page,
}) => {
  // 1. Open the products listing and pick the first available product.
  await page.goto("/us/en/products");
  const firstProduct = page.locator('a[href*="/products/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 15_000 });
  await firstProduct.click();
  await page.waitForURL(/\/products\/[^/]+/);

  // 2. Add to cart from the PDP. The cart drawer opens automatically after
  // the server action resolves and the cart cookie is set — wait for the
  // drawer's Checkout link rather than racing the navigation by going
  // straight to /cart (which would race the cookie write).
  const addToCart = page.getByRole("button", { name: /add to cart/i });
  await expect(addToCart).toBeEnabled({ timeout: 10_000 });
  await addToCart.click();

  const drawerCheckout = page
    .getByRole("dialog")
    .getByRole("link", { name: /^checkout$/i });
  await expect(drawerCheckout).toBeVisible({ timeout: 15_000 });
  // The drawer keeps re-rendering as the cart revalidates (its Express
  // Checkout widget remounts), which can detach the link mid-click
  // indefinitely — navigate to the link's target instead of clicking it.
  const checkoutHref = await drawerCheckout.getAttribute("href");
  if (!checkoutHref) {
    throw new Error("Drawer checkout link has no href");
  }
  await page.goto(checkoutHref);

  // 3. Fill contact + shipping address. The checkout is single-page with
  // auto-save: address persists on container blur (no explicit "Continue"
  // button). Email input has no <label> — its accessible name comes from
  // `placeholder`, so use getByPlaceholder.
  await page.getByPlaceholder(/email address/i).fill(TEST_EMAIL);
  await fillAddress(page);

  // Trigger the address auto-save by blurring the form. Clicking the
  // page heading takes focus out of the AddressFormFields container,
  // which fires handleContainerBlur → tryAutoSave.
  await page.getByRole("heading", { name: /shipping method/i }).click();

  // 4. Pick the first available shipping rate. Spree sample data ships
  //    with at least one rate for US destinations.
  const firstRate = page.getByRole("radio").first();
  await expect(firstRate).toBeVisible({ timeout: 30_000 });
  await firstRate.check();

  // 5. Pay with a Stripe test card. The Payment Element only renders
  //    after a session-based payment method is selected, which only
  //    appears once shipping is locked in. Several Stripe iframes share
  //    the "Secure payment input frame" title (an accessory frame mounts
  //    lazily next to the real form, before or after it), so resolve the
  //    frame that actually contains the card form rather than trusting
  //    mount order — a fill aimed at the wrong frame "succeeds" silently
  //    while the real card field stays empty.
  const stripeFrames = page.locator(
    'iframe[title="Secure payment input frame"]',
  );
  let cardFrame: FrameLocator | undefined;
  await expect(async () => {
    const frameCount = await stripeFrames.count();
    for (let i = 0; i < frameCount; i++) {
      const frame = stripeFrames.nth(i).contentFrame();
      if (await frame.getByRole("textbox", { name: "Card number" }).count()) {
        cardFrame = frame;
        return;
      }
    }
    throw new Error("Card form has not rendered in any Stripe frame yet");
  }).toPass({ timeout: 30_000 });
  if (!cardFrame) {
    throw new Error("Card form frame not resolved");
  }

  const cardNumber = cardFrame.getByRole("textbox", { name: "Card number" });
  await cardNumber.fill(TEST_CARD);
  // Stripe formats the value with spaces — assert the digits landed in
  // THIS frame before paying, since a wrong-frame fill is silent.
  await expect(cardNumber).toHaveValue(/4242/);
  // The expiry field's accessible name varies across Payment Element
  // mounts ("Expiration date" vs "Expiration (MM/YY)"); the placeholder
  // is the stable handle.
  await cardFrame.getByPlaceholder("MM / YY").fill("12 / 30");
  await cardFrame.getByRole("textbox", { name: "Security code" }).fill("123");
  // US card forms include their own required ZIP field (distinct from
  // the shipping address) — Pay Now fails validation if it stays blank.
  const zip = cardFrame.getByRole("textbox", { name: /zip code/i });
  if (await zip.count()) {
    await zip.fill("10001");
  }

  // 6. Accept policies + submit.
  await page.getByRole("checkbox", { name: /i agree/i }).check();
  await page.getByRole("button", { name: /pay now|place order/i }).click();
  await page.waitForURL(/\/order-placed\//, { timeout: 60_000 });

  // 7. Confirm the order summary rendered.
  await expect(page.getByText(/order #/i)).toBeVisible();
});

async function fillAddress(page: Page) {
  // The Country dropdown defaults alphabetically (Canada before US) — pick
  // United States explicitly so the rest of the test data (NY state, ZIP
  // 10001, US phone) is valid for the selected country.
  await page.getByLabel(/country/i).selectOption({ label: "United States" });

  await page
    .getByLabel(/first name/i)
    .first()
    .fill("Test");
  await page
    .getByLabel(/last name/i)
    .first()
    .fill("Buyer");
  await page
    .getByLabel(/^address$/i)
    .first()
    .fill("123 Test St");
  await page.getByLabel(/city/i).first().fill("New York");
  await page
    .getByLabel(/zip|postal code/i)
    .first()
    .fill("10001");
  await page.getByLabel(/phone/i).first().fill("5555550100");

  // With the country pinned to US the state field is always a <select>
  // (disabled while the states list loads). selectOption auto-waits for
  // the control to enable and for the option to be present.
  await page
    .getByLabel(/state|province/i)
    .first()
    .selectOption({ label: "New York" });
}
