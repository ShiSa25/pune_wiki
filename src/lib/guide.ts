import { z } from "zod";
import raw from "../content/guide.json";
import { inPuneBox, placeGeometry } from "./coords";

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
    dish: z.string().min(2).nullable(),
    flag: z.string().min(8).nullable(),
    address: z.string().min(8).nullable(),
    mapsUrl: mapsUrl.nullable(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    pin: z.literal("maps-place-geometry").nullable(),
    sources: z.array(z.object({ title: z.string().min(3), url: httpUrl }).strict()).min(1),
  })
  .strict()
  .superRefine((place, context) => {
    const pinned = place.pin === "maps-place-geometry";
    if (pinned !== (place.lat !== null && place.lng !== null)) {
      context.addIssue({ code: "custom", message: `${place.id} pin and coordinates disagree` });
    }
    if (!pinned) return;
    const geometry = placeGeometry(place.mapsUrl ?? "");
    if (!geometry || geometry.lat !== place.lat || geometry.lng !== place.lng) {
      context.addIssue({ code: "custom", message: `${place.id} coordinates are not the listing geometry` });
    }
    if (!inPuneBox(geometry!)) {
      context.addIssue({ code: "custom", message: `${place.id} is outside the Pune box` });
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
      if (!ids.has(place.section)) {
        context.addIssue({ code: "custom", message: `${place.id} has an unknown section` });
      }
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
