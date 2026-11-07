import type { Place } from "./guide";

export interface FilterState {
  section: string;
  query: string;
}

export const emptyFilter: FilterState = { section: "", query: "" };

export function normalizeQuery(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").trim().replace(/\s+/g, " ");
}

export function haystack(place: Place): string {
  return normalizeQuery(
    [place.name, place.kind, place.area, place.address ?? "", ...(place.aliases ?? []), place.line, place.dish ?? "", place.flag ?? ""].join(
      " \n ",
    ),
  );
}

/** Where the map should look when a selected card has an independent pin. */
export function cameraForSelection(
  place: { pin: string | null; lat: number | null; lng: number | null } | undefined,
): { lng: number; lat: number } | null {
  if (!place?.pin || place.lat === null || place.lng === null) return null;
  return { lng: place.lng, lat: place.lat };
}

export function filterPlaces(list: readonly Place[], state: FilterState): Place[] {
  const query = normalizeQuery(state.query);
  return list.filter((place) => {
    if (state.section && place.section !== state.section) return false;
    if (!query) return true;
    return haystack(place).includes(query);
  });
}

export function filterStateFromParams(params: URLSearchParams): FilterState {
  return {
    section: params.get("section") ?? "",
    query: params.get("q") ?? "",
  };
}

export function paramsFromFilter(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.section) params.set("section", state.section);
  const query = state.query.trim();
  if (query) params.set("q", query);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
