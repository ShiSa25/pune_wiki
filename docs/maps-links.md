# Google Maps listing audit

Checked on 8 November 2026. A card or popup says “Google Maps” only when `mapsUrl` is a `https://www.google.com/maps/place/…` listing. Those links are not used as the map pin. Coordinates stay on the OpenStreetMap, venue, or Wikipedia source already stored.

## Already stored

22 places already had a `/maps/place/` listing with a Google place id in the `data` parameter. Those URLs were left as they were.

## Resolved from the public Maps page

The other listings were opened in a browser from a name-and-area search. A result was kept only when Google landed on one place page, the place name matched the branch, and the listing sat near the existing pin. The pin itself was not replaced with the Google coordinate.

| Place | Check |
| --- | --- |
| Dorabjee & Sons | Place page, about 2 m from the OSM node |
| George Restaurant | Place page, about 11 m |
| Marz-O-Rin | Place page, about 10 m |
| Roopali | Place page “Roopali Hotel”, about 9 m |
| Vaidya Upahar Gruha | Place page, about 20 m |
| Malaka Spice | Place page, about 21 m |
| Savya Rasa | Place page, about 1 m |
| Le Plaisir | Place page on Prabhat Road (Rajkamal, opposite Cox and Kings). Google’s pin is about 420 m from the OSM node; the address is the Prabhat Road room, not another branch |
| Pagdandi Books Chai Cafe | Place page “Pagdandi Coffee”, about 15 m |
| Kaka Halwai Sweet Centre | Place id `0x3bc2c3323455ed81:0xaa7847d8e210803a`, about 6 m from the Tilak Road node. Other Kaka Halwai shops in the search (FC Road, Karve Road, Satara Road, Nagar Road) were not used |
| 1000 Oaks | Place page, about 24 m |
| Al Di La | Place page for the bar, about 26 m from the Conrad node |
| Grandmama's Cafe | Place page named Koregaon Park, Lane No. 8. Google’s pin is about 430 m from the OSM node; the Baner room was not used |
| Aasmana | Place page, about 110 m from the Ritz-Carlton point |
| Joshi's Miniature Railways | Place page, 17/1 B/2 Late GA Kulkarni Path, Kothrud, about 20 m |
| Shaniwar Wada | Place page, about 23 m |
| SP's Biryani House | Place page, about 3 m |
| Asha Dining Hall | Place page, about 21 m |
| Durvankur Dining Hall | Place page, about 8 m |
| Prem's | Place page “Prem's Restaurant”, about 17 m from the Koregaon Park node |
| Wadeshwar | Place page, about 33 m from the FC Road node |
| Santé Spa Cuisine | Place page for the Koregaon Park room (1st Lane, Vasani Nagar). Google’s pin is about 440 m from the OSM node; the Baner way was not used |
| Blue Tokai, Ghole Road | Place page named Ghole Road, about 9 m |
| Chitale Bandhu, Bajirao Road | Place page, about 5 m |
| The French Window Patisserie | Place page, about 14 m |
| High Spirits Cafe | Place page, about 92 m |
| Sinhagad Fort | Place page, about 140 m from the fort node |
| Khadakwasla Dam | Place page for the dam, about 280 m from the dam-wall pin |

## Unresolved

These stay without a Maps link. A search URL is not labelled “Google Maps”.

- **Blue Nile.** The public Maps results that came up were the Bund Garden Road room, about 2.2 km from the Camp pin. That is a different branch.
- **PMC Heritage Walk.** Searches for the walk and for Delhi Darwaja landed on Shaniwar Wada or on other gates (Narayan, Mastani, Ganesh), not on a listing for this walk or for Delhi Darwaja itself.
