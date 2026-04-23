import { test, expect } from "@playwright/test";

test.describe("integration", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });
});
