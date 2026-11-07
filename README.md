# pune_wiki
pune guide

# pune

One page of Pune places, laid out as a list beside a map. The wording is local. The visual reference is a light card list with section chips and a sticky map.

`noindex` stays. Who can open a hosted link is the host’s setting, not something this page enforces.

The map is MapLibre plus OpenFreeMap. See `docs/map.md`. Pins come from OpenStreetMap, a venue’s own page, or a Wikipedia article. They are not copied from Google Maps. Google star ratings are not stored.

## Run locally

Requires Node 22 or newer.

```bash
npm install
npm run dev
```

The dev server prints its own local URL. `npm run preview` serves the production build on port 4173.

```bash
npm test          # search, filters, reset, content rules
npm run check     # Astro and TypeScript
npm run lint      # ESLint on src and tests
npm run build     # static production build
npm run preview   # serve the build on port 4173
```

## Edit a place

Places live in `src/content/guide.json`. The checks are in `src/lib/guide.ts`. Every place on the page needs `lat`, `lng`, `pin` (`osm`, `venue`, or `wikipedia`), and `coordUrl` for that source. A name with no such source stays in `docs/backlog.md` instead of appearing as an empty pin. Do not paste a coordinate out of a Google Maps link, and do not invent a listing id. A stored listing is labelled “Google Maps”. A place without one gets “Search Google Maps”, built from the name and area. The coordinate source is a separate link, “OpenStreetMap”, “Wikipedia”, or “Venue page”. The card face is `summary`. Method and branch caveats stay in Notes. A dot that marks a building, a gate, or a park centre says so in `pinNote`.

`npm test` checks the list size, the sources, and that stored points are not the Google listing geometry. `docs/map.md` covers tiles, attribution, and the content-security hosts.

Nothing here is deployed. A local preview is not a public launch.
