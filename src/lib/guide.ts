import { z } from "zod";
import raw from "../content/guide.json";
import { inPuneBox } from "./coords";

const httpUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
}, "Use an http or https URL without credentials");

const mapsUrl = httpUrl.refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    (url.hostname === "www.google.com" || url.hostname === "maps.google.com") &&
    (url.pathname === "/maps" || url.pathname.startsWith("/maps/"))
  );
}, "Use a https Google Maps listing URL");

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sectionSchema = z
  .object({
    id: z.string().regex(/^[a-z]+$/),
    label: z.string().min(3),
    dek: z.string().min(12),
    color: z.string().regex(/^#[0-9a-f]{6}$/),
  })
  .strict();

export const placeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(2),
    section: z.string(),
    kind: z.string().min(2),
    area: z.string().min(2),
    line: z.string().min(8),
    summary: z.string().min(12).max(140),
    dish: z.string().min(2).nullable(),
    flag: z.string().min(8).nullable(),
    address: z.string().min(8).nullable(),
    aliases: z.array(z.string().min(1)).optional(),
    mapsUrl: mapsUrl.nullable(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    pin: z.enum(["osm", "venue", "wikipedia"]).nullable(),
    pinNote: z.string().min(12).nullable(),
    coordUrl: httpUrl.nullable(),
    coordTitle: z.string().min(8).nullable(),
    coordCheckedOn: day.nullable(),
    sources: z
      .array(
        z
          .object({
            title: z.string().min(3),
            url: httpUrl,
            type: z.string().min(3),
            checkedOn: day,
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((place, context) => {
    if (place.pin === null || place.lat === null || place.lng === null || !place.coordUrl || !place.coordTitle || !place.coordCheckedOn) {
      context.addIssue({ code: "custom", message: `${place.id} is on the list without coordinate evidence` });
      return;
    }
    if (!inPuneBox({ lat: place.lat, lng: place.lng })) {
      context.addIssue({ code: "custom", message: `${place.id} is outside the Pune box` });
    }
    const host = new URL(place.coordUrl).hostname;
    if (place.pin === "osm" && host !== "www.openstreetmap.org") {
      context.addIssue({ code: "custom", message: `${place.id} OSM pin needs an openstreetmap.org URL` });
    }
    if (place.pin === "wikipedia" && !host.endsWith("wikipedia.org") && host !== "www.wikidata.org") {
      context.addIssue({ code: "custom", message: `${place.id} Wikipedia pin needs a wikipedia.org or wikidata.org URL` });
    }
    if (place.pin === "venue" && (host === "www.google.com" || host === "maps.google.com" || host.endsWith("googleusercontent.com"))) {
      context.addIssue({ code: "custom", message: `${place.id} venue pin cannot cite Google` });
    }
    if (/\b(osm|lbb|elle|schema\.org|wikidata)\b|this pin|city search|named on|first-party|official site|node records|\bper\s+[a-z]/i.test(place.summary)) {
      context.addIssue({ code: "custom", message: `${place.id} summary leaks research method` });
    }
  });

export const guideSchema = z
  .object({
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sections: z.array(sectionSchema).length(8),
    places: z.array(placeSchema).min(50).max(60),
  })
  .strict()
  .superRefine((guide, context) => {
    const ids = new Set(guide.sections.map((section) => section.id));
    const seen = new Set<string>();
    for (const place of guide.places) {
      if (!ids.has(place.section)) context.addIssue({ code: "custom", message: `${place.id} has an unknown section` });
      if (seen.has(place.id)) context.addIssue({ code: "custom", message: `duplicate ${place.id}` });
      seen.add(place.id);
    }
    for (const id of ids) {
      if (!guide.places.some((place) => place.section === id)) {
        context.addIssue({ code: "custom", message: `empty section ${id}` });
      }
    }
  });

export type Section = z.infer<typeof sectionSchema>;
export type Place = z.infer<typeof placeSchema>;
export type Guide = z.infer<typeof guideSchema>;

export const guide: Guide = guideSchema.parse(raw);
export const sections = guide.sections;
export const places = guide.places;

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
export const TILE_HOST = "tiles.openfreemap.org";

export function placesIn(sectionId: string): Place[] {
  return places.filter((place) => place.section === sectionId);
}
