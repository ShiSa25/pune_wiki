# Map

The page uses [MapLibre GL JS](https://maplibre.org/) (open source) with the public [OpenFreeMap](https://openfreemap.org/) Positron style:

`https://tiles.openfreemap.org/styles/positron`

OpenFreeMap states that the public instance needs no account, no API key, and no usage cap, and that commercial use is allowed. The loaded tile source is `https://tiles.openfreemap.org/planet`. On 8 November 2026 its TileJSON `attribution` field was exactly:

`<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>`

MapLibre puts that one source string in the single corner control. The style file itself has no separate attribution, and the Natural Earth raster source has none, so nothing else is merged in.

The corner cannot be only “Data from OpenStreetMap”:

- [OpenStreetMap’s attribution guideline](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) requires a visible credit to OpenStreetMap, with the words linking to [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright). “Data from OpenStreetMap” is the form already in the TileJSON.
- [OpenMapTiles’ licence](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md) puts the schema’s design under CC BY 4.0 and says a browsable map derived from that schema must credit OpenMapTiles, with a link to openmaptiles.org, in the corner of the map. OpenFreeMap says the schema of these tiles is unmodified OpenMapTiles, so that credit stays.
- [OpenFreeMap’s own page](https://openfreemap.org/) says attribution is required, quotes the full line for clients that do not add it automatically, and then says: “You do not need to display the OpenFreeMap part, but it is nice if you do.”

The page therefore drops only the OpenFreeMap name from that TileJSON string. The corner that remains is “© OpenMapTiles” linked to openmaptiles.org, then “Data from OpenStreetMap” linked to the copyright page. Tiles still come from the same OpenFreeMap host. There is still one attribution control.

## Why not the other familiar options

`tile.openstreetmap.org` is the OSMF raster service. Its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) says the data is free and the tile servers are not an unlimited backend. It forbids bulk download and prefetch, requires a visible OpenStreetMap attribution, and forbids a Referrer-Policy that strips the `Referer` header on those tile requests. A small invite-only page could technically comply, but the policy also says access can be withdrawn. This guide does not use that host.

blr.wiki’s map credits CARTO as well as OpenStreetMap. That shows which tiles that site requested. It is not a licence to copy their tile URL. CARTO’s hosted basemaps are a separate service with their own account terms, so they are not used here.

A pin is not taken from a Google Maps listing. A listing link is only a way out to Google. A stored point has to come from one of these, checked on 7 November 2026. If that source publishes the same numbers as a Google listing, the pin stays: the check is the source, not whether the digits differ.

- An OpenStreetMap element whose name and area match the branch. One Overpass query, plus two smaller follow-ups, were run once while editing, with a User-Agent naming this guide. That is inside the public Overpass one-off allowance (well under 10,000 queries or 1 GB a day). The site does not call Overpass when someone opens the page. See the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) instances and their limits.
- A coordinate the venue publishes on its own site (schema.org `GeoCoordinates`, or the business location on that site).
- A Wikipedia article coordinate for that exact place.

No Nominatim request is made. Points outside Pune and PCMC are dropped. The map’s opening view is a city camera, not a venue. A place with no allowed coordinate is not shown. Those names are in `docs/backlog.md`. The visible list is 50 places, and every one has coordinate evidence. Counts below are that list, not a quota.

Donna Cucina’s own site publishes a schema.org point that matches its Google listing number. That pin is kept, and the coordinate URL is the venue site. Cafe Goodluck is OpenStreetMap node 1534457948 at Good Luck Chowk, not the road of the same name and not the Baner outlet. The Pu La Deshpande pin is the centre of way 197954185, the park tagged as the Pune-Okayama Friendship Garden. A proposed metro station also named Deshpande Udyan is not used. The heritage-walk pin was Delhi Darwaja, the gate the PMC page names as the assembly point, not the whole route and not the Shaniwar Wada relation. That walk left the active list on 8 November 2026. The record of the pin stays in `docs/maps-links.md`.

The visible list stopped at 50. Eleven researched replacements, each an OpenStreetMap node for that branch, took the place of the fourteen names that still had no allowed coordinate. Those fourteen are in `docs/backlog.md`, not on the page. Building, gate, and park-centre dots say so in the popup and in Notes. A restaurant node with no street tag says which road was nearby, or that none was.

## Practical limits

- Tiles load for the current view only. There is no offline download and no prefetch of the city.
- MapLibre asks the browser for `https://tiles.openfreemap.org/…` (style, vector tiles, fonts, sprites). Do not put a page-level `Referrer-Policy: no-referrer` in front of that host. `rel="noreferrer"` on ordinary links does not apply to those tile requests.
- OpenFreeMap does not offer an SLA. If the style or tiles fail, the page keeps the list and says the tiles did not load. If the map cannot start, the list stays and a banner says the map did not start.
- A host content-security policy needs `connect-src` and `img-src` for `https://tiles.openfreemap.org`, and `worker-src 'self'` because the page sets MapLibre’s worker to the bundled `maplibre-gl-worker` file. This repository does not send a CSP header. The map credit is the one control inside the map, kept in the first screen by sizing the map to the space under the header.
- Google star ratings and review counts from the research snapshots are not stored in the guide. Republishing scraped Maps metrics is a terms risk. The listing link is the way to see the current number.

Labels are white pills. At a wide view they collide: overlapping names are hidden and a coloured dot stays on the coordinate, so the place is still visible. Zooming or selecting a card brings the name back. The selected pill is kept even when it overlaps. A card with no verified point says so and does not drop a marker.
