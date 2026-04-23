import { test, expect } from "@playwright/test";

test.describe("e2e", () => {
  test("homepage is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
