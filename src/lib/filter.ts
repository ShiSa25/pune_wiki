import { categoryLabel, type CategoryId } from "./categories";

export interface SearchRecord {
  slug: string;
  name: string;
  nameMarathi: string;
  category: CategoryId;
  area: string;
  areaSlug: string;
  summary: string;
  aliases: string[];
}

export interface FilterState {
  query: string;
  category: string;
  area: string;
}

export const emptyFilter: FilterState = { query: "", category: "", area: "" };

export function normalizeQuery(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").trim().replace(/\s+/g, " ");
}

export function haystack(record: SearchRecord): string {
  return normalizeQuery(
    [
      record.name,
      record.nameMarathi,
      record.area,
      record.areaSlug.replaceAll("-", " "),
      categoryLabel(record.category),
      record.category,
      record.summary,
      ...record.aliases,
    ].join(" \n "),
  );
}

export function filterPlaces(records: readonly SearchRecord[], state: FilterState): SearchRecord[] {
  const query = normalizeQuery(state.query);
  return records.filter((record) => {
    if (state.category && record.category !== state.category) return false;
    if (state.area && record.areaSlug !== state.area) return false;
    if (!query) return true;
    return haystack(record).includes(query);
  });
}

export function sanitizeFilter(state: FilterState, records: readonly SearchRecord[]): FilterState {
  const categories = new Set(records.map((record) => record.category));
  const areas = new Set(records.map((record) => record.areaSlug));
  return {
    query: state.query,
    category: categories.has(state.category as CategoryId) ? state.category : "",
    area: areas.has(state.area) ? state.area : "",
  };
}

export function filterStateFromParams(params: URLSearchParams): FilterState {
  return {
    query: params.get("q") ?? "",
    category: params.get("category") ?? "",
    area: params.get("area") ?? "",
  };
}

export function paramsFromFilter(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.area) params.set("area", state.area);
  const query = state.query.trim();
  if (query) params.set("q", query);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function describeFilter(
  state: FilterState,
  areaLabel: (slug: string) => string,
): string {
  const parts: string[] = [];
  if (state.category) parts.push(categoryLabel(state.category));
  if (state.area) parts.push(`in ${areaLabel(state.area)}`);
  const query = state.query.trim();
  if (query) parts.push(`matching “${query}”`);
  return parts.length > 0 ? parts.join(" ") : "All places";
}

/** Empty-state sentence. A query-only description already starts with “matching”. */
export function emptyFilterMessage(described: string): string {
  const detail = described.startsWith("matching ") ? described.slice("matching ".length) : described;
  return `No place matches ${detail}. Clear the filters to see every place.`;
}
