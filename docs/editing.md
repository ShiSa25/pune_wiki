# Editing the guide

Places and pairings are JSON in git. A schema check fails the build and the test run when a record is incomplete or invents a field the guide does not allow.

## Files

- `src/content/places.json` — one object per place, inside `places`.
- `src/content/pairings.json` — two or three pairings that point at place slugs.
- `src/lib/schema.ts` — the allowed fields.
- `src/lib/categories.ts` — the five categories and their one-line introductions.

Do not add a backend, an account, or a form that claims to save a correction. The corrections pages only prepare text for a person to copy.

## Place fields

| Field | What to put |
| --- | --- |
| `slug` | Lowercase words separated by hyphens. Must be unique. Becomes the URL. |
| `name` | The name a visitor should look for. If a brand has several branches, name the branch. |
| `nameMarathi` | Optional. Omit rather than guess a spelling. |
| `category` | `food`, `coffee`, `outings`, `culture`, or `escapes`. |
| `area` / `areaSlug` | The neighbourhood the source actually supports. `areaSlug` is the URL piece. |
| `summary` | One original sentence, 40–240 characters. No rating and no “hidden gem”. |
| `note` | A short original paragraph. Say what was read. Do not paste the source. |
| `mapsQuery` | Name plus the checked address, including Pune. This becomes a Maps search link. Do not add coordinates. |
| `aliases` | Extra words search should match: old spellings, the road, the dish name if the source names it. |
| `sort` | Order inside the category. Lower comes first. |
| `editorVisit` | Must stay `false` until Shiva records a real visit. Then change the schema on purpose; do not flip this to pretend. |
| `verification` | `source-checked` for this version. |
| `known` | Facts you can point at a source for. |
| `omitted` | Useful things you refused to guess: hours, prices, access, parking. |
| `venueReported` | Only for a fact printed by the venue, with that page’s URL and the day you read it. Empty array if you are not showing one. |
| `sources` | Title, URL, `checkedOn` (`YYYY-MM-DD`), and `usedFor`. |
| `recheck` | Links a visitor should open again, such as a notices index. Say that you did not confirm an order. |
| `updatedOn` | The day this record was edited. Do not bump it just because the site rebuilt. |

## What not to add

- Hours, prices, “best time”, travel times, parking, wheelchair access, closures, or coordinates you did not read in a source that day.
- A star rating, a copied review, or a photo you do not have rights to.
- “I visited” or “we visited” unless a named person did, with a date.
- A second branch under the first branch’s name.
- For forts: a trail, a night plan, a monsoon plan, or a sentence that says the gate is open today. If the sources disagree about distance, say they disagree.
- A pairing that needs a travel time or a routing engine. Two or three stops, each already a place, with an assumption and a limit.

## Pairing fields

`stops` is an ordered list of two or three slugs. `assumption` says why they belong together and what was not measured. `limit` says what would make the pairing a bad idea, including a closed venue.

## Check

```bash
npm test
npm run check
npm run lint
npm run build
```

`npm test` covers search, category, neighbourhood, reset, empty combinations, and the content rules. Read the rendered place page before treating a new card as done. The dev server does not prove a venue is open.
