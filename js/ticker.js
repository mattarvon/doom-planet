// ticker.js — DOOM WIRE bottom marquee. Self-contained: pulls a small set of
// live doom feeds, synthesizes short headlines, and scrolls them across the
// bottom of the stage cable-news style. Clicking an item opens the shared
// inspector where lat/lon is known, else opens the source link.

(function () {
  const state = { byId: {}, list: [] };

  const esc = s => (s || "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const age = t => { const m = (Date.now() - t) / 60000; return m < 1 ? "just now" : m < 60 ? Math.round(m) + "m ago" : Math.round(m / 60) + "h ago"; };

  // Replace all items whose id starts with `prefix` with the given list.
  // This handles both additions and expirations per feed without cross-talk.
  function replace(prefix, items) {
    Object.keys(state.byId).forEach(k => { if (k.startsWith(prefix)) delete state.byId[k]; });
    items.forEach(it => { state.byId[it.id] = it; });
    state.list = Object.values(state.byId)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0) || (b.ts || 0) - (a.ts || 0))
      .slice(0, 40);
    render();
  }

  function render() {
    const track = document.getElementById("ticker-track");
    if (!track) return;
    if (!state.list.length) {
      track.innerHTML = `<span class="ti-idle">acquiring doom…</span>`;
      track.style.animationDuration = "0s";
      return;
    }
    const chunk = state.list.map(it => {
      const clickable = Number.isFinite(it.lat) && Number.isFinite(it.lon) || it.link;
      return `<span class="ti${clickable ? " ti-click" : ""}" data-id="${esc(it.id)}">
        <span class="ti-icon" style="color:${it.tone || "#8a9298"}">${it.icon || "•"}</span>
        <span class="ti-text">${esc(it.text)}</span>
      </span>`;
    }).join(`<span class="ti-sep">·</span>`);
    // duplicate the chunk so translateX(-50%) yields a seamless loop
    track.innerHTML = chunk + `<span class="ti-sep">·</span>` + chunk;
    requestAnimationFrame(() => {
      const half = track.scrollWidth / 2;
      const speed = 65; // px per second — cable-news pace
      track.style.animationDuration = Math.max(30, half / speed) + "s";
    });
  }

  function openItem(id) {
    const it = state.byId[id]; if (!it) return;
    if (typeof inspect === "function" && Number.isFinite(it.lat) && Number.isFinite(it.lon)) {
      inspect({
        kind: it.kind || "Doom", title: it.title || it.text,
        rows: it.rows || [{ k: "Details", v: it.text, full: true }],
        lat: it.lat, lon: it.lon, link: it.link, linkLabel: it.linkLabel,
      });
    } else if (it.link) {
      window.open(it.link, "_blank", "noopener");
    }
  }

  // ===================== USGS earthquakes (M≥3, last hour) =====================
  async function pullQuakes() {
    try {
      const j = await (await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson")).json();
      const items = (j.features || [])
        .filter(f => f.properties && f.properties.mag >= 3.0 && f.geometry)
        .slice(0, 12)
        .map(f => {
          const p = f.properties, c = f.geometry.coordinates || [];
          const mag = p.mag, place = p.place || "unknown";
          const tone = mag >= 6 ? "#9c3bd1" : mag >= 5 ? "#bd0a13" : mag >= 4 ? "#e6201c" : "#e69a2f";
          return {
            id: "q:" + f.id, icon: "⊙", tone,
            text: `M${mag.toFixed(1)} ${place} · ${age(p.time)}`,
            priority: 30 + Math.min(mag * 5, 25),
            ts: p.time, lat: c[1], lon: c[0], link: p.url, linkLabel: "USGS event ↗",
            kind: "Earthquake · USGS", title: `M${mag.toFixed(1)} · ${place}`,
            rows: [
              { k: "Magnitude", v: mag.toFixed(1), color: tone },
              { k: "Place", v: place, full: true },
              { k: "Depth", v: (c[2] || 0).toFixed(1) + " km" },
              { k: "Time", v: new Date(p.time).toUTCString() },
            ],
          };
        });
      replace("q:", items);
    } catch (e) {}
  }

  // ===================== NASA EONET (open natural events) =====================
  const EONET_ICON = {
    "Wildfires": "🔥", "Severe Storms": "🌀", "Volcanoes": "🌋", "Sea and Lake Ice": "🧊",
    "Dust and Haze": "🌫", "Floods": "🌊", "Earthquakes": "⊙", "Landslides": "⛰",
    "Drought": "☀", "Temperature Extremes": "🌡", "Manmade": "☣", "Snow": "❄", "Water Color": "≈",
  };
  const EONET_TONE = {
    "Wildfires": "#e6201c", "Severe Storms": "#2fb6b6", "Volcanoes": "#e69a2f",
    "Sea and Lake Ice": "#9ad8e6", "Dust and Haze": "#caa46a", "Floods": "#3b6fd1",
    "Manmade": "#9c3bd1", "Drought": "#caa46a", "Temperature Extremes": "#e6201c",
  };
  async function pullEONET() {
    try {
      const j = await (await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30")).json();
      const items = (j.events || []).map(e => {
        const g = e.geometry || [], last = g[g.length - 1]; if (!last) return null;
        let co = last.coordinates; if (last.type === "Polygon") co = co[0][0];
        const cat = e.categories && e.categories[0] && e.categories[0].title;
        const ts = last.date ? new Date(last.date).getTime() : Date.now();
        return {
          id: "e:" + e.id, icon: EONET_ICON[cat] || "•", tone: EONET_TONE[cat] || "#8a9298",
          text: e.title, priority: 18, ts,
          lat: co[1], lon: co[0],
          link: e.sources && e.sources[0] && e.sources[0].url, linkLabel: "EONET source ↗",
          kind: (cat || "Event") + " · NASA EONET", title: e.title,
          rows: [{ k: "Category", v: cat }, { k: "Last observed", v: (last.date || "").slice(0, 10) }],
        };
      }).filter(Boolean).slice(0, 10);
      replace("e:", items);
    } catch (e) {}
  }

  // ===================== GDACS (red / orange only) =====================
  const GDACS_ICON = { EQ: "⊙", TC: "🌀", FL: "🌊", VO: "🌋", DR: "☀", WF: "🔥", TS: "🌊" };
  const GDACS_LABEL = { EQ: "Quake", TC: "Cyclone", FL: "Flood", VO: "Volcano", DR: "Drought", WF: "Wildfire", TS: "Tsunami" };
  async function pullGDACS() {
    try {
      const j = await (await fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?fromdate=&todate=&alertlevel=&eventlist=")).json();
      const items = (j.features || []).map(f => {
        const p = f.properties || {}, co = (f.geometry || {}).coordinates || [];
        const alert = (p.alertlevel || "").toLowerCase();
        if (alert !== "red" && alert !== "orange") return null;
        const tone = alert === "red" ? "#e6201c" : "#e69a2f";
        const ts = new Date(p.datemodified || p.fromdate || Date.now()).getTime();
        return {
          id: "g:" + (p.eventid || (p.eventname || "") + p.fromdate),
          icon: GDACS_ICON[p.eventtype] || "⚠", tone,
          text: `${GDACS_LABEL[p.eventtype] || p.eventtype} · ${p.name || p.country || "?"}`,
          priority: alert === "red" ? 45 : 25, ts,
          lat: co[1], lon: co[0],
          link: (p.url && (p.url.report || p.url.details)) || null, linkLabel: "GDACS report ↗",
          kind: (GDACS_LABEL[p.eventtype] || p.eventtype) + " · GDACS", title: p.name || p.country || "Hazard",
          rows: [
            { k: "Alert", v: p.alertlevel, color: tone },
            { k: "Country", v: p.country, full: true },
            { k: "Severity", v: p.severitydata && p.severitydata.severitytext, full: true },
          ],
        };
      }).filter(Boolean).slice(0, 12);
      replace("g:", items);
    } catch (e) {}
  }

  // ===================== USGS elevated volcanoes =====================
  function vColor(c) { c = (c || "").toUpperCase(); return c === "RED" ? "#e6201c" : c === "ORANGE" ? "#e69a2f" : c === "YELLOW" ? "#e6d756" : "#56e6b4"; }
  async function pullVolcanoes() {
    try {
      const v = await (await fetch("https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes")).json();
      const items = (v || []).map(x => {
        const tone = vColor(x.color_code);
        return {
          id: "v:" + x.volcano_name, icon: "🌋", tone,
          text: `${x.volcano_name} · ${x.alert_level}`,
          priority: (x.color_code || "").toUpperCase() === "RED" ? 40 : 20,
          ts: new Date(x.sent_utc || Date.now()).getTime(),
          link: x.notice_url, linkLabel: "USGS notice ↗",
          kind: "Volcano · USGS", title: x.volcano_name,
          rows: [
            { k: "Alert", v: x.alert_level, color: tone },
            { k: "Aviation color", v: x.color_code, color: tone },
            { k: "Observatory", v: x.obs_fullname, full: true },
          ],
        };
      });
      replace("v:", items);
    } catch (e) {}
  }

  // ===================== Space weather (only if Kp ≥ 4) =====================
  async function pullKp() {
    try {
      const arr = await (await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")).json();
      const last = arr[arr.length - 1];
      const kp = Array.isArray(last) ? +last[1] : +last.Kp;
      if (!Number.isFinite(kp) || kp < 4) { replace("k:", []); return; }
      const tone = kp >= 6 ? "#e6201c" : kp >= 5 ? "#e69a2f" : "#e6d756";
      const g = "G" + Math.max(0, Math.min(5, Math.floor(kp) - 4));
      replace("k:", [{
        id: "k:latest", icon: "☀", tone,
        text: `Kp ${kp.toFixed(1)} · ${g} geomagnetic storm`,
        priority: 22 + kp * 3, ts: Date.now(),
        kind: "Space weather · NOAA SWPC", title: `Kp ${kp.toFixed(1)}`,
        rows: [{ k: "Kp", v: kp.toFixed(1), color: tone }, { k: "Scale", v: g }],
        link: "https://www.swpc.noaa.gov/products/planetary-k-index", linkLabel: "SWPC ↗",
      }]);
    } catch (e) {}
  }

  // ===================== NWS Tornado Warnings =====================
  async function pullTornWarn() {
    try {
      const j = await (await fetch("https://api.weather.gov/alerts/active?event=Tornado%20Warning")).json();
      const items = (j.features || []).filter(f => f.geometry && f.geometry.type === "Polygon").map(f => {
        const p = f.properties || {}, ring = f.geometry.coordinates[0];
        let x = 0, y = 0; ring.forEach(c => { x += c[0]; y += c[1]; });
        const lat = y / ring.length, lon = x / ring.length;
        const area = (p.areaDesc || "").split(";")[0].trim();
        return {
          id: "tw:" + (p.id || area + p.effective),
          icon: "🌪", tone: "#e6201c",
          text: `TORNADO WARNING · ${area}`,
          priority: 55, ts: new Date(p.sent || Date.now()).getTime(),
          lat, lon,
          kind: "Tornado Warning · NWS", title: p.headline || "Tornado Warning",
          rows: [
            { k: "Area", v: p.areaDesc, full: true },
            { k: "Severity", v: p.severity },
            { k: "Expires", v: p.expires ? new Date(p.expires).toLocaleString() : null },
            { k: "Office", v: p.senderName, full: true },
          ],
        };
      });
      replace("tw:", items);
    } catch (e) {}
  }

  // ===================== mount + boot =====================
  function mount() {
    const stage = document.getElementById("stage"); if (!stage) return;
    if (document.getElementById("ticker")) return;
    const bar = document.createElement("div");
    bar.id = "ticker"; bar.className = "ticker";
    bar.innerHTML =
      `<div class="ticker-head">DOOM WIRE</div>
       <div class="ticker-viewport">
         <div id="ticker-track" class="ticker-track"><span class="ti-idle">acquiring doom…</span></div>
       </div>`;
    stage.appendChild(bar);
    bar.addEventListener("click", e => {
      const t = e.target.closest(".ti"); if (!t) return;
      openItem(t.getAttribute("data-id"));
    });
  }

  function init() {
    mount();
    pullQuakes();     setInterval(pullQuakes,     60 * 1000);
    pullTornWarn();   setInterval(pullTornWarn,   60 * 1000);
    pullGDACS();      setInterval(pullGDACS,       5 * 60 * 1000);
    pullKp();         setInterval(pullKp,          5 * 60 * 1000);
    pullVolcanoes();  setInterval(pullVolcanoes,  10 * 60 * 1000);
    pullEONET();      setInterval(pullEONET,      15 * 60 * 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
