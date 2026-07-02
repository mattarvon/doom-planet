// embed.js — image portability layer. In dev this is empty, so images load from
// assets/ as normal. The single-file build (build.ps1) injects a populated
// window.EMBEDDED_IMAGES before this runs, so the bundle carries every image
// inline as a data URI and needs no external files.
window.EMBEDDED_IMAGES = window.EMBEDDED_IMAGES || {};
function assetUrl(p) { return (window.EMBEDDED_IMAGES && window.EMBEDDED_IMAGES[p]) || p; }

// point the topbar logo art at its embedded copy when bundled
(function () { const la = document.querySelector(".logoart"); if (la) la.src = assetUrl("assets/sharks/wasp.png"); })();
