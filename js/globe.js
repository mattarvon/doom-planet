// globe.js — WebGL globe mode for Doom Planet (GPU via three.js/globe.gl).
// Additive: a Map/Globe switch swaps the Leaflet map for an animated globe that
// renders the SAME live feeds (sharks, quakes, volcanoes, hazards, events,
// sightings, tides, tornadoes, contagion) plus a NOAA-OISST "Bloodwater SST"
// skin baked from AWS Open Data. Clicks reuse the existing dossier/inspector.
// Self-contained: injects its own DOM + CSS. Requires global `Globe` (globe.gl).

(function () {
  "use strict";

  var CDN = {
    night: "https://unpkg.com/three-globe/example/img/earth-night.jpg",
    bump: "https://unpkg.com/three-globe/example/img/earth-topology.png",
    sky: "https://unpkg.com/three-globe/example/img/night-sky.png",
  };
  var SST = "assets/sst/oisst_latest.png";

  // NASA GIBS near-real-time true-color Earth (single global equirect image via WMS)
  var GIBS_LAYER = "MODIS_Terra_CorrectedReflectance_TrueColor";
  function gibsUrl() {
    var d = new Date(Date.now() - 864e5);               // yesterday (GIBS ~1 day latency)
    var day = d.toISOString().slice(0, 10);
    return "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS" +
      "&REQUEST=GetMap&VERSION=1.3.0&LAYERS=" + GIBS_LAYER +
      "&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&FORMAT=image/jpeg&TIME=" + day;
  }

  var ISS = { rec: null, pt: null, track: null, started: false };
  var lastPoints = [];

  // ---- tiny helpers (defensive: reuse app globals when present) ----
  function num(v) { return typeof v === "number" && isFinite(v); }
  function mag(m) { return (typeof magColor === "function") ? magColor(m) : "#e6201c"; }
  function alrt(a) { return (typeof alertColor === "function") ? alertColor(a) : "#e69a2f"; }
  function volc(c) { return (typeof volcColor === "function") ? volcColor(c) : "#e69a2f"; }
  function esc(s) { return String(s == null ? "" : s); }
  function daysAgoT(t) { return Math.floor((Date.now() - t) / 864e5); }

  // ---- inject CSS ----
  var css = document.createElement("style");
  css.textContent = [
    "#globe{position:absolute;inset:0;z-index:1;display:none;background:#03060a;cursor:grab}",
    "#globe:active{cursor:grabbing}",
    "#globe canvas{display:block}",
    ".dp-view,.dp-skin{position:absolute;z-index:8;display:flex;gap:2px;",
    "  font:600 11px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}",
    ".dp-view{top:64px;left:50%;transform:translateX(-50%)}",
    ".dp-skin{top:64px;right:16px;display:none}",
    ".dp-view button,.dp-skin button{background:rgba(8,10,14,.82);color:#8a9298;border:1px solid #23282f;",
    "  padding:6px 12px;cursor:pointer;backdrop-filter:blur(3px)}",
    ".dp-view button:first-child,.dp-skin button:first-child{border-radius:5px 0 0 5px}",
    ".dp-view button:last-child,.dp-skin button:last-child{border-radius:0 5px 5px 0;border-left:0}",
    ".dp-view button.on,.dp-skin button.on{color:#f4eae0;background:rgba(124,11,16,.65);border-color:#7a0b10}",
    ".dp-sstcredit{position:absolute;left:16px;bottom:70px;z-index:8;display:none;max-width:240px;",
    "  font:500 10px/1.4 system-ui,sans-serif;color:#6b7278}",
    ".dp-sstcredit b{color:#e6431c;font-weight:700}",
    ".dp-diag{position:absolute;left:50%;transform:translateX(-50%);bottom:16px;z-index:9;display:none;",
    "  max-width:80%;font:600 11px/1.5 ui-monospace,monospace;color:#ff5a6a;background:rgba(8,4,6,.9);",
    "  padding:8px 12px;border:1px solid #7a0b10;border-radius:6px;white-space:pre-wrap}",
  ].join("\n");
  document.head.appendChild(css);

  // ---- inject DOM ----
  var stage = document.getElementById("stage") || document.body;
  var globeEl = document.createElement("div"); globeEl.id = "globe";
  stage.appendChild(globeEl);

  function switcher(cls, opts, onPick) {
    var wrap = document.createElement("div"); wrap.className = cls;
    opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.textContent = o.label; b.dataset.k = o.k; if (i === 0) b.className = "on";
      b.onclick = function () {
        Array.prototype.forEach.call(wrap.children, function (c) { c.classList.remove("on"); });
        b.classList.add("on"); onPick(o.k);
      };
      wrap.appendChild(b);
    });
    stage.appendChild(wrap); return wrap;
  }

  var creditEl = document.createElement("div");
  creditEl.className = "dp-sstcredit";
  stage.appendChild(creditEl);

  // on-page diagnostics (so errors are visible without DevTools)
  var diagEl = document.createElement("div");
  diagEl.className = "dp-diag";
  stage.appendChild(diagEl);
  var diagMsgs = [];
  function report(msg) {
    if (diagMsgs.indexOf(msg) === -1) diagMsgs.push(msg);
    diagEl.textContent = "GLOBE DIAG — " + diagMsgs.slice(0, 5).join("  |  ");
    diagEl.style.display = "block";
    if (window.console && console.error) console.error("[DoomGlobe]", msg);
  }
  window.addEventListener("error", function (ev) {
    if (ev && ev.message) report("err: " + ev.message +
      (ev.filename ? (" @ " + String(ev.filename).split("/").pop() + ":" + ev.lineno) : ""));
  });
  function cfg(label, fn) {
    try { fn(); } catch (e) { report(label + "() → " + (e && e.message ? e.message : e)); }
  }

  var globe = null, active = false, timer = null, curSkin = "night";

  // ---- build the globe once ----
  function build() {
    if (globe) return;
    if (typeof Globe !== "function") { report("globe.gl library (Globe) not loaded"); return; }
    globe = Globe()(globeEl);
    cfg("globeImageUrl", function () { globe.globeImageUrl(CDN.night); });
    cfg("bumpImageUrl", function () { globe.bumpImageUrl(CDN.bump); });
    cfg("backgroundImageUrl", function () { globe.backgroundImageUrl(CDN.sky); });
    cfg("atmosphere", function () {
      globe.showAtmosphere(true).atmosphereColor("#ff3b3b").atmosphereAltitude(0.17);
    });
    cfg("pathAccessors", function () {
      globe.pathPoints(function (d) { return d.pts; })
        .pathPointLat(function (p) { return p[0]; }).pathPointLng(function (p) { return p[1]; })
        .pathColor(function (d) {
          return (d && d.iss) ? ["rgba(120,200,255,0)", "#8fd6ff"] : ["rgba(230,32,30,0)", "#ff2b4e"];
        })
        .pathStroke(1.6).pathDashLength(0.4).pathDashGap(0.18).pathDashAnimateTime(6000)
        .onPathClick(function (d) { if (d && d.shark && typeof select === "function") select(d.shark.id); });
    });
    cfg("ringAccessors", function () {
      globe.ringLat(function (d) { return d.lat; }).ringLng(function (d) { return d.lng; })
        .ringMaxRadius(function (d) { return d.maxR; })
        .ringPropagationSpeed(function (d) { return d.speed; })
        .ringRepeatPeriod(function (d) { return d.period; })
        .ringColor(function (d) { var c = d.color; return function (t) { return colorFade(c, 1 - t); }; });
    });
    cfg("pointAccessors", function () {
      globe.pointLat(function (d) { return d.lat; }).pointLng(function (d) { return d.lng; })
        .pointColor(function (d) { return d.color; }).pointAltitude(function (d) { return d.alt; })
        .pointRadius(function (d) { return d.radius; }).pointLabel(function (d) { return d.tip || ""; })
        .onPointClick(function (d) {
          if (!d) return;
          if (d.sharkId != null && typeof select === "function") { select(d.sharkId); return; }
          if (d.meta && typeof inspect === "function") inspect(d.meta);
        });
    });
    cfg("labelAccessors", function () {
      globe.labelLat(function (d) { return d.lat; }).labelLng(function (d) { return d.lng; })
        .labelText(function (d) { return d.name; })
        .labelSize(0.9).labelDotRadius(0.32).labelColor(function () { return "#ff6b7d"; })
        .labelResolution(1)
        .onLabelClick(function (d) { if (d && typeof select === "function") select(d.id); });
    });
    cfg("controls", function () {
      var c = globe.controls(); c.autoRotate = true; c.autoRotateSpeed = 0.45; c.enableDamping = true;
    });
    cfg("pov", function () { globe.pointOfView({ lat: 30, lng: -50, altitude: 2.4 }, 0); });
    sizeGlobe();
    window.addEventListener("resize", sizeGlobe);
  }

  function sizeGlobe() {
    if (!globe) return;
    globe.width(stage.clientWidth || window.innerWidth);
    globe.height(stage.clientHeight || window.innerHeight);
  }

  // fade a hex/rgb color's alpha for ring interpolation
  function colorFade(hex, a) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    if (!num(r)) { r = 230; g = 32; b = 30; }
    return "rgba(" + r + "," + g + "," + b + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  }

  // ---- gather live feeds and push to the globe ----
  function callSafe(fn) {
    try { if (typeof fn === "function") return fn(); } catch (e) {}
    return Promise.resolve(null);
  }

  async function refresh() {
    if (!globe) return;

    // sharks (already loaded into SHARKS by app.js)
    var sharks = (typeof SHARKS !== "undefined" && SHARKS) ? SHARKS : [];
    var paths = [], labels = [], points = [];
    sharks.forEach(function (s) {
      if (!s.pings || !s.pings.length) return;
      var pts = s.pings.map(function (p) { return [+p.latitude, +p.longitude]; })
        .filter(function (p) { return num(p[0]) && num(p[1]); });
      if (!pts.length) return;
      if (pts.length > 1) paths.push({ pts: pts, shark: s });
      var head = pts[pts.length - 1];
      labels.push({ lat: head[0], lng: head[1], name: (s.name || "").toUpperCase(), id: s.id });
      points.push({ lat: head[0], lng: head[1], color: "#ff2b4e", alt: 0.012, radius: 0.34,
        sharkId: s.id, tip: (s.name || "Shark") });
    });

    // rings: quakes + volcanoes
    var rings = [];
    var quakes = await callSafe(typeof loadQuakes !== "undefined" ? loadQuakes : null);
    if (quakes && quakes.length) quakes.forEach(function (q) {
      if (!num(q.lat)) return;
      var m = num(q.mag) ? q.mag : 1;
      rings.push({ lat: q.lat, lng: q.lon, color: mag(m),
        maxR: Math.min(1 + m * 1.3, 9), speed: 1.4, period: Math.max(600, 2600 - m * 260) });
      points.push({ lat: q.lat, lng: q.lon, color: mag(m), alt: 0.006, radius: 0.16 + m * 0.03,
        meta: { kind: "Earthquake · USGS", title: "M" + m.toFixed(1) + " · " + (q.place || ""),
          rows: [{ k: "Magnitude", v: m.toFixed(1), color: mag(m) },
            { k: "Depth", v: num(q.depth) ? q.depth.toFixed(0) + " km" : null },
            { k: "When", v: q.time ? new Date(q.time).toUTCString() : null, full: true }],
          lat: q.lat, lon: q.lon, link: q.url, linkLabel: "USGS ↗" } });
    });
    var volcs = await callSafe(typeof loadVolcanoes !== "undefined" ? loadVolcanoes : null);
    if (volcs && volcs.length) volcs.forEach(function (v) {
      if (!v.ll) return;
      rings.push({ lat: v.ll[0], lng: v.ll[1], color: volc(v.color), maxR: 5, speed: 0.7, period: 2200 });
      points.push({ lat: v.ll[0], lng: v.ll[1], color: volc(v.color), alt: 0.02, radius: 0.4,
        meta: { kind: "Volcano · USGS", title: v.name,
          rows: [{ k: "Alert level", v: v.alert, color: volc(v.color) },
            { k: "Aviation color", v: v.color }], lat: v.ll[0], lon: v.ll[1],
          link: v.url, linkLabel: "USGS notice ↗" } });
    });

    // points: hazards, events, sightings, tides, tornadoes, contagion
    var haz = await callSafe(typeof loadHazards !== "undefined" ? loadHazards : null);
    if (haz && haz.length) haz.forEach(function (e) {
      if (!num(e.lat)) return;
      points.push({ lat: e.lat, lng: e.lon, color: alrt(e.alert), alt: 0.01, radius: 0.3,
        tip: (e.name || e.country || "Hazard"),
        meta: { kind: "Hazard · GDACS", title: e.name || e.country || "Hazard",
          rows: [{ k: "Alert", v: e.alert, color: alrt(e.alert) }, { k: "Country", v: e.country, full: true }],
          lat: e.lat, lon: e.lon, link: e.url, linkLabel: "GDACS ↗" } });
    });
    var events = await callSafe(typeof loadEonet !== "undefined" ? loadEonet : null);
    if (events && events.length) events.forEach(function (e) {
      if (!num(e.lat)) return;
      var m = (typeof EONET_CAT !== "undefined" && EONET_CAT[e.cat]) ? EONET_CAT[e.cat] : { c: "#8a9298" };
      points.push({ lat: e.lat, lng: e.lon, color: m.c, alt: 0.008, radius: 0.24, tip: e.title,
        meta: { kind: (e.cat || "Event") + " · NASA EONET", title: e.title,
          rows: [{ k: "Category", v: e.cat }, { k: "Last observed", v: e.date }],
          lat: e.lat, lon: e.lon, link: e.link, linkLabel: "EONET ↗" } });
    });
    var sights = await callSafe(typeof loadSightings !== "undefined" ? loadSightings : null);
    if (sights && sights.length) sights.slice(0, 60).forEach(function (s) {
      if (!num(s.lat)) return;
      points.push({ lat: s.lat, lng: s.lon, color: "#bd0a13", alt: 0.004, radius: 0.14,
        tip: (s.sp || "shark") + " · " + (s.date || "") });
    });
    var tides = await callSafe(typeof loadTides !== "undefined" ? loadTides : null);
    if (tides && tides.length) tides.filter(Boolean).forEach(function (t) {
      if (!num(t.lat)) return;
      points.push({ lat: t.lat, lng: t.lon, color: t.trend >= 0 ? "#2fb6b6" : "#3b6fd1", alt: 0.006, radius: 0.26,
        tip: t.name + " · " + (num(t.value) ? t.value.toFixed(1) + " ft" : ""),
        meta: { kind: "Tide · NOAA CO-OPS", title: t.name,
          rows: [{ k: "Water level", v: num(t.value) ? t.value.toFixed(2) + " ft MLLW" : null },
            { k: "Trend", v: t.trend >= 0 ? "rising" : "falling", color: t.trend >= 0 ? "#2fb6b6" : "#3b6fd1" }],
          lat: t.lat, lon: t.lon } });
    });
    var tornW = await callSafe(typeof loadTornadoWarnings !== "undefined" ? loadTornadoWarnings : null);
    if (tornW && tornW.length) tornW.forEach(function (w) {
      if (!w.ll) return;
      points.push({ lat: w.ll[0], lng: w.ll[1], color: "#e6201c", alt: 0.03, radius: 0.5,
        tip: "Tornado Warning · " + (w.area || ""),
        meta: { kind: "Tornado Warning · NWS", title: w.headline || "Tornado Warning",
          rows: [{ k: "Area", v: w.area, full: true }, { k: "Severity", v: w.severity }],
          lat: w.ll[0], lon: w.ll[1] } });
    });
    var contag = await callSafe(typeof loadContagion !== "undefined" ? loadContagion : null);
    if (contag && contag.countries) contag.countries.forEach(function (c) {
      var la = c.countryInfo && c.countryInfo.lat, lo = c.countryInfo && c.countryInfo.long;
      if (!num(la) || (c.cases || 0) < 2e6) return;
      points.push({ lat: la, lng: lo, color: "#7a0b10", alt: 0.002,
        radius: Math.min(0.2 + Math.sqrt(c.cases) / 4000, 1.1), tip: c.country });
    });

    // aurora oval (NOAA SWPC OVATION): green glow where auroral probability is high
    try {
      var av = await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");
      var aj = await av.json();
      var co = (aj && aj.coordinates) ? aj.coordinates : [];
      for (var i = 0; i < co.length; i += 2) {           // subsample for perf
        var v = co[i][2];
        if (v < 8) continue;
        var lon = co[i][0]; if (lon > 180) lon -= 360;
        points.push({ lat: co[i][1], lng: lon, alt: 0.03,
          radius: 0.12 + v / 260, color: "rgba(56,255,158," + Math.min(0.85, v / 100 + 0.15).toFixed(2) + ")" });
      }
    } catch (e) {}

    // ISS: live orbit path + moving marker (computed from TLE via satellite.js)
    if (ISS.track) paths.push(ISS.track);
    if (ISS.pt) points.push(ISS.pt);
    startISS();

    // space weather → atmosphere mood
    var sw = await callSafe(typeof loadSpaceWx !== "undefined" ? loadSpaceWx : null);
    if (sw && num(sw.kp)) {
      globe.atmosphereColor(sw.kp >= 6 ? "#c23bff" : sw.kp >= 5 ? "#ff2b4e" : "#ff3b3b")
           .atmosphereAltitude(0.15 + Math.min(sw.kp, 9) * 0.008);
    }

    lastPoints = points;
    cfg("pathsData", function () { globe.pathsData(paths); });
    cfg("ringsData", function () { globe.ringsData(rings); });
    cfg("pointsData", function () { globe.pointsData(points); });
    cfg("labelsData", function () { globe.labelsData(labels); });
    report("layers set — paths:" + paths.length + " rings:" + rings.length +
      " points:" + points.length + " labels:" + labels.length);
  }

  // ---- ISS (satellite.js TLE propagation) ----
  function geo(rec, when) {
    if (typeof satellite === "undefined") return null;
    var pv = satellite.propagate(rec, when);
    if (!pv || !pv.position) return null;
    var g = satellite.eciToGeodetic(pv.position, satellite.gstime(when));
    return { lat: satellite.degreesLat(g.latitude), lng: satellite.degreesLong(g.longitude),
      altKm: g.height };
  }
  function buildTrack(rec) {
    var pts = [], now = Date.now();
    for (var m = 0; m <= 94; m += 1.5) {                 // ~one forward orbit
      var g = geo(rec, new Date(now + m * 60000));
      if (g) pts.push([g.lat, g.lng]);
    }
    return { pts: pts, iss: true };
  }
  function tickISS() {
    if (!ISS.rec || !globe) return;
    var g = geo(ISS.rec, new Date());
    if (!g) return;
    if (!ISS.pt) ISS.pt = { lat: g.lat, lng: g.lng, alt: 0.09, radius: 0.7, color: "#bfe9ff",
      tip: "ISS · International Space Station" };
    else { ISS.pt.lat = g.lat; ISS.pt.lng = g.lng; }
    if (lastPoints.length) globe.pointsData(lastPoints);  // cheap position refresh
  }
  function startISS() {
    if (ISS.started) return; ISS.started = true;
    fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE")
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var L = txt.trim().split(/\r?\n/);
        if (L.length < 3 || typeof satellite === "undefined") return;
        ISS.rec = satellite.twoline2satrec(L[1], L[2]);
        ISS.track = buildTrack(ISS.rec);
        tickISS();
        setInterval(function () { if (active) tickISS(); }, 2000);
        setInterval(function () { if (active && ISS.rec) ISS.track = buildTrack(ISS.rec); }, 60000);
      }).catch(function () {});
  }

  // ---- skins ----
  function setSkin(k) {
    curSkin = k;
    if (!globe) return;
    if (k === "sst") {
      globe.globeImageUrl(SST).bumpImageUrl(null);
      creditEl.innerHTML = ""; creditEl.style.display = "block"; loadSstMeta();
    } else if (k === "live") {
      globe.globeImageUrl(gibsUrl()).bumpImageUrl(null);
      creditEl.innerHTML = "<b>Live Earth</b> — NASA GIBS MODIS true-color, ~24h latency";
      creditEl.style.display = "block";
    } else {
      globe.globeImageUrl(CDN.night).bumpImageUrl(CDN.bump);
      creditEl.style.display = "none";
    }
  }
  var sstMetaLoaded = false;
  function loadSstMeta() {
    if (sstMetaLoaded) return; sstMetaLoaded = true;
    fetch("assets/sst/oisst_latest.json").then(function (r) { return r.json(); }).then(function (m) {
      creditEl.innerHTML = "<b>Bloodwater SST</b> — NOAA OISST v2.1 sea-surface temperature, " +
        esc(m.date) + "<br>AWS Open Data (RODA): " + esc(m.bucket);
    }).catch(function () {
      creditEl.innerHTML = "<b>Bloodwater SST</b> — NOAA OISST via AWS Open Data";
    });
  }

  // ---- view switch ----
  var skinSwitch = null;
  function activate(view) {
    var mapEl = document.getElementById("map");
    if (view === "globe") {
      active = true;
      build();
      if (mapEl) mapEl.style.display = "none";
      globeEl.style.display = "block";
      if (skinSwitch) skinSwitch.style.display = "flex";
      if (curSkin === "sst") creditEl.style.display = "block";
      sizeGlobe();
      refresh();
      if (!timer) timer = setInterval(function () { if (active) refresh(); }, 60000);
    } else {
      active = false;
      if (mapEl) mapEl.style.display = "";
      globeEl.style.display = "none";
      if (skinSwitch) skinSwitch.style.display = "none";
      creditEl.style.display = "none";
      if (timer) { clearInterval(timer); timer = null; }
      if (typeof map !== "undefined" && map && map.invalidateSize) setTimeout(function () { map.invalidateSize(); }, 60);
    }
  }

  switcher("dp-view", [{ label: "Map", k: "map" }, { label: "Globe", k: "globe" }], activate);
  skinSwitch = switcher("dp-skin", [{ label: "Night", k: "night" }, { label: "Live Earth", k: "live" },
    { label: "Bloodwater SST", k: "sst" }], setSkin);

  // expose a tiny hook for debugging
  window.DoomGlobe = { refresh: refresh, activate: activate };
})();
