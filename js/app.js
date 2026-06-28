// app.js — rendering, dossier, controls, boot. Depends on geo/shark/data globals.

const chart = document.getElementById('chart');
const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

let showTrails = true, recentOnly = false, selId = null;

// ---------- base chart (sea, grid, land, sonar sweep, layers) ----------
function drawBase() {
  chart.innerHTML = "";
  const defs = el("defs");
  defs.innerHTML = `
    <radialGradient id="sea" cx="50%" cy="36%" r="82%">
      <stop offset="0" stop-color="#14424f"/><stop offset="42%" stop-color="#0b2832"/>
      <stop offset="76%" stop-color="#071319"/><stop offset="100%" stop-color="#03070a"/>
    </radialGradient>
    <radialGradient id="sweepg" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(47,182,182,.0)"/><stop offset="78%" stop-color="rgba(47,182,182,.08)"/>
      <stop offset="100%" stop-color="rgba(47,182,182,.30)"/>
    </radialGradient>
    <linearGradient id="landg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#243524"/><stop offset="55%" stop-color="#14241a"/><stop offset="1" stop-color="#0a140f"/>
    </linearGradient>
    <radialGradient id="chum" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(150,7,12,.6)"/><stop offset="55%" stop-color="rgba(120,7,12,.24)"/>
      <stop offset="100%" stop-color="rgba(120,7,12,0)"/>
    </radialGradient>

    <!-- mottled depth: slow boiling low-frequency noise -->
    <filter id="depth" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="11" stitchTiles="stitch" result="n">
        <animate attributeName="baseFrequency" dur="36s" values="0.006 0.011;0.0072 0.013;0.006 0.011" repeatCount="indefinite"/>
      </feTurbulence>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.03  0 0 0 0 0.11  0 0 0 0 0.13  0 0 0 0.75 0"/>
    </filter>
    <!-- caustic shimmer: higher-frequency drifting teal light -->
    <filter id="caustic" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="2" seed="5" stitchTiles="stitch" result="n">
        <animate attributeName="baseFrequency" dur="19s" values="0.018 0.03;0.024 0.042;0.018 0.03" repeatCount="indefinite"/>
      </feTurbulence>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.20  0 0 0 0 0.74  0 0 0 0 0.74  0 0 0 0.55 0"/>
      <feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent="3.4" offset="0"/></feComponentTransfer>
    </filter>
    <!-- rough sandy texture for land -->
    <filter id="landtex" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09 0.12" numOctaves="3" seed="3" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0" result="t"/>
      <feComposite in="t" in2="SourceGraphic" operator="in" result="tx"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tx"/></feMerge>
    </filter>
    <filter id="surf" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <filter id="chumblur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4.5"/>
    </filter>`;
  chart.appendChild(defs);

  // --- water: base gradient + mottled depth + caustic shimmer ---
  chart.appendChild(el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"url(#sea)" }));
  const depth = el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"#0a2630", filter:"url(#depth)" });
  depth.style.mixBlendMode = "soft-light"; depth.style.opacity = ".9";
  chart.appendChild(depth);
  const caus = el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"#0c2a30", filter:"url(#caustic)" });
  caus.style.mixBlendMode = "screen"; caus.style.opacity = ".5";
  chart.appendChild(caus);

  // grid (faint nav lines under the texture)
  const g = el("g", { stroke:"#1a3a44", "stroke-width":.5, opacity:.3 });
  for (let lon=-150; lon<=150; lon+=30){ const p=proj(lon,0).x; g.appendChild(el("line",{x1:p,y1:0,x2:p,y2:VB.h})); }
  for (let lat=-60;  lat<=60;  lat+=30){ const p=proj(0,lat).y; g.appendChild(el("line",{x1:0,y1:p,x2:VB.w,y2:p})); }
  chart.appendChild(g);

  // land: surf-lit glow behind, textured sandy fill on top
  const surf = el("g", { filter:"url(#surf)" });
  const lg = el("g", { filter:"url(#landtex)" });
  LAND.forEach(poly => {
    const pts = poly.map(([lo,la]) => { const q=proj(lo,la); return q.x+","+q.y; }).join(" ");
    surf.appendChild(el("polygon", { points:pts, fill:"none", stroke:"#3f8f86", "stroke-width":2.6, "stroke-opacity":.5 }));
    lg.appendChild(el("polygon", { points:pts, fill:"url(#landg)", stroke:"#5a6e4a", "stroke-width":.8, "stroke-opacity":.8 }));
  });
  chart.appendChild(surf);
  chart.appendChild(lg);

  // sonar sweep centered on a north-atlantic hotspot
  const sc = proj(-55, 30);
  const sweep = el("g", { class:"sweep" });
  sweep.style.transformOrigin = `${sc.x}px ${sc.y}px`;
  sweep.appendChild(el("path", { d:`M${sc.x} ${sc.y} L${sc.x+420} ${sc.y} A420 420 0 0 1 ${sc.x+297} ${sc.y+297} Z`, fill:"url(#sweepg)" }));
  chart.appendChild(sweep);

  chart.appendChild(el("g", { id:"gore" }));
  chart.appendChild(el("g", { id:"trails" }));
  chart.appendChild(el("g", { id:"fins" }));
}

// ---------- per-frame render of trails + markers ----------
function render() {
  const gore = chart.querySelector('#gore'), trails = chart.querySelector('#trails'), fins = chart.querySelector('#fins');
  gore.innerHTML = ""; trails.innerHTML = ""; fins.innerHTML = "";
  const sp = document.getElementById('sp').value;
  let shown = 0;

  SHARKS.forEach(s => {
    if (sp !== "*" && s.species !== sp) return;
    const lp = lastPing(s); if (!lp) return;
    const t = parseTz(lp.tz_datetime);
    if (recentOnly && daysAgo(t) > 30) return;
    shown++;

    if (showTrails && s.pings.length > 1) {
      const pts = s.pings.map(p => { const q=proj(+p.longitude,+p.latitude); return q.x+","+q.y; }).join(" ");
      trails.appendChild(el("polyline", { points:pts, fill:"none", stroke:"#7a0b10", "stroke-width":1.4,
        "stroke-opacity":.55, "stroke-linejoin":"round", "stroke-dasharray":"1 5", "stroke-linecap":"round" }));
      s.pings.forEach(p => { const q=proj(+p.longitude,+p.latitude);
        trails.appendChild(el("circle", { cx:q.x, cy:q.y, r:1.3, fill:"#9c1118", "fill-opacity":.6 })); });
    }

    const q = proj(+lp.longitude, +lp.latitude);
    const hot = daysAgo(t) <= 14;
    const sel = selId === s.id;

    // blood in the water under fresh (hot) kills
    if (hot) {
      const cloud = el("ellipse", { class:"chum", cx:q.x, cy:q.y+2, rx:16, ry:10, fill:"url(#chum)", filter:"url(#chumblur)" });
      cloud.style.setProperty("--cd", (s.id % 5) * 0.7 + "s");
      gore.appendChild(cloud);
    }

    const grp = el("g", { class:"shark"+(sel?" sel":"")+(hot?" hot":""), transform:`translate(${q.x},${q.y})` });
    grp.dataset.id = s.id;

    grp.appendChild(el("circle", { class:"pulse", cx:0, cy:0, r:4, fill:"none", stroke:hot?"#e6201c":"#2fb6b6", "stroke-width":1.4 }));
    grp.appendChild(el("circle", { cx:0, cy:0, r:2.2, class:hot?"ping-now":"", fill:hot?"#e6201c":"#2fb6b6" }));

    const flip = bearingWest(s) ? -1 : 1;
    const holder = el("g", { transform:`translate(0,-1) scale(${flip},1)` });
    holder.innerHTML = sharkSVG(sel ? 0.9 : 0.64, hot);
    grp.appendChild(holder);

    const nm = el("text", { class:"nm", x:0, y:flip<0?22:-16, "text-anchor":"middle" });
    nm.textContent = (s.name || "Unknown").toUpperCase();
    grp.appendChild(nm);

    grp.addEventListener('click', () => select(s.id));
    fins.appendChild(grp);
  });

  document.getElementById('num').textContent = shown;
}

// ---------- dossier ----------
const dossier = document.getElementById('dossier');
function select(id) {
  selId = id;
  const s = SHARKS.find(x => x.id === id); if (!s) { render(); return; }
  const lp = lastPing(s); const t = parseTz(lp?.tz_datetime); const dd = daysAgo(t);
  document.getElementById('hint').style.display = 'none';
  document.getElementById('d-sp').textContent = (s.species || "").replace(/\s*\(.*\)/, '') || "Shark";
  document.getElementById('d-name').textContent = s.name || "Unknown";
  document.getElementById('d-len').textContent = s.length || "—";
  document.getElementById('d-wt').textContent = s.weight || "—";
  document.getElementById('d-sex').textContent = s.gender || "—";
  document.getElementById('d-stage').textContent = s.stageOfLife || "—";
  document.getElementById('d-tag').textContent = (s.tagDate || "—") + (s.tagLocation ? "  ·  " + s.tagLocation : "");
  document.getElementById('d-last').textContent = t ? (dd === 0 ? "Today" : dd + " day" + (dd>1?"s":"") + " ago") : "unknown";
  document.getElementById('d-pings').textContent = s.pings ? s.pings.length : 0;
  document.getElementById('d-pos').textContent = lp ? (Number(lp.latitude).toFixed(2) + ", " + Number(lp.longitude).toFixed(2)) : "—";
  document.getElementById('d-foot').textContent = dd <= 14 ? "Status: actively surfacing" : "Status: gone dark";
  dossier.classList.add('open');
  render();
}
document.getElementById('dx').addEventListener('click', () => {
  dossier.classList.remove('open'); selId = null;
  document.getElementById('hint').style.display = '';
  render();
});

// ---------- controls ----------
document.getElementById('swTrack').addEventListener('click', e => {
  e.currentTarget.classList.toggle('on');
  showTrails = e.currentTarget.classList.contains('on'); render();
});
document.getElementById('swRecent').addEventListener('click', e => {
  e.currentTarget.classList.toggle('on');
  recentOnly = e.currentTarget.classList.contains('on'); render();
});

// ---------- boot ----------
function boot() {
  const feed = document.getElementById('feed'), ft = document.getElementById('feedtxt');
  if (LIVE) { feed.classList.add('live'); ft.textContent = "Live feed · OCEARCH"; }
  else { feed.classList.add('demo'); ft.textContent = "Demo pod · no live feed"; }

  const sel = document.getElementById('sp');
  [...new Set(SHARKS.map(s => s.species))].sort().forEach(sp => {
    const o = document.createElement('option');
    o.value = sp; o.textContent = sp.replace(/\s*\(.*\)/, ''); sel.appendChild(o);
  });
  sel.addEventListener('change', render);

  drawBase();
  render();
}

load().then(boot);
