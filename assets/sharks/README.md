# Shark images

Two separate, optional jobs — both fall back gracefully, so the app always works:

| role | file | format | shows up as |
|------|------|--------|-------------|
| **map marker** | `<id\|species\|default>.png` | **transparent PNG only** | a real shark in the water (no frame), floating in the gore field, animated |
| **dossier portrait** | `<id\|species\|default>.<any>` | png/webp/jpg/gif | the big case-file photo when you select a shark |

## Map marker — transparent PNG

The marker looks for, in order: `<id>.png` → `<species>.png` → `default.png`,
else the built-in vector shark. Species names are `white`, `tiger`, `mako`.
The quickest win: add **`white.png`** (the demo pod is mostly white sharks).

- **Must be a transparent PNG** — the background erased (checkerboard transparency,
  just the shark). A photo *with* its ocean/sky baked in will look like a pasted
  rectangle; the whole point is a clean cut-out so it sits in the real water.
- Easiest way to make one: drop your image on **remove.bg** or **photopea.com**
  ("Select Subject" / "Remove background"), export PNG. Or grab a "great white PNG"
  that's already transparent.
- **View:** a side-on or 3/4 monster shot reads best at marker size. ~256–512 px,
  facing **right** (the app mirrors it to match travel direction).
- **Don't pre-bloody it** — blood cloud, drips, glow and floating body parts are
  added in code.

## Dossier portrait — any photo

`<id>.jpg`, `white.webp`, `default.jpg`, etc. Background is fine here; it's a framed
banner. Used only in the case-file panel when a shark is selected.

## Licensing

These files ship in a public repo. Use images you have the rights to publish
(your own, CC0/public-domain, or licensed). NOAA imagery is public domain.
