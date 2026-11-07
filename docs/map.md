# Map

The page uses [MapLibre GL JS](https://maplibre.org/) (open source) with the public [OpenFreeMap](https://openfreemap.org/) Positron style:

`https://tiles.openfreemap.org/styles/positron`

OpenFreeMap states that the public instance needs no account, no API key, and no usage cap, and that commercial use is allowed. Attribution has to stay visible. Their wording is “OpenFreeMap © OpenMapTiles Data from OpenStreetMap”. The map control and the line under the map both say that, with links to [openfreemap.org](https://openfreemap.org/), [OpenMapTiles](https://openmaptiles.org/), and the [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) page.

## Why not the other familiar options

`tile.openstreetmap.org` is the OSMF raster service. Its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) says the data is free and the tile servers are not an unlimited backend. It forbids bulk download and prefetch, requires a visible OpenStreetMap attribution, and forbids a Referrer-Policy that strips the `Referer` header on those tile requests. A small invite-only page could technically comply, but the policy also says access can be withdrawn. This guide does not use that host.

blr.wiki’s map credits CARTO as well as OpenStreetMap. That shows which tiles that site requested. It is not a licence to copy their tile URL. CARTO’s hosted basemaps are a separate service with their own account terms, so they are not used here.

No Nominatim lookup is made. Pins come only from the `!8m2!3d…!4d…` point in a Google Maps listing URL that was opened on 7 November 2026. A URL that only has an `@lat,lng` camera is not a pin. Points outside Pune and PCMC are dropped. The map’s opening view is a city camera, not a venue.

## Practical limits

- Tiles load for the current view only. There is no offline download and no prefetch of the city.
- MapLibre asks the browser for `https://tiles.openfreemap.org/…` (style, vector tiles, fonts, sprites). Do not put a page-level `Referrer-Policy: no-referrer` in front of that host. `rel="noreferrer"` on ordinary links does not apply to those tile requests.
- OpenFreeMap does not offer an SLA. If the style or tiles fail, the page keeps the list and says the tiles did not load.
- A host content-security policy needs `connect-src` for `https://tiles.openfreemap.org`, `worker-src blob:`, and `img-src` for the sprite images on that host. This repository does not send a CSP header.
- Google star ratings and review counts from the research snapshots are not stored in the guide. Republishing scraped Maps metrics is a terms risk. The listing link is the way to see the current number.

Pins are a subset of the list. A card with no verified point says so and does not drop a marker.
