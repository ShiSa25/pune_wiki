import { describe, expect, it } from "vitest";
import { filterPlaces, filterStateFromParams, paramsFromFilter } from "../src/lib/browse";
import { inPuneBox, placeGeometry } from "../src/lib/coords";
import { cardLine, MAP_STYLE, TILE_HOST, places, sections } from "../src/lib/guide";
import { visibleLabelIds, type LabelBox } from "../src/lib/labels";

const excludedNames = ["garden vada", "vetal tekdi", "chitale", "gather", "ground up", "kowloon", "shreyas", "gatti anna"];

describe("guide data", () => {
  it("stays between 50 and 60 places in eight sections", () => {
    expect(places.length).toBeGreaterThanOrEqual(50);
    expect(places.length).toBeLessThanOrEqual(60);
    expect(sections).toHaveLength(8);
    expect(new Set(places.map((place) => place.id)).size).toBe(places.length);
    for (const section of sections) {
      expect(places.filter((place) => place.section === section.id).length).toBeGreaterThan(0);
    }
  });

  it("keeps a source url, type, and check date on every place", () => {
    for (const place of places) {
      expect(place.sources.length).toBeGreaterThan(0);
      for (const source of place.sources) {
        const url = new URL(source.url);
        expect(["http:", "https:"]).toContain(url.protocol);
        expect(url.username).toBe("");
        expect(source.type.length).toBeGreaterThan(2);
        expect(source.checkedOn).toBe("2026-11-07");
      }
    }
  });

  it("does not copy Google listing coordinates onto the map", () => {
    let pins = 0;
    for (const place of places) {
      expect(place.pin).not.toBe("maps-place-geometry");
      if (!place.pin) {
        expect(place.lat).toBeNull();
        expect(place.lng).toBeNull();
        continue;
      }
      pins += 1;
      expect(place.coordUrl).toBeTruthy();
      expect(place.coordCheckedOn).toBe("2026-11-07");
      expect(inPuneBox({ lat: place.lat!, lng: place.lng! })).toBe(true);
      const copied = placeGeometry(place.mapsUrl ?? "");
      if (copied) {
        expect(copied.lat === place.lat && copied.lng === place.lng).toBe(false);
      }
      const host = new URL(place.coordUrl!).hostname;
      if (place.pin === "osm") expect(host).toBe("www.openstreetmap.org");
      if (place.pin === "wikipedia") expect(host.endsWith("wikipedia.org")).toBe(true);
      if (place.pin === "venue") expect(host.endsWith("google.com")).toBe(false);
    }
    expect(pins).toBe(29);
    expect(places.length - pins).toBe(24);
  });

  it("leaves the unresolved branches out of the names", () => {
    const names = places.map((place) => place.name.toLowerCase()).join("\n");
    for (const name of excludedNames) expect(names).not.toContain(name);
    expect(places.find((place) => place.id === "gatti-chutney")?.flag).toMatch(/Koregaon Park/);
    expect(places.find((place) => place.id === "independence-brewing-co")?.flag?.toLowerCase()).toContain("mundhwa");
    expect(places.find((place) => place.id === "kayani-bakery")?.pin).toBe("osm");
  });
});

describe("coordinates", () => {
  it("reads only the listing geometry and ignores a camera centre", () => {
    expect(placeGeometry("https://www.google.com/maps/place/Example/@18.52,73.85,17z")).toBeNull();
    expect(
      placeGeometry("https://www.google.com/maps/place/Example/@18.90,73.10,17z/data=!8m2!3d18.5201!4d73.8562"),
    ).toEqual({ lat: 18.5201, lng: 73.8562 });
    expect(inPuneBox({ lat: 18.52, lng: 73.85 })).toBe(true);
    expect(inPuneBox({ lat: 12.97, lng: 77.59 })).toBe(false);
  });
});

describe("filters", () => {
  it("matches case-insensitively and combines section with search", () => {
    expect(filterPlaces(places, { section: "", query: "KAYANI" }).map((place) => place.id)).toEqual(["kayani-bakery"]);
    expect(filterPlaces(places, { section: "pints", query: "kayani" })).toEqual([]);
    expect(filterPlaces(places, { section: "coffee", query: "" }).every((place) => place.section === "coffee")).toBe(
      true,
    );
    expect(filterPlaces(places, { section: "nope", query: "" })).toEqual([]);
    expect(filterPlaces(places, { section: "", query: "zzz-no-such-place" })).toEqual([]);
  });

  it("round-trips the query string and drops an unknown section at the edges", () => {
    const state = { section: "sweet", query: "  Mastani " };
    const params = new URLSearchParams(paramsFromFilter({ section: "sweet", query: "Mastani" }).slice(1));
    expect(filterStateFromParams(params)).toEqual({ section: "sweet", query: "Mastani" });
    expect(filterPlaces(places, { ...state, query: state.query }).length).toBeGreaterThan(0);
  });
});

describe("card line", () => {
  it("keeps a short line and cuts a long one at the first sentence", () => {
    expect(cardLine("Est. 1955 Camp bakery.")).toBe("Est. 1955 Camp bakery.");
    expect(
      cardLine(
        "First sentence is plenty. The rest is provenance that belongs in notes and should not sit on the card face where it makes the card tall.",
      ),
    ).toBe("First sentence is plenty.");
  });
});

describe("map labels", () => {
  it("hides an overlapping pill and always keeps the selected one", () => {
    const boxes: LabelBox[] = [
      { id: "a", x: 0, y: 0, w: 80, h: 20, selected: false },
      { id: "b", x: 10, y: 0, w: 80, h: 20, selected: false },
      { id: "c", x: 200, y: 0, w: 80, h: 20, selected: true },
      { id: "d", x: 205, y: 2, w: 80, h: 20, selected: false },
    ];
    const shown = visibleLabelIds(boxes);
    expect(shown).toContain("a");
    expect(shown).not.toContain("b");
    expect(shown).toContain("c");
    expect(shown).not.toContain("d");
  });
});

describe("tiles", () => {
  it("points at the OpenFreeMap style and not the OSMF raster host", () => {
    expect(MAP_STYLE).toBe(`https://${TILE_HOST}/styles/positron`);
    expect(MAP_STYLE).not.toContain("tile.openstreetmap.org");
    expect(MAP_STYLE).not.toContain("nominatim");
  });
});
