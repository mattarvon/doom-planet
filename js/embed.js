// embed.js — image portability layer. In dev this is empty, so images load from
// assets/ as normal. The single-file build (build.ps1) injects a populated
// window.EMBEDDED_IMAGES before this runs, so the bundle carries every image
// inline as a data URI and needs no external files.
window.EMBEDDED_IMAGES = window.EMBEDDED_IMAGES || {};
function assetUrl(p) { return (window.EMBEDDED_IMAGES && window.EMBEDDED_IMAGES[p]) || p; }

// Logo art is LOCAL/PRIVATE-ONLY: inject it only if the image actually loads
// (embedded data URI in the bundle, or the local file in dev). The public/mobile
// build has neither, so the badge simply never appears there.
(function () {
  const brand = document.querySelector(".brand");
  if (!brand) return;
  const src = assetUrl("assets/sharks/wasp.png");
  const im = new Image();
  im.onload = () => {
    const el = document.createElement("img");
    el.className = "logoart"; el.alt = ""; el.src = src;
    brand.insertBefore(el, brand.firstChild);
  };
  im.src = src;
})();
