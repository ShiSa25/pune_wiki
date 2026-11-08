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

## Resolved on a second pass

These two had no link after the first pass. Both now have a direct destination. Neither pin was moved, and neither URL is a `/maps/search/` query.

### Blue Nile

Opened 8 November 2026. A search for “Blue Nile Pune” lands on one place page, not a list of branches:

`https://www.google.com/maps/place/Blue+Nile/@18.5218633,73.8774587,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc2c05074135b17:0xa422fee8ff1347dd!8m2!3d18.5218633!4d73.8774587!16s%2Fg%2F1w0j2n91`

The page is titled Blue Nile, a biryani restaurant, at 102, Bund Garden Rd, Agarkar Nagar, Pune, Maharashtra 411001, phone +91 20 2612 5238. That phone and the Bund Garden Road, opposite Poona Club, Camp address are the same restaurant on the restaurant’s Facebook page and on Justdial (Justdial writes the door as Survey No 4/102). Sahapedia describes the same room: opposite Poona Club on Bund Garden Road in Camp. Zomato and Swiggy print the door as 4, Bund Garden Road.

The listing geometry inside the URL is 18.5218633, 73.8774587. OpenStreetMap node 789623167 stays at 18.5217526, 73.8774667, about 12 metres away. Nominatim’s reverse lookup of that node is Bund Garden Road, way 215804387, whose nearby point is about 11 metres from the node. The node still has no street tag. An earlier note that the nearest named road was Vinod Pathak Path is out of date: that road’s OSM way is about 510 metres west. The Google coordinate is not copied onto our pin.

The first pass called a Bund Garden result “another branch, 2.2 km away”. This place page is the Camp room, and it sits on the existing pin. No second Blue Nile page came up.

### PMC Heritage Walk

The walk is a scheduled route. The PMC page says the starting point and the assembly point are Delhi Darwaja, Shaniwar Wada (`https://heritagewalk.pmc.gov.in/`). Our pin is already that gate: OpenStreetMap node 10696603208, Delhi Darwaja, 18.5200699, 73.8553009.

Searches on 8 November 2026 did not open a place page for this walk or for Delhi Darwaja in Pune.

- “Dilli Darwaza Shaniwar Wada” opened the Shaniwar Wada listing, whose geometry is 18.5195841, 73.8554208, about 55 metres from the gate node. That page is the fort, and the guide already links it from the Shaniwar Wada card.
- “Delhi Darwaja Pune” also listed Ganesh Darwaja and Narayan Darwaja Gate, other gates about 160 metres away, and a Delhi Darwaja whose geometry is 23.0377924, 72.5879413 on Mirzapur Road. That gate is in Ahmedabad.
- “PMC Heritage Walk Pune” listed private tours (The Western Routes, and a cultural walking tour). Those are not the PMC walk.

There is no named listing to attach. The card links to a coordinate pin for the gate we already verified, which Google opens as a dropped pin titled with that coordinate and plus code GVC4+24F. The URL has no place id:

`https://www.google.com/maps/place/18.5200699,73.8553009/@18.5200699,73.8553009,17z/data=!4m4!3m3!8m2!3d18.5200699!4d73.8553009`

The label on the card and the popup stays “Google Maps”. The `!8m2` pair is the same OpenStreetMap coordinate, written so the destination is that point rather than a camera over a search.

## Nightlife, 8 November 2026

Five new cards. Each outward link is the place page opened that day. The research note is `docs/nightlife.md`. The pin coordinates below are the OpenStreetMap ones, not the point encoded in the Maps URL.

| Place | Place id on the page | Page identity |
| --- | --- | --- |
| Ballr | `0x3bc2c1d21df8f8a1:0x92b7539c49c3c500` | Ballr - Pune, Mulik capital, opp. Trump Towers, Kalyani Nagar |
| Toy Room | `0x3bc2c16c3d9734d9:0x5b8a05b9f0105ac2` | TOYROOM CLUB PUNE, disco club, inside Sheraton Grand, Raja Bahadur Motilal Road |
| 2BHK Diner & Key Club | `0x3bc2c12f212fa8f3:0xfc8dc927cc331f63` | Unit 7, The Mills, behind Sheraton Grand |
| Millers The Luxury Club | `0x3bc2c1fe823b0ef3:0xa2169562d69ef196` | Millers The Luxury Club, beside Social, Sangamvadi, site millersluxuryclub.co.in |
| The Soundtrack Cafe | `0x3bc2b97f3d267e2f:0x124e7b5863c91db8` | The Soundtrack Cafe, Neco SkyPark, New DP Road, Vishal Nagar |
