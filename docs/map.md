# Map

The page uses [MapLibre GL JS](https://maplibre.org/) (open source) with the public [OpenFreeMap](https://openfreemap.org/) Positron style:

`https://tiles.openfreemap.org/styles/positron`

OpenFreeMap states that the public instance needs no account, no API key, and no usage cap, and that commercial use is allowed. Attribution has to stay visible. Their wording is “OpenFreeMap © OpenMapTiles Data from OpenStreetMap”. That text is the one MapLibre attribution control inside the map. There is no second credit under the map. The links go to [openfreemap.org](https://openfreemap.org/), [OpenMapTiles](https://openmaptiles.org/), and the [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) page.

## Why not the other familiar options

`tile.openstreetmap.org` is the OSMF raster service. Its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) says the data is free and the tile servers are not an unlimited backend. It forbids bulk download and prefetch, requires a visible OpenStreetMap attribution, and forbids a Referrer-Policy that strips the `Referer` header on those tile requests. A small invite-only page could technically comply, but the policy also says access can be withdrawn. This guide does not use that host.

blr.wiki’s map credits CARTO as well as OpenStreetMap. That shows which tiles that site requested. It is not a licence to copy their tile URL. CARTO’s hosted basemaps are a separate service with their own account terms, so they are not used here.

A pin is not taken from a Google Maps listing. A listing link is only a way out to Google. A stored point has to come from one of these, checked on 7 November 2026. If that source publishes the same numbers as a Google listing, the pin stays: the check is the source, not whether the digits differ.

- An OpenStreetMap element whose name and area match the branch. One Overpass query, plus two smaller follow-ups, were run once while editing, with a User-Agent naming this guide. That is inside the public Overpass one-off allowance (well under 10,000 queries or 1 GB a day). The site does not call Overpass when someone opens the page. See the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) instances and their limits.
- A coordinate the venue publishes on its own site (schema.org `GeoCoordinates`, or the business location on that site).
- A Wikipedia article coordinate for that exact place.

No Nominatim request is made. Points outside Pune and PCMC are dropped. The map’s opening view is a city camera, not a venue. Places without one of those sources stay on the list and say “No verified pin”. Counts in this file are whatever `src/content/guide.json` says after the last edit; the tests read that file rather than a copied total.

Donna Cucina’s own site publishes a schema.org point that matches its Google listing number. That pin is kept, and the coordinate URL is the venue site. Cafe Goodluck is OpenStreetMap node 1534457948 at Good Luck Chowk, not the road of the same name and not the Baner outlet. The Pu La Deshpande pin is the centre of way 197954185, the park tagged as the Pune-Okayama Friendship Garden. A proposed metro station also named Deshpande Udyan is not used. The heritage-walk pin is Delhi Darwaja, the gate the PMC page names as the assembly point, not the whole route and not the Shaniwar Wada relation.

A name search of the Pune box, plus venue pages, did not find an element for these branches: The Place, Poona Guest House, Badshahi Boarding House, Shri Krishna Bhuvan, Newale Misal, Gatti Chutney in Koregaon Park, Aragma, Farro, Nanna’s Negroni, Bai Mu Dan, Godaam, Kumaradhara, Gujar Cold Drink House, and Elephant & Co. in Kalyani Nagar. An Elephant & Co. pub on OSM is in Baner, so it is not used. Kaka Halwai nodes in Bavdhan, on Sinhagad Road, and on other streets were not used; the pin is the confectionery node beside Lokmanya Tilak Marg. Doolally is pinned to The KOPA mall node, and Independence Brewing’s Kalyani room is pinned to the Mulik Palace node named in its address. Neither of those is a separate restaurant node.

## Practical limits

- Tiles load for the current view only. There is no offline download and no prefetch of the city.
- MapLibre asks the browser for `https://tiles.openfreemap.org/…` (style, vector tiles, fonts, sprites). Do not put a page-level `Referrer-Policy: no-referrer` in front of that host. `rel="noreferrer"` on ordinary links does not apply to those tile requests.
- OpenFreeMap does not offer an SLA. If the style or tiles fail, the page keeps the list and says the tiles did not load. If the map cannot start, the list stays and a banner says the map did not start.
- A host content-security policy needs `connect-src` and `img-src` for `https://tiles.openfreemap.org`, and `worker-src 'self'` because the page sets MapLibre’s worker to the bundled `maplibre-gl-worker` file. This repository does not send a CSP header. The map credit is the one control inside the map, kept in the first screen by sizing the map to the space under the header.
- Google star ratings and review counts from the research snapshots are not stored in the guide. Republishing scraped Maps metrics is a terms risk. The listing link is the way to see the current number.

Labels are white pills. At a wide view they collide: overlapping names are hidden and a coloured dot stays on the coordinate, so the place is still visible. Zooming or selecting a card brings the name back. The selected pill is kept even when it overlaps. A card with no verified point says so and does not drop a marker.
