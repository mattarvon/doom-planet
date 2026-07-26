// horror.js — the "haunted world" easter-egg layer. Real coordinates of
// horror-movie filming sites, cursed real places, and famous cryptid hotspots.
// Every marker opens the inspector with the actual folklore behind it.
// Companion to jason.js. Uses globals map, L, inspect.

let horrorLayer;

const HORROR_SITES = [
  // -------- HAUNTED PLACES / MOVIE HOUSES --------
  { key: "overlook", cat: "haunt", glyph: "🏨", lat: 40.3803, lon: -105.5194,
    name: "The Overlook Hotel", movie: "The Shining (1980)",
    real: "The Stanley Hotel · Estes Park, Colorado",
    lore: "Stephen King and his wife checked into room 217 of the Stanley Hotel in October 1974. They were the only guests as the hotel closed for winter. That night King dreamed his son was chased through empty corridors by a firehose come to life. He woke by the window with a cigarette, and the whole novel was there. Kubrick shot exteriors at Oregon's Timberline Lodge — but every haunt in the book lives here.",
    wiki: "https://en.wikipedia.org/wiki/Stanley_Hotel" },

  { key: "amityville", cat: "haunt", glyph: "🏚", lat: 40.6672, lon: -73.4128,
    name: "112 Ocean Avenue", movie: "The Amityville Horror (1979)",
    real: "108 Ocean Ave · Amityville, New York (renumbered)",
    lore: "November 13, 1974: Ronald DeFeo Jr. shot his parents and four siblings dead in their beds — all found lying face-down. Thirteen months later the Lutz family moved in and lasted 28 days before fleeing at 3:15 a.m., the same hour of the killings. Green slime, black flies in December, cloven hoofprints in the snow. The house still stands. It was renumbered from 112 to 108 to keep the tourists moving.",
    wiki: "https://en.wikipedia.org/wiki/The_Amityville_Horror" },

  { key: "bates", cat: "slasher", glyph: "🔪", lat: 34.1401, lon: -118.3539,
    name: "Bates Motel", movie: "Psycho (1960)",
    real: "Universal Studios backlot · Los Angeles",
    lore: "Hitchcock built the Bates Motel and the Gothic house on the Universal backlot for $15,000. The house is a facade — only two sides finished, hollow behind. The shower scene took a week to film with 78 camera setups and a knife that never once touches Janet Leigh's skin. Mother is in the fruit cellar. She has been for a long time.",
    wiki: "https://en.wikipedia.org/wiki/Psycho_(1960_film)" },

  { key: "haddonfield", cat: "slasher", glyph: "🎃", lat: 34.1478, lon: -118.1445,
    name: "Haddonfield, Illinois", movie: "Halloween (1978)",
    real: "South Pasadena, California (filming)",
    lore: "October 31, 1963: a six-year-old Michael Myers walked upstairs and stabbed his sister to death with a kitchen knife. Sanitarium at Smith's Grove, fifteen years, until he stole a car and drove home. Carpenter shot the whole thing in South Pasadena — the Myers house at 1000 Mission Street, the Doyle house right around the corner. He was there, watching from the hedge. He is coming home.",
    wiki: "https://en.wikipedia.org/wiki/Halloween_(1978_film)" },

  { key: "elmst", cat: "slasher", glyph: "🧤", lat: 34.0862, lon: -118.3489,
    name: "1428 Elm Street", movie: "A Nightmare on Elm Street (1984)",
    real: "1428 N Genesee Ave · Los Angeles",
    lore: "Wes Craven read a Los Angeles Times series about Cambodian refugees who died in their sleep after describing recurring nightmares — some stayed awake for days rather than dream again. When they finally slept, they screamed and died. The house at 1428 N Genesee is a normal two-story on a leafy street. Nancy's bedroom is upstairs. One, two, Freddy's coming for you.",
    wiki: "https://en.wikipedia.org/wiki/A_Nightmare_on_Elm_Street" },

  { key: "woodsboro", cat: "slasher", glyph: "👻", lat: 38.6104, lon: -122.8697,
    name: "Woodsboro, California", movie: "Scream (1996)",
    real: "Santa Rosa & Healdsburg, California",
    lore: "'Do you like scary movies?' Craven filmed Casey Becker's opening at 1978 Kenwood Ct in Glen Ellen, the school scenes at Santa Rosa High, and the finale at the Spring Mountain Ranch house north of St. Helena. The Ghostface mask was pulled off a Fun World shelf mid-production. Sequels killed off Randy on rule three: never say you'll be right back.",
    wiki: "https://en.wikipedia.org/wiki/Scream_(1996_film)" },

  { key: "cabrini", cat: "haunt", glyph: "🐝", lat: 41.9002, lon: -87.6407,
    name: "Cabrini-Green", movie: "Candyman (1992)",
    real: "Former Cabrini-Green Homes · Chicago",
    lore: "Say his name five times into a mirror. Ruthie Jean was murdered in her Cabrini-Green apartment in 1987 — a killer came through a bullet hole in the bathroom wall from the empty unit next door, and the CHA blamed her for phoning too often. Clive Barker's Candyman moved the legend into these towers. The last high-rise fell in 2011. The name still travels.",
    wiki: "https://en.wikipedia.org/wiki/Candyman_(1992_film)" },

  { key: "poltergeist", cat: "haunt", glyph: "📺", lat: 34.2694, lon: -118.7756,
    name: "The Freeling House", movie: "Poltergeist (1982)",
    real: "4267 Roxbury St · Simi Valley, California",
    lore: "They're here. The house is real, a normal tract home in Simi Valley. The pool the family digs is where the studio buried the coffins on-set — real skeletons from a medical supply company because plastic ones cost more. Four people connected to the trilogy died young. Heather O'Rourke, who played Carol Anne, was 12. The Curse is a Hollywood story you tell in the dark. The pool is still there.",
    wiki: "https://en.wikipedia.org/wiki/Poltergeist_(1982_film)" },

  { key: "bodega", cat: "cryptid", glyph: "🐦", lat: 38.3333, lon: -123.0480,
    name: "Bodega Bay", movie: "The Birds (1963)",
    real: "Bodega Bay, California",
    lore: "August 18, 1961: thousands of sooty shearwaters flew into Capitola CA at night, smashed into houses, vomited anchovies onto lawns, and died in the streets. Hitchcock read the paper and started making phone calls. Two years later he pointed Tippi Hedren at Bodega Bay's schoolhouse — real building, real playground — and unleashed a week of live birds tied to her hair. The 2011 investigation blamed toxic algae. Or that's what they'd like you to think.",
    wiki: "https://en.wikipedia.org/wiki/The_Birds_(film)" },

  { key: "centralia", cat: "disaster", glyph: "🔥", lat: 40.8036, lon: -76.3411,
    name: "Centralia, Pennsylvania", movie: "Silent Hill (2006)",
    real: "Centralia, PA · burning since 1962",
    lore: "In May 1962 the borough burned trash in an abandoned strip-mine pit. The fire caught a coal seam and never went out. It has burned under Centralia for 63 years and could burn 250 more. The ground opens without warning; carbon monoxide rises through basements; the highway cracks steam. Most residents were bought out in the 90s. A handful still live there. The ZIP code was revoked in 2002. The postal service already knew what it was.",
    wiki: "https://en.wikipedia.org/wiki/Centralia,_Pennsylvania" },

  { key: "derry", cat: "cosmic", glyph: "🎈", lat: 44.8016, lon: -68.7712,
    name: "Derry, Maine (Bangor)", movie: "IT (1986)",
    real: "Bangor, Maine · Stephen King's hometown",
    lore: "Every 27 years something wakes up in the sewers under Bangor and eats. Stanley Uris opened the drain. Beverly heard the voices in the sink. Georgie chased his newspaper boat down Witcham Street and never came home. Bangor's storm drains are real; the standpipe on Thomas Hill is real; King's house on West Broadway sits between them. You'll float too.",
    wiki: "https://en.wikipedia.org/wiki/It_(novel)" },

  { key: "blairwitch", cat: "cosmic", glyph: "🌲", lat: 39.3878, lon: -77.6247,
    name: "Burkittsville, Maryland", movie: "The Blair Witch Project (1999)",
    real: "Burkittsville, MD (fictionalized)",
    lore: "The film's marketing claimed three student filmmakers vanished in 1994 in the woods around Burkittsville while shooting a documentary on a local witch. IMDb briefly listed them as 'missing, presumed dead.' Millions believed it. Residents put up signs asking press to stop knocking. The pile of stones outside the cabin — that's Elly Kedward's marker, folk story invented for the movie. It still gets fresh stones.",
    wiki: "https://en.wikipedia.org/wiki/The_Blair_Witch_Project" },

  { key: "mcmurdo", cat: "cosmic", glyph: "❄", lat: -77.8419, lon: 166.6863,
    name: "US Antarctic Outpost 31", movie: "The Thing (1982)",
    real: "McMurdo Station · Ross Island, Antarctica (nearest real base)",
    lore: "Carpenter filmed Outpost 31 in a refrigerated soundstage at ~40°F because the actors' breath had to be real. The dogs were real. The blood test scene is real terror, single take, each cast member handed a card with 'I'm the Thing' or 'I'm not' — no rehearsal. Nobody knows what came out of the ice. Nobody agrees who is still human at the end.",
    wiki: "https://en.wikipedia.org/wiki/The_Thing_(1982_film)" },

  // -------- REAL WORLD SITES --------
  { key: "chernobyl", cat: "disaster", glyph: "☢", lat: 51.4082, lon: 30.0563,
    name: "Pripyat / Chernobyl Zone",
    real: "Reactor 4 exploded 01:23:40 · 26 April 1986",
    lore: "Operators ran a safety test at the worst possible reactor state. Power dropped, the AZ-5 emergency shutdown was pushed, and the graphite tips of the control rods briefly INCREASED reactivity. The core reached maybe 30 GW, ten times its rated output, in four seconds. Two explosions blew the 2,000-ton lid off Reactor 4. 350,000 people evacuated. The Exclusion Zone is 2,600 km². Wolves have moved back. So have wild horses. The forest keeps growing. It does not stop.",
    wiki: "https://en.wikipedia.org/wiki/Chernobyl_disaster" },

  { key: "fukushima", cat: "disaster", glyph: "☢", lat: 37.4225, lon: 141.0328,
    name: "Fukushima Daiichi",
    real: "Reactors 1–3 melted down · 11 March 2011",
    lore: "A magnitude-9.1 quake off Tohoku sent a 14-meter wave into a plant designed for 5.7. Diesel generators drowned, cooling failed, three cores melted through their pressure vessels within days. Hydrogen explosions tore apart Units 1, 3, and 4. The exclusion zone runs 20 km. TEPCO is still storing over a million tons of tritium-contaminated water in blue tanks that cover the site like a bruise. Robots sent into Unit 2 died on contact with the radiation.",
    wiki: "https://en.wikipedia.org/wiki/Fukushima_nuclear_accident" },

  { key: "aokigahara", cat: "haunt", glyph: "🌲", lat: 35.4700, lon: 138.7100,
    name: "Aokigahara · Sea of Trees",
    real: "Base of Mt. Fuji, Japan",
    lore: "A 30-square-km old-growth forest on hardened lava from Mt. Fuji's 864 eruption. Roots grow above ground because they cannot crack the rock. Compasses spin from the iron in the basalt. It became known as a suicide destination in the 1960s after a novel ended there; authorities stopped publishing the annual count. Signs at the trailhead read 'your life is a precious gift.' Rangers walk the trails looking for tied-off ropes.",
    wiki: "https://en.wikipedia.org/wiki/Aokigahara" },

  { key: "catacombs", cat: "haunt", glyph: "💀", lat: 48.8339, lon: 2.3324,
    name: "Catacombs of Paris",
    real: "Ossuary beneath the 14th arrondissement · Paris",
    lore: "By 1780, Les Innocents cemetery in central Paris was so overstuffed that corpses fell through basement walls into wine cellars. The city moved 6 million bodies underground into abandoned limestone quarries. Femurs and skulls are stacked into decorative walls. The tunnels below Paris run 300 km. Cataphiles trespass them nightly. In 2004 police found a fully wired cinema in one chamber. When they returned three days later the equipment was gone and a note read 'do not try to find us.'",
    wiki: "https://en.wikipedia.org/wiki/Catacombs_of_Paris" },

  { key: "winchester", cat: "haunt", glyph: "🔫", lat: 37.3187, lon: -121.9506,
    name: "Winchester Mystery House",
    real: "525 S Winchester Blvd · San Jose, California",
    lore: "Sarah Winchester, widow of the rifle magnate, was told by a Boston medium she was cursed by the spirits of everyone killed by Winchester rifles. Building would appease them. She built for 38 years, 24 hours a day, until she died in 1922. 160 rooms. Staircases into ceilings. Doors that open onto walls. A window in a floor. Everything the number 13. She held nightly seances in a windowless room to ask the ghosts what to build next.",
    wiki: "https://en.wikipedia.org/wiki/Winchester_Mystery_House" },

  { key: "sedlec", cat: "haunt", glyph: "💀", lat: 49.9613, lon: 15.2884,
    name: "Sedlec Ossuary",
    real: "Church of All Saints · Kutná Hora, Czech Republic",
    lore: "In 1278 an abbot brought back a handful of dirt from Golgotha and scattered it on the Sedlec cemetery. Everyone wanted to be buried there. After the Black Death and Hussite Wars, 40,000 bodies were piled inside a chapel. In 1870 a woodcarver named František Rint was hired to do something about the bones. He built a chandelier from every bone in the human body, a Schwarzenberg coat of arms in vertebrae, and signed his name — in bones — on the wall.",
    wiki: "https://en.wikipedia.org/wiki/Sedlec_Ossuary" },

  { key: "mothman", cat: "cryptid", glyph: "👁", lat: 38.8459, lon: -82.1371,
    name: "Point Pleasant — Mothman",
    real: "TNT area · Point Pleasant, West Virginia",
    lore: "Between November 1966 and December 1967, sixty people reported a two-meter grey humanoid with 3-meter wings and glowing red eyes flying above Point Pleasant. The sightings clustered around the abandoned WWII 'TNT' munitions area — bunkers still visible today. On December 15, 1967 the Silver Bridge over the Ohio River collapsed at rush hour and killed 46 people. Some say Mothman was seen circling it before it fell. Some say he was the reason it fell.",
    wiki: "https://en.wikipedia.org/wiki/Mothman" },

  { key: "nessie", cat: "cryptid", glyph: "🐍", lat: 57.3229, lon: -4.4244,
    name: "Loch Ness",
    real: "Loch Ness, Scottish Highlands",
    lore: "Long, deep, cold and peat-black — visibility drops to zero below three meters. St. Columba wrote in 565 AD of a river monster he banished. In 1934 the 'Surgeon's Photograph' showed a serpent's neck; in 1994 the surgeon's stepson confessed it was a toy submarine with a wooden head. A 2019 environmental-DNA survey found no evidence of large fish or reptile — but a huge amount of eel DNA. A really big eel is still an eel.",
    wiki: "https://en.wikipedia.org/wiki/Loch_Ness_Monster" },

  { key: "skinwalker", cat: "cryptid", glyph: "🐺", lat: 40.2547, lon: -109.8867,
    name: "Skinwalker Ranch",
    real: "Uintah Basin · Utah",
    lore: "A 200-hectare ranch in Ute territory where owners since the 1950s have reported UFOs, cattle mutilations with laser-precise cuts, glowing orbs, portal-shaped clouds, invisible predators that killed dogs by melting them, and figures that walked on their hands. Bought by aerospace billionaire Bob Bigelow in 1996 for a paranormal research program; sold in 2016 to Brandon Fugal, who continues 24/7 monitoring. The Utes call the area cursed.",
    wiki: "https://en.wikipedia.org/wiki/Skinwalker_Ranch" },

  { key: "jerseydev", cat: "cryptid", glyph: "👹", lat: 39.7250, lon: -74.6100,
    name: "Pine Barrens — Jersey Devil",
    real: "Wharton State Forest · New Jersey Pine Barrens",
    lore: "Mother Leeds, having twelve children, cursed the thirteenth in labor: 'let this one be a devil.' It was born normal in 1735, then transformed — leathery wings, cloven hooves, a goat's head, a forked tail — killed the midwife and flew up the chimney. It's been sighted for three centuries in the 4,700-km² Pine Barrens. In one week of January 1909, 100 witnesses across NJ reported it, including schools that closed and mills that stopped.",
    wiki: "https://en.wikipedia.org/wiki/Jersey_Devil" },

  { key: "bermuda", cat: "cryptid", glyph: "🌀", lat: 25.0000, lon: -71.0000,
    name: "Bermuda Triangle",
    real: "~1,300,000 km² between Miami, Bermuda, and San Juan",
    lore: "Flight 19: five Navy Avengers on a training exercise on December 5, 1945. Compasses failed. 'We are entering white water, nothing seems right.' Last transmission at 19:04. A PBM Mariner sent to rescue them exploded 23 minutes after takeoff — probable fuel-vapor explosion, they said. Fourteen more men gone. The Coast Guard rejects the whole 'Triangle' as ordinary loss rates for a heavily trafficked ocean. But there was also the USS Cyclops (306 men, 1918), the SS Marine Sulphur Queen, and Flight 401. Nobody has ever found Flight 19.",
    wiki: "https://en.wikipedia.org/wiki/Bermuda_Triangle" },
];

function initHorror() {
  if (typeof map === "undefined" || !map) return;
  horrorLayer = L.layerGroup().addTo(map);
  HORROR_SITES.forEach(s => {
    const icon = L.divIcon({
      className: "horror-marker cat-" + s.cat,
      html: `<div class="h-badge">${s.glyph}</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    });
    const rows = [{ k: "Location", v: s.real, full: true }];
    if (s.movie) rows.push({ k: "Appears in", v: s.movie, full: true });
    rows.push({ k: "Story", v: s.lore, full: true });
    L.marker([s.lat, s.lon], { icon, zIndexOffset: 900 })
      .bindTooltip(s.name, { className: "telem-tip", direction: "top" })
      .on("click", () => inspect({
        kind: (s.movie ? "Horror-movie site" : "Cursed place") + " · lore",
        title: s.name, rows,
        lat: s.lat, lon: s.lon,
        link: s.wiki, linkLabel: "Wikipedia ↗",
      }))
      .addTo(horrorLayer);
  });
}
initHorror();
