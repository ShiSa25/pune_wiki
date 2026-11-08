/** Documented Maps URL search, not a fabricated listing id. */
const GOOGLE_SEARCH = "https://www.google.com/maps/search/";

export interface OutwardLink {
  href: string;
  label: "Google Maps" | "Search Google Maps" | "OpenStreetMap" | "Wikipedia" | "Wikidata" | "Venue page";
}

/** Box with an arrow leaving the top-right corner. Decorative; the link text stays the name. */
export const EXTERNAL_ICON_PATH = "M6.2 3.4H3.4v9.2h9.2V9.8M8.2 3.4h4.4V7.8M12.3 3.7 6.6 9.4";

/** A stored listing stays "Google Maps". Everything else is a name-and-area search. */
export function onwardLink(place: { name: string; area: string; mapsUrl: string | null }): OutwardLink {
  if (place.mapsUrl) return { href: place.mapsUrl, label: "Google Maps" };
  const url = new URL(GOOGLE_SEARCH);
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${place.name}, ${place.area}, Pune`);
  return { href: url.toString(), label: "Search Google Maps" };
}

/** The coordinate source, as a link rather than a sentence. */
export function evidenceLink(coordUrl: string): OutwardLink {
  const host = new URL(coordUrl).hostname;
  if (host === "www.openstreetmap.org") return { href: coordUrl, label: "OpenStreetMap" };
  if (host.endsWith("wikipedia.org")) return { href: coordUrl, label: "Wikipedia" };
  if (host === "www.wikidata.org") return { href: coordUrl, label: "Wikidata" };
  return { href: coordUrl, label: "Venue page" };
}
