import { describe, expect, it } from "vitest";
import { filterPlaces } from "../src/lib/browse";
import { inPuneBox, placeGeometry } from "../src/lib/coords";
import { MAP_STYLE, TILE_HOST, places, sections } from "../src/lib/guide";

const banned = ["garden vada", "vetal tekdi", "chitale", "gather", "ground up", "kowloon", "shreyas", "gatti anna"];

describe("guide", () => {
  it("keeps a sourced list of 50 to 60 places across eight sections", () => {
    expect(places.length).toBeGreaterThanOrEqual(50);
    expect(places.length).toBeLessThanOrEqual(60);
    expect(sections).toHaveLength(8);
    expect(new Set(places.map((place) => place.id)).size).toBe(places.length);
    for (const section of sections) {
      expect(places.some((place) => place.section === section.id)).toBe(true);
    }
  });

  it("leaves out the unresolved and excluded names", () => {
    const names = places.map((place) => place.name.toLowerCase()).join("\n");
    for (const name of banned) expect(names).not.toContain(name);
    const ibc = places.find((place) => place.id === "independence-brewing-co");
    expect(ibc?.flag?.toLowerCase()).toContain("mundhwa");
    expect(ibc?.flag?.toLowerCase()).toContain("closed");
    expect(places.some((place) => place.name === "Gatti Chutney")).toBe(true);
    expect(places.find((place) => place.id === "gatti-chutney")?.flag).toMatch(/Koregaon Park/);
    expect(places.find((place) => place.id === "independence-brewing-co")?.area).toMatch(/Kalyani/);
  });

  it("uses listing geometry only, and only inside the Pune box", () => {
    for (const place of places) {
      expect(JSON.stringify(place)).not.toMatch(/"rating"|"reviews"|"hours"/);
      if (!place.pin) {
        expect(place.lat).toBeNull();
        expect(place.lng).toBeNull();
        continue;
      }
      const geometry = placeGeometry(place.mapsUrl ?? "");
      expect(geometry).toEqual({ lat: place.lat, lng: place.lng });
      expect(inPuneBox(geometry!)).toBe(true);
      expect(place.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\//);
    }
  });

  it("rejects a camera centre and non-http urls", () => {
    expect(placeGeometry("https://www.google.com/maps/place/Example/@18.52,73.85,17z")).toBeNull();
    expect(
      placeGeometry(
        "https://www.google.com/maps/place/Example/@18.90,73.10,17z/data=!8m2!3d18.5201!4d73.8562",
      ),
    ).toEqual({ lat: 18.5201, lng: 73.8562 });
    expect(MAP_STYLE.startsWith(`https://${TILE_HOST}/`)).toBe(true);
  });

  it("filters by section and search without inventing a match", () => {
    expect(filterPlaces(places, { section: "coffee", query: "" }).every((place) => place.section === "coffee")).toBe(
      true,
    );
    expect(filterPlaces(places, { section: "", query: "KAYANI" }).map((place) => place.id)).toEqual(["kayani-bakery"]);
    expect(filterPlaces(places, { section: "pints", query: "kayani" })).toEqual([]);
    expect(filterPlaces(places, { section: "nope", query: "" })).toEqual([]);
  });
});
