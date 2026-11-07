import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("a pill click and Enter leave the popup open", async ({ page }) => {
  await page.goto("/");
  const pill = page.locator('button[aria-label="Vaishali"]');
  await expect(pill).toBeVisible();
  await pill.click();
  const popup = page.locator(".maplibregl-popup");
  await expect(popup).toContainText("Vaishali");
  await expect(popup).toBeVisible();
  await page.locator('button[aria-label="Kayani Bakery"]').click();
  await expect(popup).toContainText("Kayani Bakery");
  await page.locator('button[aria-label="Vaishali"]').focus();
  await page.keyboard.press("Enter");
  await expect(popup).toContainText("Vaishali");
  await expect(popup).toBeVisible();
});

test("a phone selection opens the map on that place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#kayani-bakery .card-hit").click();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "map");
  const popup = page.locator(".maplibregl-popup");
  await expect(popup).toContainText("Kayani Bakery");
  const map = await page.locator("#map").boundingBox();
  const pill = await page.locator('button[aria-label="Kayani Bakery"]').boundingBox();
  expect(map).toBeTruthy();
  expect(pill).toBeTruthy();
  if (!map || !pill) return;
  const dx = pill.x + pill.width / 2 - (map.x + map.width / 2);
  const dy = pill.y + pill.height / 2 - (map.y + map.height / 2);
  expect(Math.hypot(dx, dy)).toBeLessThan(90);
});

test("a blocked tile host shows the banner and keeps the list", async ({ page }) => {
  await page.route("**://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#tile-note")).toBeVisible();
  await expect(page.locator("#tile-note")).toContainText("did not load");
  await page.locator("#q").fill("Vaishali");
  await expect(page.locator("#vaishali")).toBeVisible();
  await expect(page.locator("#kayani-bakery")).toBeHidden();
});

test("the map is the wider column and culled names keep a dot", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const list = await page.locator(".list-pane").boundingBox();
  const map = await page.locator(".map-pane").boundingBox();
  expect(list && map).toBeTruthy();
  if (!list || !map) return;
  const share = map.width / (list.width + map.width);
  expect(share).toBeGreaterThan(0.48);
  expect(share).toBeLessThan(0.58);
  const culled = page.locator(".pill-marker.is-culled");
  await expect(culled.first()).toBeVisible();
  const dot = await culled.first().locator(".dot").boundingBox();
  expect(dot && dot.width).toBeLessThan(16);
  expect(dot && dot.height).toBeGreaterThan(4);
});
