/** Place point encoded by Google in an opened listing URL. Not the @ camera. */
const PLACE_GEOMETRY = /!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/;

export interface LngLat {
  lat: number;
  lng: number;
}

/** Pune city and the immediate PCMC suburbs present in this list. */
export function inPuneBox(point: LngLat): boolean {
  return point.lat >= 18.35 && point.lat <= 18.7 && point.lng >= 73.7 && point.lng <= 74.05;
}

/**
 * Read the listing's own geometry. A camera centre (`@lat,lng`) is ignored,
 * even when it is the only coordinate in the URL.
 */
export function placeGeometry(url: string): LngLat | null {
  const match = PLACE_GEOMETRY.exec(url);
  PLACE_GEOMETRY.lastIndex = 0;
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
