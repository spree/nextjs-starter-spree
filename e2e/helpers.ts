import { expect, type Locator, type Page } from "@playwright/test";

/** How long a single click / navigation attempt may take before retrying. */
const ATTEMPT_TIMEOUT = 5_000;
/** How long to keep retrying the click-then-navigate pair overall. */
const NAVIGATION_TIMEOUT = 30_000;

/**
 * Click `locator` until the page lands on `url`.
 *
 * A click landing mid-hydration can be swallowed with the page staying put, so
 * the click-then-navigate pair is a bounded retry rather than one unbounded
 * wait. Already being on `url` short-circuits, so a navigation that lands after
 * its attempt timed out is never double-clicked.
 */
export async function clickUntilUrl(
  page: Page,
  locator: Locator,
  url: RegExp,
): Promise<void> {
  await expect(async () => {
    // search() rather than test(): it ignores a caller's `g` flag instead of
    // advancing lastIndex, which would make repeated attempts alternate.
    if (page.url().search(url) === -1) {
      await locator.click({ timeout: ATTEMPT_TIMEOUT });
    }
    await page.waitForURL(url, { timeout: ATTEMPT_TIMEOUT });
  }).toPass({ timeout: NAVIGATION_TIMEOUT });
}

/**
 * Resolve once React has taken ownership of the rendered page.
 *
 * Server-rendered content is visible long before the client takes over, so any
 * assertion about hydration itself (invalid markup, mismatched trees) has to
 * wait for this first or it passes vacuously. React attaches a
 * `__reactFiber$<id>` property to each DOM node as it claims it — checking the
 * last link on the page means React has walked past the content above it.
 * (The container's `__reactContainer$` property is set when hydration *starts*,
 * which is too early: mismatches are reported while the tree is walked.)
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const links = document.querySelectorAll("a");
      const last = links[links.length - 1];
      return (
        !!last &&
        Object.keys(last).some((key) => key.startsWith("__reactFiber"))
      );
    },
    undefined,
    { timeout: 30_000 },
  );
}
