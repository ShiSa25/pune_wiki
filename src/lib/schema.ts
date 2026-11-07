import { z } from "zod";
import { categoryIds } from "./categories";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sourceSchema = z
  .object({
    title: z.string().min(3),
    url: z.url(),
    checkedOn: day,
    usedFor: z.string().min(8),
  })
  .strict();

export const venueReportedSchema = z
  .object({
    label: z.string().min(3),
    value: z.string().min(3),
    sourceUrl: z.url(),
    checkedOn: day,
  })
  .strict();

export const placeSchema = z
  .object({
    slug,
    name: z.string().min(2),
    nameMarathi: z.string().min(1).optional(),
    category: z.enum(categoryIds),
    area: z.string().min(2),
    areaSlug: slug,
    summary: z.string().min(40).max(240),
    note: z.string().min(80),
    mapsQuery: z.string().min(8),
    aliases: z.array(z.string().min(2)).min(1),
    sort: z.number().int().positive(),
    editorVisit: z.literal(false),
    verification: z.literal("source-checked"),
    known: z.array(z.string().min(12)).min(2),
    omitted: z.array(z.string().min(12)).min(1),
    venueReported: z.array(venueReportedSchema),
    sources: z.array(sourceSchema).min(1),
    recheck: z.array(sourceSchema),
    updatedOn: day,
  })
  .strict();

export const pairingSchema = z
  .object({
    slug,
    title: z.string().min(3),
    suits: z.string().min(20),
    stops: z.array(slug).min(2).max(3),
    assumption: z.string().min(20),
    limit: z.string().min(40),
    sort: z.number().int().positive(),
  })
  .strict();

export const placesFileSchema = z
  .object({
    places: z.array(placeSchema).min(12),
  })
  .strict();

export const pairingsFileSchema = z
  .object({
    pairings: z.array(pairingSchema).min(2).max(3),
  })
  .strict();

export type Place = z.infer<typeof placeSchema>;
export type Pairing = z.infer<typeof pairingSchema>;
export type Source = z.infer<typeof sourceSchema>;
