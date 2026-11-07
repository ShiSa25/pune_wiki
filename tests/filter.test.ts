import { describe, expect, it } from "vitest";
import { searchRecords } from "../src/lib/catalog";
import {
  describeFilter,
  emptyFilter,
  filterPlaces,
  filterStateFromParams,
  paramsFromFilter,
  sanitizeFilter,
} from "../src/lib/filter";
import { mapsSearchUrl } from "../src/lib/maps";

const records = searchRecords;

describe("filterPlaces", () => {
  it("returns every place when the filters are reset", () => {
    const narrowed = filterPlaces(records, {
      query: "vaishali",
      category: "food",
      area: "camp",
    });
    expect(narrowed).toHaveLength(0);
    expect(filterPlaces(records, emptyFilter).map((place) => place.slug)).toEqual(
      records.map((place) => place.slug),
    );
  });

  it("combines category, neighbourhood, and search", () => {
    const matches = filterPlaces(records, {
      query: "elphinstone",
      category: "food",
      area: "camp",
    });
    expect(matches.map((place) => place.slug)).toEqual(["kayani-bakery"]);
  });

  it("returns nothing when the combination cannot exist", () => {
    const matches = filterPlaces(records, {
      query: "vaishali",
      category: "food",
      area: "camp",
    });
    expect(matches).toEqual([]);
  });

  it("filters by category and by neighbourhood on their own", () => {
    expect(filterPlaces(records, { ...emptyFilter, category: "coffee" }).map((place) => place.slug)).toEqual([
      "blue-tokai-koregaon-park",
    ]);
    expect(
      filterPlaces(records, { ...emptyFilter, area: "fergusson-college-road" }).map((place) => place.slug),
    ).toEqual(["hotel-vaishali"]);
  });

  it("matches aliases and Marathi without caring about case", () => {
    expect(filterPlaces(records, { ...emptyFilter, query: "KAYANI" }).map((place) => place.slug)).toEqual([
      "kayani-bakery",
    ]);
    expect(filterPlaces(records, { ...emptyFilter, query: "शनिवार" }).map((place) => place.slug)).toEqual([
      "shaniwar-wada",
    ]);
    expect(filterPlaces(records, { ...emptyFilter, query: "kondhana" }).map((place) => place.slug)).toEqual([
      "sinhagad",
    ]);
  });

  it("does not mutate the source list", () => {
    const before = records.map((place) => place.slug);
    filterPlaces(records, { query: "camp", category: "food", area: "camp" });
    expect(records.map((place) => place.slug)).toEqual(before);
  });
});

describe("filter state", () => {
  it("drops unknown category and neighbourhood values", () => {
    expect(
      sanitizeFilter({ query: "bakery", category: "nightlife", area: "baner" }, records),
    ).toEqual({ query: "bakery", category: "", area: "" });
  });

  it("round-trips query parameters and describes the active filter", () => {
    const state = { query: "wada", category: "culture", area: "central-pune" };
    const parsed = sanitizeFilter(filterStateFromParams(new URLSearchParams(paramsFromFilter(state).slice(1))), records);
    expect(parsed).toEqual(state);
    expect(describeFilter(state, () => "Central Pune")).toBe("Culture in Central Pune matching “wada”");
    expect(describeFilter(emptyFilter, () => "")).toBe("All places");
  });
});

describe("maps links", () => {
  it("builds a search URL without coordinates", () => {
    const url = mapsSearchUrl("Kayani Bakery, East Street, Camp, Pune 411001");
    expect(url.startsWith("https://www.google.com/maps/search/?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("api")).toBe("1");
    expect(params.get("query")).toContain("Kayani Bakery");
    expect(url).not.toMatch(/\d{2}\.\d{4}/);
  });
});
