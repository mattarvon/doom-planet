// radar.js — RainViewer animated precipitation radar on the Leaflet map.
// Free, keyless, CORS-clean. Cycles the last ~2h of global radar frames + nowcast.
// Self-contained; uses globals map, L. No-op if the map isn't present.

(function () {
  "use strict";
  if (typeof map === "undefined" || !map || typeof L === "undefined") return;

  var INDEX = "https://api.rainviewer.com/public/weather-maps.json";
  var frames = [], host = "", i = 0, layer = null, anim = null;

  function tmpl(frame) {
    // color scheme 2 (universal blue→red), smooth=1, snow=1, 256px tiles
    return host + frame.path + "/256/{z}/{x}/{y}/2/1_1.png";
  }

  function show(idx) {
    if (!frames.length) return;
    var f = frames[((idx % frames.length) + frames.length) % frames.length];
    var next = L.tileLayer(tmpl(f), { opacity: 0, zIndex: 250, tileSize: 256, crossOrigin: true });
    next.addTo(map);
    next.once("load", function () {
      next.setOpacity(0.55);
      if (layer) { var old = layer; setTimeout(function () { map.removeLayer(old); }, 300); }
      layer = next;
    });
    // fail-safe: swap even if 'load' is slow/misses on sparse tiles
    setTimeout(function () { if (layer !== next) { next.setOpacity(0.55); if (layer) map.removeLayer(layer); layer = next; } }, 1200);
  }

  function loop() {
    if (anim) clearInterval(anim);
    i = frames.length ? frames.length - 1 : 0;   // start on newest
    show(i);
    anim = setInterval(function () { i++; show(i); }, 700);
  }

  function load() {
    fetch(INDEX).then(function (r) { return r.json(); }).then(function (j) {
      host = j.host || "https://tilecache.rainviewer.com";
      var radar = j.radar || {};
      frames = (radar.past || []).concat(radar.nowcast || []);
      if (frames.length) loop();
    }).catch(function () {});
  }

  load();
  setInterval(load, 5 * 60 * 1000);   // refresh frame list every 5 min
})();
