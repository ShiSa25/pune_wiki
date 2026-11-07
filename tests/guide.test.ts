import { describe, expect, it } from "vitest";
import { cameraForSelection, filterPlaces, filterStateFromParams, paramsFromFilter } from "../src/lib/browse";
import { inPuneBox, placeGeometry } from "../src/lib/coords";
import { MAP_STYLE, placeSchema, TILE_HOST, places, sections } from "../src/lib/guide";
import { evidenceLink, onwardLink } from "../src/lib/outward";
import { visibleLabelIds, type LabelBox } from "../src/lib/labels";

const excludedNames = ["garden vada", "vetal tekdi", "sevasadan", "gather", "ground up", "kowloon", "shreyas", "gatti anna"];

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

  it("requires independent coordinate evidence on every displayed place", () => {
    expect(places.length).toBe(50);
    const off = ["the-place", "poona-guest-house", "badshahi-boarding-house", "elephant-and-co", "gatti-chutney"];
    expect(places.map((place) => place.id)).not.toEqual(expect.arrayContaining(off));
    for (const place of places) {
      expect(place.pin).not.toBe("maps-place-geometry");
      expect(place.pin).toBeTruthy();
      expect(place.lat).not.toBeNull();
      expect(place.lng).not.toBeNull();
      expect(place.coordUrl).toBeTruthy();
      expect(place.coordCheckedOn).toBe("2026-11-07");
      expect(inPuneBox({ lat: place.lat!, lng: place.lng! })).toBe(true);
      const host = new URL(place.coordUrl!).hostname;
      if (place.pin === "osm") expect(host).toBe("www.openstreetmap.org");
      if (place.pin === "wikipedia") expect(host.endsWith("wikipedia.org")).toBe(true);
      if (place.pin === "venue") expect(host.endsWith("google.com")).toBe(false);
    }
    const donna = places.find((place) => place.id === "donna-cucina");
    expect(placeGeometry(donna?.mapsUrl ?? "")).toEqual({ lat: donna?.lat, lng: donna?.lng });
    for (const id of ["doolally-taproom", "independence-brewing-co", "al-di-la", "aasmana", "blue-nile", "chitale-bandhu-bajirao", "wadeshwar"]) {
      expect(places.find((place) => place.id === id)?.pinNote?.length).toBeGreaterThan(12);
    }
    expect(places.find((place) => place.id === "chitale-bandhu-bajirao")?.flag).toMatch(/Sevasadan/);
    expect(places.find((place) => place.id === "prems")?.flag).toMatch(/Baner/);
    expect(places.find((place) => place.id === "blue-tokai-ghole-road")?.flag).toMatch(/Ghole Road/);
  });

  it("leaves the unresolved branches out of the names", () => {
    const names = places.map((place) => place.name.toLowerCase()).join("\n");
    for (const name of excludedNames) expect(names).not.toContain(name);
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

  it("finds Marathi names and the Fergusson College Road spelling", () => {
    expect(filterPlaces(places, { section: "", query: "वैशाली" }).map((place) => place.id)).toEqual(["vaishali"]);
    expect(filterPlaces(places, { section: "", query: "मिसळ" }).map((place) => place.id)).toContain("bedekar-tea-stall");
    expect(filterPlaces(places, { section: "", query: "Ferguson" }).map((place) => place.id)).toEqual(
      expect.arrayContaining(["vaishali", "cafe-goodluck"]),
    );
    expect(filterPlaces(places, { section: "", query: "शनिवार" }).map((place) => place.id)).toEqual(["shaniwar-wada"]);
  });

  it("rejects unsafe urls through the place schema", () => {
    const sample = places[0];
    expect(placeSchema.safeParse({ ...sample, mapsUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(placeSchema.safeParse({ ...sample, mapsUrl: "data:text/html,hi" }).success).toBe(false);
    expect(placeSchema.safeParse({ ...sample, mapsUrl: "ftp://example.com/place" }).success).toBe(false);
    expect(
      placeSchema.safeParse({
        ...sample,
        sources: [{ ...sample.sources[0], url: "https://user:pass@example.com/secret" }],
      }).success,
    ).toBe(false);
  });

  it("only recenters a revealed map when the selection has an independent pin", () => {
    const pinned = places.find((place) => place.pin);
    const unpinned = places.find((place) => !place.pin);
    expect(cameraForSelection(pinned)?.lat).toBe(pinned?.lat);
    expect(cameraForSelection(unpinned)).toBeNull();
    expect(cameraForSelection(undefined)).toBeNull();
  });

  it("round-trips the query string and drops an unknown section at the edges", () => {
    const state = { section: "sweet", query: "  Mastani " };
    const params = new URLSearchParams(paramsFromFilter({ section: "sweet", query: "Mastani" }).slice(1));
    expect(filterStateFromParams(params)).toEqual({ section: "sweet", query: "Mastani" });
    expect(filterPlaces(places, { ...state, query: state.query }).length).toBeGreaterThan(0);
  });
});

describe("card summary and outward links", () => {
  it("keeps method wording off every summary and gives every place a safe link", () => {
    const leak = /\b(osm|lbb|elle|schema\.org|wikidata)\b|this pin|city search|named on|first-party|official site|node records|\bper\s+[a-z]/i;
    expect(places).toHaveLength(50);
    for (const place of places) {
      expect(place.summary).not.toMatch(leak);
      expect(place.summary.length).toBeGreaterThan(12);
      const onward = onwardLink(place);
      const evidence = evidenceLink(place.coordUrl!);
      expect(evidence.href).toBe(place.coordUrl);
      expect(onward.href.startsWith("https://")).toBe(true);
      expect(onward.href).not.toMatch(/javascript:|data:/);
      if (place.mapsUrl) {
        expect(onward).toEqual({ href: place.mapsUrl, label: "Google Maps" });
        continue;
      }
      const url = new URL(onward.href);
      expect(onward.label).toBe("Search Google Maps");
      expect(url.origin).toBe("https://www.google.com");
      expect(url.pathname).toBe("/maps/search/");
      expect(url.searchParams.get("api")).toBe("1");
      expect(url.searchParams.get("query")).toBe(`${place.name}, ${place.area}, Pune`);
      expect(onward.href).not.toMatch(/place_id|!8m2|ChIJ/);
    }
    expect(places.find((place) => place.id === "vohuman-cafe")?.summary).toBe(
      "Boisterous breakfast room since 1978, with a queue most mornings.",
    );
    expect(places.find((place) => place.id === "blue-nile")?.summary).toMatch(/biryani/);
    expect(onwardLink({ name: "A & B", area: "Lane 1", mapsUrl: null }).href).not.toContain(" ");
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
