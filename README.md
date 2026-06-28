# The Clot

> *Coagulation is inevitable.*

A horror-themed **live planetary telemetry dashboard**. A full-screen satellite
world map, color-graded dark and bloody, overlaid with real-time data from a
stack of free public APIs — earthquakes, tornadoes, tides, disasters, space
weather, air quality, weather, shark sightings — while photoreal megalodons
prowl the oceans. Campy gore, a dripping-blood [Creepster](https://fonts.google.com/specimen/Creepster)
wordmark, and a stack of "the world is ending" readouts.

It started as **BLOODWATER**, a JAWS-flavored shark tracker, and grew into a
general doom board. Original art and branding; no third-party trademarks.

## Premise

One screen, one dark satellite map, every live signal of planetary distress laid
on top of it. The left rail is a scrolling stack of telemetry blocks, each with a
Creepster header; the map carries the matching markers. Everything updates on its
own cadence. Nothing is faked — every number is a real reading from a real public
feed (with graceful fallbacks when a feed is quiet or unreachable).

## Telemetry blocks

All feeds run **client-side** (no backend). Every source below was verified to
work from the browser (CORS-clean). Keyless unless noted.

| Block | Source | Notes |
|-------|--------|-------|
| **Sharks** | OCEARCH (demo-pod fallback) | photoreal megalodon markers in a gore field; follow-cam dossier with case-file photo |
| **Tides** | NOAA CO-OPS | 12 coastal gauges, live water level + rising/falling, map markers |
| **Air · PM2.5** | PurpleAir | **needs a free read key** (stored in `localStorage`); avg + worst sensors + colored dots |
| **Seismic** | USGS | dripping-blood canvas seismograph + epicenter markers |
| **Hazards** | GDACS | global disasters (cyclone/volcano/flood/drought), green/orange/red alerts |
| **Tornadoes** | NWS warnings + SPC reports | animated funnel markers; live warnings draw the storm-based polygon |
| **Space Weather** | NOAA SWPC | Kp geomagnetic-storm index + solar-wind Bz/Bt (DSCOVR) |
| **Weather** | Open-Meteo | current conditions at coastal cities |
| **Sightings** | GBIF | real shark occurrence records (Lamniformes + Carcharhiniformes) |

### API access notes

- **Keyless + CORS-clean:** NOAA CO-OPS, USGS, GDACS, NOAA SWPC, Open-Meteo,
  GBIF, NWS/weather.gov, SPC. These just work in the browser.
- **PurpleAir** needs a free **read** key (develop.purpleair.com). Paste it into
  the AIR box; it's saved to `localStorage` only and never committed.
- **Won't work client-side** (CORS-blocked → would need a small proxy): OpenSky
  (aircraft), AISStream (ships), Frankfurter (FX). The dev server could be
  extended to proxy these.
- Public API tiers and rate limits drift — re-verify before depending on one.

## Run it

Static site, no build step. It pulls map tiles, Leaflet, and the Creepster font
from CDNs and hits the live APIs above, so it needs an internet connection at
runtime, but there's nothing to compile.

```bash
# any static server works; pick one
python3 -m http.server 8000
npx serve
# then open http://localhost:8000
```

On Windows with no Python/Node, a self-contained PowerShell dev server with
live-reload (`serve.ps1`, git-ignored) is handy: `pwsh -File serve.ps1`.

## Map & attribution

The basemap is **Esri World Imagery** served through [Leaflet](https://leafletjs.com/)
(both via CDN, pinned in `index.html`). Tiles are color-graded for the horror
look in CSS (`.leaflet-tile` filter + `.grade` overlay), not baked in. The
attribution credit renders bottom-right. Check the terms of Esri, Leaflet, and
every data provider before any public/commercial use.

## Images (local-only)

Shark **markers** and the logo art are loaded from `assets/sharks/` and are
**git-ignored on purpose** — the reference images used during development are
copyrighted, so only `assets/sharks/README.md` is tracked. The app always works
without them (markers fall back to a built-in vector shark).

- **Map marker:** a **transparent PNG** (`<id|species|default>.png`) — the
  shark cut out, no background. Rendered as a real shark in the water with gore.
- **Dossier portrait:** any photo (`<id|species|default>.<jpg|webp|png>`).

See [`assets/sharks/README.md`](assets/sharks/README.md). Use only art you have
the rights to publish.

## Architecture

No bundler. Plain scripts share globals and load in order from `index.html`
(Leaflet first). Each telemetry block is its own self-initializing module.

| file               | owns                                                            |
|--------------------|-----------------------------------------------------------------|
| `js/geo.js`        | month names + legacy projection helpers (map now uses Leaflet)  |
| `js/shark.js`      | vector fallback shark SVG, gore-field body parts, heading helper|
| `js/data.js`       | OCEARCH loader + offshore demo pod + schema helpers             |
| `js/app.js`        | Leaflet map, shark markers (photo/vector) + gore, trails, dossier, controls, boot |
| `js/wordmark.js`   | dripping-blood "The Clot" Creepster wordmark                    |
| `js/noaa.js`       | NOAA CO-OPS tide stations + fetch                               |
| `js/purpleair.js`  | PurpleAir PM2.5 (key-gated) + AQI colors                        |
| `js/dashboard.js`  | tides + air panel render and map layers                        |
| `js/usgs.js`       | USGS earthquake feed + magnitude colors                        |
| `js/seismo.js`     | dripping-blood canvas seismograph + quake readout + epicenters |
| `js/blocks.js`     | GDACS hazards, SWPC space weather, Open-Meteo weather, GBIF sightings |
| `js/tornado.js`    | NWS Tornado Warnings + SPC reports, funnel markers             |
| `css/styles.css`   | everything visual: color-grade, panel, animations, reduced-motion |

The demo-pod shark tracks are synthetic random walks, biased seaward so they stay
in open water (the mock has no coastline awareness). Real OCEARCH data, when
proxied in, replaces them.

## Where to take it

- **Air** — drop in a PurpleAir read key to light up the PM2.5 block.
- **Layer toggles** — switch each map layer (tides, quakes, hazards, tornadoes,
  sightings) on/off to keep the map readable.
- **More moving telemetry** — planes (OpenSky) and ships (AISStream) via a proxy.
- **Shark bios** — written character dossiers per animal.
- **Panel reorg** — the rail is getting tall; a grid or collapsible sections.

## License

TBD. Code is yours to do as you like. Each data feed and the basemap belong to
their providers — check their terms before any public or commercial use.
