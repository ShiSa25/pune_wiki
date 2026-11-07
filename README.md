# pune_wiki
pune guide

# pune

A short, category-first guide to Pune for a weekend, a date, or a first day in the city. The list is source-checked editorial copy: iconic food, one named coffee branch, easy outings, culture, and two nearby escapes. It links out to Google Maps. It does not drop its own pins.

No domain is configured. The pages send `noindex` until there is a real decision about where they should live.

## Run locally

Requires Node 22 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

```bash
npm test          # search, filters, reset, content rules
npm run check     # Astro and TypeScript
npm run lint      # ESLint on src and tests
npm run build     # static production build
npm run preview   # serve the build on port 4173
```

## Edit a place

1. Edit `src/content/places.json`, or `src/content/pairings.json` for a two-stop note.
2. Follow `docs/editing.md`. The schema is `src/lib/schema.ts`.
3. Run `npm test` and `npm run build`.
4. Read the place page. Unknown hours, prices, access, and coordinates stay blank.

Corrections pages prepare a note to copy. They do not send or store it.

## Still needs a local pass

Every card is **source-checked** against the linked page on 7 November 2026, and **not personally visited**. Shiva has not confirmed a favourite, a gate, or a meal. In particular:

- Sinhagad’s current access, fees, and whether the road or a trail is open were not established. The entry is history plus that limit.
- Venue-stated hours (Kayani, Empress Garden, Dagdusheth) can change, especially around festivals.
- Aga Khan Palace hours and ticket prices were left out because public pages disagreed.
- Map links are searches, not surveyed pins. Confirm the listing when a name has more than one branch.
- Search plus category plus neighbourhood runs in the browser. Without JavaScript, the category and neighbourhood pages still list their places, and the full list is on the home page.

Nothing here is deployed. A local preview is not a public launch.
