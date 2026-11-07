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
  await expect(popup.getByRole("link", { name: "Google Maps" })).toBeVisible();
  await page.locator('button[aria-label="Blue Nile"]').click();
  await expect(popup).toContainText("mutton biryani");
  await expect(popup).not.toContainText("city search");
  await expect(popup.getByRole("link", { name: "Search Google Maps" })).toBeVisible();
  await expect(popup.getByRole("link", { name: "OpenStreetMap" })).toBeVisible();
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

test("every card links outward, and search, reset, back, and a narrow screen hold", async ({ page }) => {
  await page.goto("/?q=Kayani");
  await expect(page.locator("article.card:visible")).toHaveCount(1);
  await expect(page.locator("#kayani-bakery .card-actions a")).toHaveText("Google Maps");
  await page.goto("/?section=coffee");
  await expect(page.locator("[data-section='coffee']")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/?section=nope");
  await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/");
  await expect(page.locator("article.card .card-actions a")).toHaveCount(50);
  const hrefs = await page.locator("article.card .card-actions a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(hrefs.every((href) => href.startsWith("https://"))).toBe(true);
  await expect(page.locator("#blue-nile .card-actions a")).toHaveText("Search Google Maps");
  await page.locator("#blue-nile summary").click();
  await expect(page.locator("#blue-nile .notes a", { hasText: "OpenStreetMap" })).toHaveAttribute("href", /openstreetmap\.org/);
  await page.locator("#q").fill("zzz-no-such-place");
  await expect(page.locator("#empty")).toBeVisible();
  await page.locator("#reset").click();
  await expect(page.locator("#empty")).toBeHidden();
  await expect(page.locator("#q")).toHaveValue("");
  await page.locator("[data-section='coffee']").click();
  await expect(page).toHaveURL(/section=coffee/);
  await page.goBack();
  await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
  page.on("dialog", () => {
    throw new Error("search must not open a dialog");
  });
  await page.locator("#q").fill("<img src=x onerror=alert(1)>");
  await expect(page.locator("#empty")).toBeVisible();
  await page.setViewportSize({ width: 320, height: 700 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
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
