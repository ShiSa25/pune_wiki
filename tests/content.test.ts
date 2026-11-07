import { describe, expect, it } from "vitest";
import pairingsJson from "../src/content/pairings.json";
import placesJson from "../src/content/places.json";
import { categoryIds } from "../src/lib/categories";
import { pairings, places } from "../src/lib/catalog";
import { placeMapsUrl } from "../src/lib/maps";
import { googleMapsUrlSchema, httpUrlSchema } from "../src/lib/schema";

const bannedKeys = new Set([
  "rating",
  "stars",
  "latitude",
  "longitude",
  "lat",
  "lng",
  "coordinates",
  "price",
  "prices",
  "parking",
  "wheelchair",
  "besttime",
  "travelminutes",
  "hours",
]);

function walk(value: unknown, path: string, problems: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, problems));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (bannedKeys.has(key.toLowerCase())) problems.push(`${path}.${key}`);
      walk(child, `${path}.${key}`, problems);
    }
    return;
  }
  if (typeof value === "string") {
    if (value.includes("₹")) problems.push(`${path} contains a rupee amount`);
    if (/\b(i|we) visited\b/i.test(value)) problems.push(`${path} claims a visit`);
    if (/hidden gem/i.test(value)) problems.push(`${path} uses filler praise`);
    if (/\b\d{2}\.\d{4,}/.test(value)) problems.push(`${path} looks like a coordinate`);
  }
}

describe("content validity", () => {
  it("keeps a unique, source-checked place for every category", () => {
    expect(places.length).toBeGreaterThanOrEqual(12);
    expect(new Set(places.map((place) => place.slug)).size).toBe(places.length);
    for (const category of categoryIds) {
      expect(places.some((place) => place.category === category)).toBe(true);
    }
    for (const place of places) {
      expect(place.editorVisit).toBe(false);
      expect(place.verification).toBe("source-checked");
      expect(place.mapsQuery.toLowerCase()).toContain("pune");
      expect(place.updatedOn).toBe("2026-11-07");
      for (const source of [...place.sources, ...place.recheck]) {
        expect(source.checkedOn).toBe("2026-11-07");
        expect(httpUrlSchema.safeParse(source.url).success).toBe(true);
        const protocol = new URL(source.url).protocol;
        expect(protocol === "http:" || protocol === "https:").toBe(true);
      }
      for (const reported of place.venueReported) {
        expect(place.sources.some((source) => source.url === reported.sourceUrl)).toBe(true);
      }
    }
  });

  it("refuses invented operational fields and visit claims", () => {
    const problems: string[] = [];
    walk(placesJson, "places", problems);
    walk(pairingsJson, "pairings", problems);
    expect(problems).toEqual([]);
  });

  it("keeps Sinhagad historical and says current access is not confirmed", () => {
    const fort = places.find((place) => place.slug === "sinhagad");
    expect(fort).toBeDefined();
    expect(fort?.note.toLowerCase()).toContain("current access is not established");
    expect(fort?.omitted.join(" ").toLowerCase()).toMatch(/night/);
    expect(fort?.omitted.join(" ").toLowerCase()).toMatch(/monsoon/);
    expect(fort?.recheck.length).toBeGreaterThanOrEqual(2);
  });

  it("resolves pairing stops and does not turn the fort into a route", () => {
    expect(pairings.length).toBeGreaterThanOrEqual(2);
    expect(pairings.length).toBeLessThanOrEqual(3);
    const slugs = new Set(places.map((place) => place.slug));
    for (const pairing of pairings) {
      expect(pairing.stops.length).toBeGreaterThanOrEqual(2);
      for (const stop of pairing.stops) expect(slugs.has(stop)).toBe(true);
      expect(pairing.limit.toLowerCase()).not.toContain("minute");
    }
    const fortPairing = pairings.find((pairing) => pairing.stops.includes("sinhagad"));
    expect(fortPairing?.limit.toLowerCase()).toContain("not a trek");
    expect(fortPairing?.limit.toLowerCase()).toMatch(/night|monsoon/);
  });

  it("rejects non-http content URLs and accepts only https Google Maps links", () => {
    for (const value of ["javascript:alert(1)", "data:text/html,hi", "ftp://example.com/place", "https://user:pass@example.com/"]) {
      expect(httpUrlSchema.safeParse(value).success).toBe(false);
    }
    expect(httpUrlSchema.safeParse("https://www.kayanibakerypune.com/").success).toBe(true);
    expect(httpUrlSchema.safeParse("http://www.vaishalihotel.in/").success).toBe(true);
    expect(googleMapsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(googleMapsUrlSchema.safeParse("https://evil.example/maps/search/").success).toBe(false);
    expect(googleMapsUrlSchema.safeParse("http://www.google.com/maps/search/?api=1&query=Pune").success).toBe(false);
    expect(
      googleMapsUrlSchema.safeParse(
        "https://www.google.com/maps/search/?api=1&query=Saras+Baug+Pune&query_place_id=ChIJPTTMtErBwjsR4x5gOiq7Azw",
      ).success,
    ).toBe(true);
  });

  it("points the three corrected map links at the listings that were opened", () => {
    const chitale = places.find((place) => place.slug === "chitale-bandhu");
    const saras = places.find((place) => place.slug === "saras-baug");
    const kasba = places.find((place) => place.slug === "kasba-ganpati");
    expect(placeMapsUrl(chitale!)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Pune%20Sevasadan%20Building%20Sadashiv%20Peth",
    );
    expect(placeMapsUrl(saras!)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Saras+Baug+Pune&query_place_id=ChIJPTTMtErBwjsR4x5gOiq7Azw",
    );
    expect(placeMapsUrl(kasba!)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Kasaba%20Ganpati%20Mandir%20Kasba%20Peth%20Pune",
    );
    expect(placeMapsUrl(kasba!).toLowerCase()).not.toContain("lal+mahal");
  });
});
