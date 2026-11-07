/** Google Maps URL for a text search. No coordinates and no API key. */
export function mapsSearchUrl(query: string): string {
  const params = new URLSearchParams({
    api: "1",
    query,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Prefer a verified Maps URL. Otherwise build a text search. */
export function placeMapsUrl(place: { mapsQuery: string; mapsUrl?: string }): string {
  return place.mapsUrl ?? mapsSearchUrl(place.mapsQuery);
}
