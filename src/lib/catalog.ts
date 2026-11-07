import pairingsJson from "../content/pairings.json";
import placesJson from "../content/places.json";
import { categories, type CategoryId } from "./categories";
import type { SearchRecord } from "./filter";
import { pairingsFileSchema, placesFileSchema, type Pairing, type Place } from "./schema";

const parsedPlaces = placesFileSchema.parse(placesJson);
const parsedPairings = pairingsFileSchema.parse(pairingsJson);

export const places: Place[] = [...parsedPlaces.places].sort((a, b) => a.sort - b.sort);
export const pairings: Pairing[] = [...parsedPairings.pairings].sort((a, b) => a.sort - b.sort);

export function toSearchRecord(place: Place): SearchRecord {
  return {
    slug: place.slug,
    name: place.name,
    nameMarathi: place.nameMarathi ?? "",
    category: place.category,
    area: place.area,
    areaSlug: place.areaSlug,
    summary: place.summary,
    aliases: place.aliases,
  };
}

export const searchRecords: SearchRecord[] = places.map(toSearchRecord);

export function placesInCategory(category: CategoryId): Place[] {
  return places.filter((place) => place.category === category).sort((a, b) => a.sort - b.sort);
}

export function placesInArea(areaSlug: string): Place[] {
  return places.filter((place) => place.areaSlug === areaSlug).sort((a, b) => a.sort - b.sort);
}

export interface AreaOption {
  slug: string;
  label: string;
}

export function areaOptions(source: readonly Place[] = places): AreaOption[] {
  const labels = new Map<string, string>();
  for (const place of source) labels.set(place.areaSlug, place.area);
  return [...labels.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

export interface PlaceGroup {
  category: (typeof categories)[number];
  places: Place[];
}

export function groupedPlaces(source: readonly Place[] = places): PlaceGroup[] {
  return categories
    .map((category) => ({
      category,
      places: source
        .filter((place) => place.category === category.id)
        .sort((a, b) => a.sort - b.sort),
    }))
    .filter((group) => group.places.length > 0);
}

export function findPlace(slug: string): Place | undefined {
  return places.find((place) => place.slug === slug);
}

export function findPairing(slug: string): Pairing | undefined {
  return pairings.find((pairing) => pairing.slug === slug);
}

export function pairingPlaces(pairing: Pairing): Place[] {
  return pairing.stops.map((slug) => {
    const place = findPlace(slug);
    if (!place) throw new Error(`Pairing ${pairing.slug} points at missing place ${slug}`);
    return place;
  });
}
