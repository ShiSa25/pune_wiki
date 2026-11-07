# Map

The page uses [MapLibre GL JS](https://maplibre.org/) (open source) with the public [OpenFreeMap](https://openfreemap.org/) Positron style:

`https://tiles.openfreemap.org/styles/positron`

OpenFreeMap states that the public instance needs no account, no API key, and no usage cap, and that commercial use is allowed. Attribution has to stay visible. Their wording is “OpenFreeMap © OpenMapTiles Data from OpenStreetMap”. The map control and the line under the map both say that, with links to [openfreemap.org](https://openfreemap.org/), [OpenMapTiles](https://openmaptiles.org/), and the [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) page.

## Why not the other familiar options

`tile.openstreetmap.org` is the OSMF raster service. Its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) says the data is free and the tile servers are not an unlimited backend. It forbids bulk download and prefetch, requires a visible OpenStreetMap attribution, and forbids a Referrer-Policy that strips the `Referer` header on those tile requests. A small invite-only page could technically comply, but the policy also says access can be withdrawn. This guide does not use that host.

blr.wiki’s map credits CARTO as well as OpenStreetMap. That shows which tiles that site requested. It is not a licence to copy their tile URL. CARTO’s hosted basemaps are a separate service with their own account terms, so they are not used here.

Pins are not copied out of Google Maps URLs. Google’s terms do not allow those coordinates to be drawn on another provider’s map, so a listing link is only a way out to Google. A stored point has to come from one of these, checked on 7 November 2026:

- An OpenStreetMap element whose name and area match the branch. One Overpass query, plus two smaller follow-ups, were run once while editing, with a User-Agent naming this guide. That is inside the public Overpass one-off allowance (well under 10,000 queries or 1 GB a day). The site does not call Overpass when someone opens the page. See the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) instances and their limits.
- A coordinate the venue publishes on its own site (schema.org `GeoCoordinates`, or the business location on that site).
- A Wikipedia article coordinate for that exact place.

No Nominatim request is made. Points outside Pune and PCMC are dropped. The map’s opening view is a city camera, not a venue. Places without one of those sources stay on the list and say “No verified pin”. After this pass, 29 places have a pin and 24 do not. Donna Cucina publishes a schema.org point that is identical to the Google listing geometry, so that pin was not kept. Cafe Goodluck, Gatti Chutney in Koregaon Park, Doolally, and the Kalyani Nagar Independence room were not found as those branches in OpenStreetMap.

## Practical limits

- Tiles load for the current view only. There is no offline download and no prefetch of the city.
- MapLibre asks the browser for `https://tiles.openfreemap.org/…` (style, vector tiles, fonts, sprites). Do not put a page-level `Referrer-Policy: no-referrer` in front of that host. `rel="noreferrer"` on ordinary links does not apply to those tile requests.
- OpenFreeMap does not offer an SLA. If the style or tiles fail, the page keeps the list and says the tiles did not load.
- A host content-security policy needs `connect-src` and `img-src` for `https://tiles.openfreemap.org`, and `worker-src 'self'` because the page sets MapLibre’s worker to the bundled `maplibre-gl-worker` file. This repository does not send a CSP header. The map credit is the one control inside the map, kept in the first screen by sizing the map to the space under the header.
- Google star ratings and review counts from the research snapshots are not stored in the guide. Republishing scraped Maps metrics is a terms risk. The listing link is the way to see the current number.

Labels are white pills. At a wide view they collide: overlapping names are hidden, and zooming or selecting a card brings a name back. The selected pill is kept even when it overlaps. A card with no verified point says so and does not drop a marker.
