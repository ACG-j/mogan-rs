import { expect, test } from "@playwright/test";

test("plain symbols inside structured math are editable slots", async ({ page }) => {
  await page.goto("/");

  const blockMath = page.locator(".structured-math--block").first();
  await expect(blockMath).toBeVisible();

  const symbolSlots = blockMath.locator(".math-symbol-slot");
  await expect(symbolSlots.first()).toBeVisible();
  expect(await symbolSlots.count()).toBeGreaterThan(5);

  await symbolSlots.first().click();
  await expect(symbolSlots.first()).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(blockMath.locator(".math-edit-slot").nth(1)).toBeFocused();
  await expect(page.locator(".mogan-editor-surface")).not.toBeFocused();
});

test("fraction internals expose symbol-level editable slots", async ({ page }) => {
  await page.goto("/");

  const fraction = page.locator(".structured-math--block .math-frac").first();
  await expect(fraction).toBeVisible();

  await expect(fraction.locator(".math-frac-numerator .math-symbol-slot")).toHaveCount(2);
  await expect(fraction.locator(".math-frac-denominator .math-symbol-slot")).toHaveCount(2);

  await fraction.locator(".math-frac-denominator .math-symbol-slot").first().click();
  await page.keyboard.press("ArrowUp");
  await expect(fraction.locator(".math-frac-numerator .math-symbol-slot").last()).toBeFocused();
});
