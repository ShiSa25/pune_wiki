import type { Place } from "./guide";

export interface FilterState {
  section: string;
  query: string;
}

export const emptyFilter: FilterState = { section: "", query: "" };

/** Where the map should look when a selected card has an independent pin. */
export function cameraForSelection(
  place: { pin: string | null; lat: number | null; lng: number | null } | undefined,
): { lng: number; lat: number } | null {
  if (!place?.pin || place.lat === null || place.lng === null) return null;
  return { lng: place.lng, lat: place.lat };
}

export function filterPlaces(list: readonly Place[], state: FilterState): Place[] {
  return list.filter((place) => !state.section || place.section === state.section);
}

export function filterStateFromParams(params: URLSearchParams): FilterState {
  return {
    section: params.get("section") ?? "",
    query: "",
  };
}

export function paramsFromFilter(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.section) params.set("section", state.section);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
