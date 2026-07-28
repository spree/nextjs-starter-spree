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
 * Run with: pnpm run e2e:up && pnpm run test:e2e
 */

const TEST_CARD = "4242424242424242";
const TEST_EMAIL = "e2e-buyer@example.com";

test("guest can complete a checkout with a Stripe test card", async ({
  page,
}) => {
  // The card-fill and submit steps below are retry loops (the Payment
  // Element can remount mid-flow and wipe typed input) — they need
  // headroom beyond the config's 120s budget.
  test.setTimeout(300_000);
  // 1. Open the products listing and pick the first available product.
  //    A click landing mid-hydration can be swallowed with the page staying
  //    put — so the click-then-navigate pair is a bounded retry, not one
  //    unbounded wait.
  await page.goto("/us/en/products");
  const firstProduct = page.locator('a[href*="/products/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    if (!/\/products\/[^/]+/.test(page.url())) {
      await firstProduct.click({ timeout: 5_000 });
    }
    await page.waitForURL(/\/products\/[^/]+/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  // 2. Add to cart from the PDP. The cart drawer opens automatically after
  // the server action resolves and the cart cookie is set — wait for the
  // drawer's Checkout link rather than racing the navigation by going
  // straight to /cart (which would race the cookie write).
  const addToCart = page.getByRole("button", { name: /add to cart/i });
  await expect(addToCart).toBeEnabled({ timeout: 10_000 });
  await addToCart.click();

  // The drawer normally auto-opens once the server action resolves, but both
  // the add itself and the auto-open can be lost to hydration. Check the
  // drawer first: while it's open, the rest of the page is aria-hidden, so
  // the header cart button is only consultable when the drawer is closed —
  // its badge then tells a swallowed add (re-add) apart from a lost
  // auto-open (open the drawer manually). The drawer also keeps
  // re-rendering as the cart revalidates (its Express Checkout widget
  // remounts), which can detach the link mid-click indefinitely — so read
  // the link's target inside the retry and navigate to it instead of
  // clicking it.
  const cartButton = page.getByRole("button", { name: /open cart/i });
  const drawerCheckout = page
    .getByRole("dialog")
    .getByRole("link", { name: /^checkout$/i });
  let checkoutHref: string | null = null;
  await expect(async () => {
    if (!(await drawerCheckout.count())) {
      const badge = (await cartButton.textContent({ timeout: 3_000 })) ?? "";
      if (/\d/.test(badge)) {
        await cartButton.click({ timeout: 3_000 });
      } else {
        await addToCart.click({ timeout: 3_000 });
      }
    }
    await expect(drawerCheckout).toBeVisible({ timeout: 5_000 });
    checkoutHref = await drawerCheckout.getAttribute("href", {
      timeout: 3_000,
    });
    if (!checkoutHref) {
      throw new Error("Drawer checkout link has no href");
    }
  }).toPass({ timeout: 45_000 });
  if (!checkoutHref) {
    throw new Error("Drawer checkout link has no href");
  }
  await page.goto(checkoutHref);

  // 3. Fill contact + shipping address. The checkout is single-page with
  // auto-save: address persists on container blur (no explicit "Continue"
  // button). Email input has no <label> — its accessible name comes from
  // `placeholder`, so use getByPlaceholder.
  // The streamed checkout page transiently holds two copies of the contact
  // form while hydrating — wait for the duplicate to collapse before
  // filling anything.
  const email = page.getByPlaceholder(/email address/i);
  await expect(email).toHaveCount(1, { timeout: 20_000 });
  await email.fill(TEST_EMAIL);
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
  //    appears once shipping is locked in. Two hazards make this step a
  //    retry loop rather than a linear fill:
  //    - Several Stripe iframes share the "Secure payment input frame"
  //      title (an accessory frame mounts lazily next to the real form),
  //      so the card form's frame must be re-resolved every attempt — a
  //      fill aimed at the wrong frame "succeeds" silently while the real
  //      card field stays empty.
  //    - PaymentSection recreates the payment session whenever the cart
  //      total changes (e.g. the shipping-rate save landing after the
  //      Payment Element mounted), which remounts the Element and wipes
  //      anything already typed.
  //    Only values that still sit in the form after a settle pause are
  //    really in the form Pay Now will submit — anything else means a
  //    remount raced the fill, and the attempt runs again.
  const stripeFrames = page.locator(
    'iframe[title="Secure payment input frame"]',
  );

  const resolveCardFrame = async (): Promise<FrameLocator> => {
    const frameCount = await stripeFrames.count();
    for (let i = 0; i < frameCount; i++) {
      const frame = stripeFrames.nth(i).contentFrame();
      if (await frame.getByRole("textbox", { name: "Card number" }).count()) {
        return frame;
      }
    }
    throw new Error("Card form has not rendered in any Stripe frame yet");
  };

  const fillCardForm = async (): Promise<void> => {
    const cardFrame = await resolveCardFrame();
    // fill() replaces the existing value, so re-running an attempt on an
    // already-correct form is safe. Bounded action timeouts keep a
    // mid-attempt remount from stalling the whole loop.
    const cardNumber = cardFrame.getByRole("textbox", { name: "Card number" });
    await cardNumber.fill(TEST_CARD, { timeout: 10_000 });
    // The expiry field's accessible name varies across Payment Element
    // mounts ("Expiration date" vs "Expiration (MM/YY)"); the placeholder
    // is the stable handle.
    const expiry = cardFrame.getByPlaceholder("MM / YY");
    await expiry.fill("12 / 30", { timeout: 10_000 });
    const cvc = cardFrame.getByRole("textbox", { name: "Security code" });
    await cvc.fill("123", { timeout: 10_000 });
    // US card forms include their own required ZIP field (distinct from
    // the shipping address) — Pay Now fails validation if it stays blank.
    const zip = cardFrame.getByRole("textbox", { name: /zip code/i });
    if (await zip.count()) {
      await zip.fill("10001", { timeout: 10_000 });
    }
    // A remount wipes the fields a beat after the fill "succeeds" — only
    // accept values that survive the pause. (Stripe formats the number
    // with spaces, hence the patterns.)
    await page.waitForTimeout(1_500);
    await expect(cardNumber).toHaveValue(/4242/, { timeout: 2_000 });
    await expect(expiry).toHaveValue(/12/, { timeout: 2_000 });
    await expect(cvc).toHaveValue("123", { timeout: 2_000 });
  };

  await expect(fillCardForm).toPass({ timeout: 60_000 });

  // 6. Accept policies + submit. A remount can still land between the
  //    fill loop and the click, leaving Pay Now to fail inline validation
  //    against an emptied form — so re-verify the fill and click again on
  //    a timed-out attempt instead of waiting a full minute on a submit
  //    that can no longer succeed.
  await page.getByRole("checkbox", { name: /i agree/i }).check();

  await expect(async () => {
    // A prior attempt's submit may have landed while its waitForURL had
    // already timed out — never re-pay a completed order.
    if (/\/order-placed\//.test(page.url())) return;
    await fillCardForm();
    await page
      .getByRole("button", { name: /pay now|place order/i })
      .click({ timeout: 10_000 });
    await page.waitForURL(/\/order-placed\//, { timeout: 30_000 });
  }).toPass({ timeout: 150_000, intervals: [1_000] });

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
