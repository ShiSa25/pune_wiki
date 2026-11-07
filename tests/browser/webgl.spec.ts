import { expect, test } from "@playwright/test";

test("a missing WebGL context shows the banner and keeps the list", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#tile-note")).toBeVisible();
  await expect(page.locator("#tile-note")).toContainText("did not start");
  await expect(page.locator("body")).toHaveAttribute("data-view", "list");
  await expect(page.locator("#kayani-bakery")).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(0);
});
