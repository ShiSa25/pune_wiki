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
  await expect(popup.getByRole("link", { name: "Search Google Maps" })).toHaveCount(0);
  await expect(popup.getByRole("link", { name: "Google Maps" })).toHaveAttribute("href", /1s0x3bc2c05074135b17/);
  await expect(popup.getByRole("link", { name: "OpenStreetMap" })).toBeVisible();
});

test("a phone selection opens the map on that place", async ({ page }) => {
  // The popup text is ready before easeTo paints. At the opening zoom Kayani’s
  // pill centre is about 101px from the map centre, the same miss CI recorded.
  // The marker anchor is the pill centre, so once the camera settles that
  // distance is about a pixel. A recenter that never runs stays near 101px.
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator("#kayani-bakery .card-hit").click();
    await page.getByRole("button", { name: "Show map" }).click();
    await expect(page.locator("body")).toHaveAttribute("data-view", "map");
    await expect(page.locator(".maplibregl-popup")).toContainText("Kayani Bakery");
    await expect
      .poll(
        async () => {
          const map = await page.locator("#map").boundingBox();
          const pill = await page.locator('button[aria-label="Kayani Bakery"]').boundingBox();
          if (!map || !pill) return 999;
          const dx = pill.x + pill.width / 2 - (map.x + map.width / 2);
          const dy = pill.y + pill.height / 2 - (map.y + map.height / 2);
          return Math.hypot(dx, dy);
        },
        { timeout: 8_000 },
      )
      .toBeLessThan(12);
  }
});

test("a blocked tile host shows the banner and keeps the list", async ({ page }) => {
  await page.route("**://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#tile-note")).toBeVisible();
  await expect(page.locator("#tile-note")).toContainText("did not load");
  await page.locator("[data-section='misal']").click();
  await expect(page.locator("#vaishali")).toBeVisible();
  await expect(page.locator("#kayani-bakery")).toBeHidden();
});

test("every card links outward, and back and a narrow screen hold", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#q")).toHaveCount(0);
  await expect(page.locator("#kayani-bakery .card-actions a")).toHaveText("Google Maps");
  await page.goto("/?section=coffee");
  await expect(page.locator("[data-section='coffee']")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/?section=nope");
  await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/");
  await expect(page.locator("#blue-nile .card-actions a")).toHaveAttribute("href", /1s0x3bc2c05074135b17:0xa422fee8ff1347dd/);
  for (const id of ["asha-dining-hall", "durvankur-dining-hall", "vaidya-upahar-gruha", "bangalore-canteen", "pmc-heritage-walk"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  }
  const mapsLinks = page.locator("article.card .card-actions a");
  await expect(mapsLinks).toHaveCount(await page.locator("article.card").count());
  await expect(mapsLinks).toHaveText(Array(await mapsLinks.count()).fill("Google Maps"));
  const hrefs = await mapsLinks.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(hrefs.every((href) => href.startsWith("https://www.google.com/maps/place/"))).toBe(true);
  expect(hrefs.some((href) => href.includes("/maps/search/"))).toBe(false);
  await expect(page.locator("details.notes")).toHaveCount(0);
  await expect(page.locator("#blue-nile .card-actions .ext")).toHaveCount(1);
  await page.locator("#blue-nile .card-hit").click();
  await expect(page.locator(".maplibregl-popup a.outward")).toHaveAttribute("href", /1s0x3bc2c05074135b17/);
  await expect(page.locator(".maplibregl-popup").getByRole("link", { name: "OpenStreetMap" })).toHaveAttribute(
    "href",
    /openstreetmap\.org/,
  );
  await page.locator("[data-section='coffee']").click();
  await expect(page).toHaveURL(/section=coffee/);
  await page.goBack();
  await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 320, height: 700 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("map markers stay in step with the filtered cards", async ({ page }) => {
  async function listedCount() {
    const text = await page.locator("[data-section='']").innerText();
    const match = text.match(/\((\d+)\)/);
    return Number(match?.[1] ?? "0");
  }

  async function matchingIds() {
    const { cards, markers } = await page.evaluate(() => {
      const painted = (element: Element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      const cards = [...document.querySelectorAll("article.card")]
        .filter((element) => !(element as HTMLElement).hidden)
        .map((element) => element.id)
        .sort();
      const markers = [...document.querySelectorAll(".pill-marker")]
        .filter(painted)
        .map((element) => element.getAttribute("data-place") ?? "")
        .sort();
      return { cards, markers };
    });
    expect(markers).toEqual(cards);
    return cards;
  }

  await page.goto("/");
  const total = await listedCount();
  await expect(page.locator(".pill-marker")).toHaveCount(total);
  const sections = await page.locator(".pill[data-section]").evaluateAll((els) =>
    els.map((element) => element.getAttribute("data-section") ?? ""),
  );
  for (const section of sections.filter((section) => section !== "")) {
    await page.locator(`[data-section="${section}"]`).click();
    await matchingIds();
  }
  await page.locator("[data-section='']").click();
  await matchingIds();
  await page.locator("#kayani-bakery .card-hit").click();
  await expect(page.locator(".maplibregl-popup")).toContainText("Kayani");
  await page.locator('[data-section="coffee"]').click();
  await expect(page.locator(".maplibregl-popup")).toHaveCount(0);
  await matchingIds();
  await page.locator('[data-section="getaways"]').click();
  const getaways = await matchingIds();
  expect(getaways.length).toBeGreaterThan(0);
  expect(getaways.length).toBeLessThan(total);
  await page.locator("[data-section='']").click();
  expect(await matchingIds()).toHaveLength(await listedCount());
  await page.locator('[data-section="sweet"]').click();
  await page.locator('[data-section="pints"]').click();
  await page.goBack();
  await expect(page.locator('[data-section="sweet"]')).toHaveAttribute("aria-pressed", "true");
  await matchingIds();
  await page.goForward();
  await expect(page.locator('[data-section="pints"]')).toHaveAttribute("aria-pressed", "true");
  await matchingIds();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-section="dates"]').click();
  await page.getByRole("button", { name: "Show map" }).click();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await matchingIds();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test("category chips stay on one scrolling row and the last one can be selected", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const pills = page.locator(".pill[data-section]");
    await expect(pills).toHaveCount(11);
    const box = await page.locator(".pills").evaluate((node) => {
      const row = node.getBoundingClientRect();
      const chips = [...node.querySelectorAll(".pill")].map((chip) => {
        const rect = chip.getBoundingClientRect();
        const minHeight = Number.parseFloat(getComputedStyle(chip).minHeight);
        return { top: rect.top, height: rect.height, minHeight, text: chip.textContent ?? "" };
      });
      return { rowHeight: row.height, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, chips };
    });
    expect(box.chips.length).toBe(11);
    expect(box.rowHeight).toBeLessThan(box.chips[0].height + 8);
    const top = box.chips[0].top;
    expect(box.chips.every((chip) => Math.abs(chip.top - top) < 2)).toBe(true);
    for (const chip of box.chips) {
      expect(chip.minHeight).toBeGreaterThanOrEqual(2.75 * 14.5 - 0.5);
      expect(chip.height).toBeGreaterThanOrEqual(chip.minHeight - 0.5);
    }
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    const before = await page.evaluate(() => window.scrollY);
    await page.locator(".pills").hover();
    await page.mouse.wheel(280, 0);
    await expect.poll(() => page.locator(".pills").evaluate((node) => node.scrollLeft)).toBeGreaterThan(8);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await page.locator('[data-section="getaways"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-section="getaways"]')).toHaveAttribute("aria-pressed", "true");
    const visible = await page.locator('[data-section="getaways"]').evaluate((chip) => {
      const row = chip.parentElement?.getBoundingClientRect();
      const rect = chip.getBoundingClientRect();
      return Boolean(row && rect.left >= row.left - 2 && rect.right <= row.right + 2);
    });
    expect(visible).toBe(true);
    await expect(page.locator("#sinhagad-fort")).toBeVisible();
    await expect(page.locator("#kayani-bakery")).toBeHidden();
    await page.locator("[data-section='']").click();
    await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#kayani-bakery")).toBeVisible();
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.locator('[data-section="getaways"]').focus();
  await page.keyboard.press("Enter");
  await page.goBack();
  await expect(page.locator("[data-section='']")).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page.locator('[data-section="getaways"]')).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.locator('[data-section="getaways"]').evaluate((chip) => {
      const row = chip.parentElement?.getBoundingClientRect();
      const rect = chip.getBoundingClientRect();
      return Boolean(row && rect.left >= row.left - 2 && rect.right <= row.right + 2);
    }),
  ).toBe(true);
  await page.locator('[data-section="nightlife"]').click();
  await page.getByRole("button", { name: "Show map" }).click();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const mapHeight = await page.locator("#map").evaluate((node) => node.getBoundingClientRect().height);
  expect(mapHeight).toBeGreaterThan(120);
});

test("the map credit text stays inside the visible map", async ({ page }) => {
  async function creditBox() {
    return page.evaluate(() => {
      const map = document.querySelector("#map")?.getBoundingClientRect();
      const inner = document.querySelector(".maplibregl-ctrl-attrib-inner");
      if (!map || !inner) return { ok: false, reason: "missing", text: "", lines: 0, textBottom: 0, visibleBottom: 0, mapBottom: 0, mapHeight: 0 };
      const text = (inner.textContent ?? "").replace(/\s+/g, " ").trim();
      const range = document.createRange();
      range.selectNodeContents(inner);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      const visible = {
        top: Math.max(map.top, 0),
        left: Math.max(map.left, 0),
        right: Math.min(map.right, window.innerWidth),
        bottom: Math.min(map.bottom, window.innerHeight),
      };
      const outside = rects.filter(
        (rect) =>
          rect.top < visible.top - 0.5 ||
          rect.left < visible.left - 0.5 ||
          rect.right > visible.right + 0.5 ||
          rect.bottom > visible.bottom - 0.5,
      );
      return {
        ok:
          text.includes("Data from OpenStreetMap") &&
          text.includes("OpenMapTiles") &&
          !text.includes("OpenFreeMap") &&
          rects.length > 0 &&
          outside.length === 0,
        text,
        lines: rects.length,
        textBottom: rects.length ? Math.max(...rects.map((rect) => rect.bottom)) : 0,
        visibleBottom: visible.bottom,
        mapBottom: map.bottom,
        mapHeight: map.height,
      };
    });
  }

  for (const { width, height, section } of [
    { width: 320, height: 700, section: "getaways" },
    { width: 320, height: 700, section: "nightlife" },
    { width: 320, height: 700, section: "" },
    { width: 390, height: 844, section: "getaways" },
    { width: 390, height: 844, section: "nightlife" },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(section ? `/?section=${section}` : "/");
    await page.getByRole("button", { name: "Show map" }).click();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await expect.poll(async () => (await creditBox()).ok, { timeout: 8_000 }).toBe(true);
    const credit = await creditBox();
    expect(credit.ok).toBe(true);
    expect(credit.text).toContain("Data from OpenStreetMap");
    expect(credit.text).toContain("OpenMapTiles");
    expect(credit.text).not.toContain("OpenFreeMap");
    await expect(page.locator(".maplibregl-ctrl-attrib")).toHaveCount(1);
    const creditLinks = page.locator(".maplibregl-ctrl-attrib a");
    await expect(creditLinks).toHaveCount(2);
    await expect(creditLinks.filter({ hasText: "OpenMapTiles" })).toHaveAttribute("href", /openmaptiles\.org/);
    await expect(creditLinks.filter({ hasText: "OpenStreetMap" })).toHaveAttribute("href", /openstreetmap\.org\/copyright/);
    expect(credit.textBottom).toBeLessThanOrEqual(credit.visibleBottom + 0.5);
    expect(credit.mapBottom).toBeLessThanOrEqual(height + 0.5);
    expect(credit.mapHeight).toBeGreaterThan(120);
  }
});

test("the longest popup stays reachable on a phone and on the desktop map", async ({ page }) => {
  async function insideMap(selector: string) {
    return page.evaluate((target) => {
      const map = document.querySelector("#map")?.getBoundingClientRect();
      const node = document.querySelector(target);
      if (!map || !node) return false;
      const rect = node.getBoundingClientRect();
      const credit = document.querySelector(".maplibregl-ctrl-attrib")?.getBoundingClientRect();
      const top = Math.max(map.top, 0);
      const left = Math.max(map.left, 0);
      const right = Math.min(map.right, window.innerWidth);
      const bottom = Math.min(map.bottom, window.innerHeight, credit ? credit.top : window.innerHeight);
      return rect.width > 0 && rect.height > 0 && rect.top >= top - 1 && rect.bottom <= bottom + 1 && rect.left >= left - 1 && rect.right <= right + 1;
    }, selector);
  }

  async function creditInside() {
    return page.evaluate(() => {
      const map = document.querySelector("#map")?.getBoundingClientRect();
      const inner = document.querySelector(".maplibregl-ctrl-attrib-inner");
      if (!map || !inner) return false;
      const text = (inner.textContent ?? "").replace(/\s+/g, " ");
      if (!text.includes("Data from OpenStreetMap") || !text.includes("OpenMapTiles") || text.includes("OpenFreeMap")) return false;
      const range = document.createRange();
      range.selectNodeContents(inner);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      const top = Math.max(map.top, 0);
      const left = Math.max(map.left, 0);
      const right = Math.min(map.right, window.innerWidth);
      const bottom = Math.min(map.bottom, window.innerHeight);
      return rects.length > 0 && rects.every((rect) => rect.top >= top - 0.5 && rect.bottom <= bottom + 0.5 && rect.left >= left - 0.5 && rect.right <= right + 0.5);
    });
  }

  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?section=getaways");
    await page.locator("#sinhagad-fort .card-hit").click();
    await page.getByRole("button", { name: "Show map" }).click();
    await expect(page.locator(".maplibregl-popup")).toContainText("Donaje");
    await expect.poll(() => insideMap(".maplibregl-popup-close-button")).toBe(true);
    const note = page.locator(".popup").getByText("village-route");
    const maps = page.locator(".maplibregl-popup").getByRole("link", { name: "Google Maps" });
    const source = page.locator(".maplibregl-popup").getByRole("link", { name: "OpenStreetMap" });
    await note.scrollIntoViewIfNeeded();
    await maps.scrollIntoViewIfNeeded();
    await source.scrollIntoViewIfNeeded();
    await expect.poll(() => insideMap(".maplibregl-popup a[href*='openstreetmap.org']")).toBe(true);
    await expect.poll(() => insideMap(".maplibregl-popup a.outward")).toBe(true);
    expect(await creditInside()).toBe(true);
    await page.locator(".maplibregl-popup-close-button").click();
    await expect(page.locator(".maplibregl-popup")).toHaveCount(0);
    await page.locator("[data-section='']").click();
    await expect.poll(creditInside).toBe(true);
    const sections = await page.locator(".pill[data-section]").evaluateAll((els) =>
      els.map((element) => element.getAttribute("data-section") ?? "").filter(Boolean),
    );
    for (const section of sections) {
      await page.locator(`[data-section="${section}"]`).click();
      await expect.poll(creditInside).toBe(true);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?section=getaways");
  await page.locator("#sinhagad-fort .card-hit").click();
  await expect(page.locator(".maplibregl-popup")).toContainText("Donaje");
  await expect(page.locator(".maplibregl-popup.is-contained")).toHaveCount(0);
  await expect.poll(() => insideMap(".maplibregl-popup a[href*='openstreetmap.org']")).toBe(true);
  await expect.poll(() => insideMap(".maplibregl-popup-close-button")).toBe(true);
  expect(await creditInside()).toBe(true);
});

test("the maker line is a page footer outside the card list", async ({ page }) => {
  async function footerSitsBelowTheList() {
    return page.evaluate(() => {
      const footer = document.querySelector("footer.colophon");
      const list = document.querySelector(".list-pane");
      const app = document.querySelector(".app");
      if (!footer || !list || !app) return false;
      if (list.contains(footer)) return false;
      if ((app.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING) === 0) return false;
      const footerBox = footer.getBoundingClientRect();
      const listBox = list.getBoundingClientRect();
      const text = footer.textContent ?? "";
      return text.includes("Made with love by Shivanshu Sahu") && footerBox.top >= listBox.bottom - 2 && footerBox.bottom <= window.innerHeight + 2;
    });
  }

  async function footerMeasure() {
    return page.locator("footer.colophon").evaluate((footer) => {
      const box = footer.getBoundingClientRect();
      const style = getComputedStyle(footer);
      const paragraph = footer.querySelector("p");
      return {
        height: box.height,
        fontSize: style.fontSize,
        family: style.fontFamily,
        text: paragraph?.textContent ?? "",
      };
    });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect.poll(footerSitsBelowTheList).toBe(true);
  const footer = await footerMeasure();
  expect(footer.text).toBe("Made with love by Shivanshu Sahu");
  expect(footer.family).toContain("Inter");
  expect(footer.fontSize).toBe("13.34px");
  expect(footer.height).toBeGreaterThan(18);
  expect(footer.height).toBeLessThan(36);
  await page.locator('[data-section="getaways"]').click();
  await expect(page.locator("article.card:visible")).toHaveCount(2);
  await expect.poll(footerSitsBelowTheList).toBe(true);
  await page.locator("[data-section='']").click();
  await expect.poll(footerSitsBelowTheList).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(footerSitsBelowTheList).toBe(true);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('[data-section="getaways"]').click();
  await expect.poll(footerSitsBelowTheList).toBe(true);
  await page.getByRole("button", { name: "Show map" }).click();
  await expect(page.locator("footer.colophon")).toBeHidden();
  await expect(page.locator(".maplibregl-ctrl-attrib-inner")).toContainText("Data from OpenStreetMap");
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

test("the masthead stays a compact row and leaves the other type alone", async ({ page }) => {
  const tagline = "A local’s guide to falling in love with Pune";

  async function measure() {
    return page.evaluate(() => {
      const header = document.querySelector("header.top")?.getBoundingClientRect();
      const mark = document.querySelector(".mark")?.getBoundingClientRect();
      const h1 = document.querySelector(".brand h1");
      const tag = document.querySelector(".brand p");
      const pill = document.querySelector(".pill");
      const card = document.querySelector(".card-name");
      if (!header || !mark || !h1 || !tag || !pill || !card) return null;
      const h1Box = h1.getBoundingClientRect();
      const tagBox = tag.getBoundingClientRect();
      const style = (element: Element) => getComputedStyle(element);
      return {
        headerHeight: header.height,
        headerTop: header.top,
        headerBottom: header.bottom,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        mark: { x: mark.x, y: mark.y, w: mark.width, h: mark.height, right: mark.right, bottom: mark.bottom },
        h1: { x: h1Box.x, y: h1Box.y, w: h1Box.width, h: h1Box.height, right: h1Box.right, text: h1.textContent, family: style(h1).fontFamily, size: style(h1).fontSize, weight: style(h1).fontWeight },
        tag: { x: tagBox.x, y: tagBox.y, w: tagBox.width, h: tagBox.height, right: tagBox.right, bottom: tagBox.bottom, text: tag.textContent, family: style(tag).fontFamily, size: style(tag).fontSize, weight: style(tag).fontWeight },
        pill: { size: style(pill).fontSize, family: style(pill).fontFamily },
        card: { size: style(card).fontSize, family: style(card).fontFamily, weight: style(card).fontWeight },
      };
    });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const wide = await measure();
  expect(wide).not.toBeNull();
  expect(wide!.headerHeight).toBeLessThan(72);
  expect(wide!.mark.h).toBeGreaterThan(34);
  expect(wide!.mark.h).toBeLessThan(40);
  expect(wide!.mark.x).toBeLessThan(wide!.h1.x);
  expect(wide!.tag.x).toBeGreaterThan(wide!.h1.x + wide!.h1.w - 2);
  expect(wide!.tag.y).toBeLessThan(wide!.h1.y + wide!.h1.h - 2);
  expect(wide!.mark.y).toBeGreaterThanOrEqual(wide!.headerTop - 1);
  expect(wide!.mark.bottom).toBeLessThanOrEqual(wide!.headerBottom + 1);
  expect(wide!.tag.right).toBeLessThanOrEqual(1440);
  expect(wide!.overflow).toBeLessThanOrEqual(1);
  expect(wide!.h1.text).toBe("Pune");
  expect(wide!.tag.text).toBe(tagline);
  expect(wide!.h1.family).toContain("Instrument Serif");
  expect(wide!.tag.family).toBe('Inter, "Segoe UI", sans-serif');
  expect(wide!.h1.weight).toBe("400");
  expect(wide!.tag.weight).toBe("400");
  expect(wide!.h1.size).toBe("26.825px");
  expect(wide!.tag.size).toBe("14.21px");
  expect(wide!.pill.size).toBe("15.225px");
  expect(wide!.card.size).toBe("14.5px");
  expect(wide!.card.weight).toBe("600");

  for (const viewport of [
    { width: 430, height: 900, limit: 90 },
    { width: 390, height: 844, limit: 90 },
    { width: 320, height: 700, limit: 100 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const narrow = await measure();
    expect(narrow).not.toBeNull();
    expect(narrow!.headerHeight).toBeLessThan(viewport.limit);
    expect(narrow!.overflow).toBeLessThanOrEqual(1);
    expect(narrow!.mark.h).toBeGreaterThan(wide!.mark.h);
    expect(narrow!.mark.h).toBeGreaterThan(46);
    expect(narrow!.mark.h).toBeLessThan(50);
    expect(narrow!.mark.x).toBeLessThan(narrow!.h1.x);
    expect(narrow!.tag.x).toBeGreaterThan(narrow!.h1.x + narrow!.h1.w - 2);
    expect(narrow!.tag.y).toBeLessThan(narrow!.h1.y + narrow!.h1.h - 2);
    expect(narrow!.tag.bottom).toBeLessThanOrEqual(narrow!.headerBottom + 1);
    expect(narrow!.tag.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(narrow!.h1.family).toBe(wide!.h1.family);
    expect(narrow!.tag.family).toBe(wide!.tag.family);
    expect(narrow!.h1.size).toBe("18px");
    expect(narrow!.h1.weight).toBe("400");
    expect(narrow!.tag.size).toBe(wide!.tag.size);
    expect(narrow!.pill.size).toBe(wide!.pill.size);
    expect(narrow!.card.size).toBe(wide!.card.size);
  }
});

test("removed places stay off the list, and a stale address still opens the guide", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article.card")).toHaveCount(52);
  for (const id of ["asha-dining-hall", "durvankur-dining-hall", "vaidya-upahar-gruha", "bangalore-canteen", "pmc-heritage-walk"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  }
  await page.goto("/?q=Kayani");
  await expect(page.locator("#q")).toHaveCount(0);
  await expect(page.locator("article.card:visible")).toHaveCount(52);
  await expect(page).not.toHaveURL(/[?&]q=/);
  await page.goto("/?section=coffee&q=zzz-no-such-place");
  await expect(page.locator("[data-section='coffee']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#kayani-bakery")).toBeHidden();
  await expect(page.locator("article.card:visible").first()).toBeVisible();
  await expect(page).not.toHaveURL(/[?&]q=/);
  await page.goto("/#asha-dining-hall");
  await expect(page.locator("#asha-dining-hall")).toHaveCount(0);
  await expect(page.locator("article.card")).toHaveCount(52);
  await expect(page.locator("h1")).toHaveText("Pune");
  await expect(page.locator(".brand p")).toHaveText("A local’s guide to falling in love with Pune");
});

test("a phone map stays tall after the window widens to the desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const list = page.locator(".list-pane");
  await page.locator("#sinhagad-fort .card-hit").click();
  const scrolled = await list.evaluate((node) => node.scrollTop);
  expect(scrolled).toBeGreaterThan(40);
  await page.getByRole("button", { name: "Show map" }).click();
  await expect(page.locator(".maplibregl-popup")).toContainText("Sinhagad");
  expect((await page.locator("#map").boundingBox())?.height ?? 0).toBeGreaterThan(200);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const desktop = await page.locator("#map").boundingBox();
  expect(desktop?.height ?? 0).toBeGreaterThan(400);
  await expect(page.locator('.pill-marker[data-place="sinhagad-fort"]')).toBeVisible();
  await expect(page.locator('[data-section=""]')).toHaveAttribute("aria-pressed", "true");
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
  await expect(page.locator(".maplibregl-popup")).toContainText("Google Maps");
  await expect(page.locator(".maplibregl-ctrl-attrib-inner")).toContainText("OpenMapTiles");
  await expect(page.locator(".maplibregl-ctrl-attrib-inner")).toContainText("Data from OpenStreetMap");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveAttribute("data-view", "map");
  expect((await page.locator("#map").boundingBox())?.height ?? 0).toBeGreaterThan(200);
  const fab = await page.getByRole("button", { name: "Show list" }).boundingBox();
  const credit = await page.locator(".maplibregl-ctrl-attrib").boundingBox();
  const popup = await page.locator(".maplibregl-popup").boundingBox();
  expect(fab?.height ?? 0).toBeGreaterThanOrEqual(44);
  const overlaps = (a: { x: number; y: number; width: number; height: number } | null, b: { x: number; y: number; width: number; height: number } | null) =>
    Boolean(a && b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y);
  expect(overlaps(fab, credit)).toBe(false);
  expect(overlaps(fab, popup)).toBe(false);
  await page.getByRole("button", { name: "Show list" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "list");
  await expect(page.locator('[data-section=""]')).toHaveAttribute("aria-pressed", "true");
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
});

test("a desktop map stays tall when the window narrows and widens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("#sinhagad-fort .card-hit").click();
  expect((await page.locator("#map").boundingBox())?.height ?? 0).toBeGreaterThan(400);

  for (const width of [430, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "Show map" }).click();
    expect((await page.locator("#map").boundingBox())?.height ?? 0).toBeGreaterThan(200);
    const fab = await page.getByRole("button", { name: "Show list" }).boundingBox();
    expect(fab?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Show list" }).click();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  expect((await page.locator("#map").boundingBox())?.height ?? 0).toBeGreaterThan(400);
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".view-fab")).toBeHidden();
});

test("the mobile map button opens the map and returns to the same list", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "List", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Map", exact: true })).toHaveCount(0);
  await page.locator('[data-section="coffee"]').click();
  const list = page.locator(".list-pane");
  await list.evaluate((node) => {
    node.scrollTop = 180;
  });
  const scrolled = await list.evaluate((node) => node.scrollTop);
  const showMap = page.getByRole("button", { name: "Show map" });
  await showMap.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toHaveAttribute("data-view", "map");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show list" })).toBeFocused();
  await expect(page.locator('[data-section="coffee"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Show list" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "list");
  await expect(page.locator("#blue-tokai-ghole-road")).toBeVisible();
  await expect(page.locator("#kayani-bakery")).toBeHidden();
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(scrolled - 40);
  await expect(page.getByRole("button", { name: "Show map" })).toBeFocused();
});

test("a maps link and a source link open a new tab and leave the guide open", async ({ page }) => {
  await page.goto("/");
  const maps = page.locator("#kayani-bakery .card-actions a");
  await expect(maps).toHaveAttribute("target", "_blank");
  await expect(maps).toHaveAttribute("rel", "noopener noreferrer");
  const [cardPage] = await Promise.all([page.waitForEvent("popup"), maps.click()]);
  await expect(cardPage).toHaveURL(/google\.com\/maps\/place\//);
  await expect(page.locator("h1")).toHaveText("Pune");
  await expect(page.locator("#kayani-bakery")).toBeVisible();
  await cardPage.close();

  let sectionOpened = false;
  page.on("popup", () => {
    sectionOpened = true;
  });
  await page.locator("[data-section='coffee']").click();
  expect(sectionOpened).toBe(false);

  await page.locator("[data-section='']").click();
  await page.locator("#kayani-bakery .card-hit").click();
  const source = page.locator(".maplibregl-popup").getByRole("link", { name: "OpenStreetMap" });
  await expect(source).toHaveAttribute("target", "_blank");
  await expect(source).toHaveAttribute("rel", "noopener noreferrer");
  const [sourcePage] = await Promise.all([page.waitForEvent("popup"), source.click()]);
  await expect(sourcePage).toHaveURL(/openstreetmap\.org/);
  await expect(page.locator(".maplibregl-popup")).toBeVisible();
  await sourcePage.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#kayani-bakery .card-hit").click();
  await page.getByRole("button", { name: "Show map" }).click();
  const mobileMaps = page.locator(".maplibregl-popup").getByRole("link", { name: "Google Maps" });
  await expect(mobileMaps).toHaveAttribute("target", "_blank");
  const [mobilePage] = await Promise.all([page.waitForEvent("popup"), mobileMaps.click()]);
  await expect(mobilePage).toHaveURL(/google\.com\/maps\/place\//);
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator(".maplibregl-popup")).toContainText("Kayani");
  await mobilePage.close();
});
