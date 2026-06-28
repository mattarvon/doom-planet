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
    <radialGradient id="sea" cx="50%" cy="34%" r="85%">
      <stop offset="0" stop-color="#11454f"/><stop offset="40%" stop-color="#0a2730"/>
      <stop offset="75%" stop-color="#06121a"/><stop offset="100%" stop-color="#02060a"/>
    </radialGradient>
    <radialGradient id="sweepg" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(47,182,182,.0)"/><stop offset="80%" stop-color="rgba(47,182,182,.06)"/>
      <stop offset="100%" stop-color="rgba(47,182,182,.26)"/>
    </radialGradient>
    <linearGradient id="landg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a4a2c"/><stop offset="55%" stop-color="#26331e"/><stop offset="1" stop-color="#151e13"/>
    </linearGradient>
    <radialGradient id="chum" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(160,8,12,.62)"/><stop offset="55%" stop-color="rgba(125,7,12,.26)"/>
      <stop offset="100%" stop-color="rgba(125,7,12,0)"/>
    </radialGradient>

    <!-- ===== shark material gradients (reused by every marker) ===== -->
    <linearGradient id="gHide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#444b53"/><stop offset="44%" stop-color="#6b737b"/>
      <stop offset="62%" stop-color="#9aa0a3"/><stop offset="100%" stop-color="#c3c7c4"/>
    </linearGradient>
    <linearGradient id="gBelly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef0ec"/><stop offset="100%" stop-color="#c2c8c2"/>
    </linearGradient>
    <linearGradient id="gDorsal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#373d44"/><stop offset="100%" stop-color="#5b626a"/>
    </linearGradient>
    <radialGradient id="gSnout" cx="42%" cy="26%" r="68%">
      <stop offset="0" stop-color="#b3b9b9" stop-opacity=".55"/><stop offset="100%" stop-color="#b3b9b9" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gGum" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c43350"/><stop offset="100%" stop-color="#7d1020"/>
    </linearGradient>
    <radialGradient id="gThroat" cx="60%" cy="42%" r="62%">
      <stop offset="0" stop-color="#3c0509"/><stop offset="100%" stop-color="#100203"/>
    </radialGradient>
    <linearGradient id="gTooth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="100%" stop-color="#d6cfbf"/>
    </linearGradient>

    <!-- lit, rippled ocean surface: noise as a height-map, lit once + cached.
         (static on purpose — animating lighting filters murders the framerate;
          surface motion comes from the cheap CSS-driven #glint overlay below) -->
    <filter id="ocean" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="3" seed="8" stitchTiles="stitch" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="2.4" diffuseConstant="1.05" lighting-color="#2c6f77" result="diff">
        <feDistantLight azimuth="240" elevation="52"/>
      </feDiffuseLighting>
      <feSpecularLighting in="n" surfaceScale="3" specularConstant="0.85" specularExponent="22" lighting-color="#d2eff3" result="spec">
        <fePointLight x="320" y="120" z="170"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="diff" operator="in" result="specC"/>
      <feMerge><feMergeNode in="diff"/><feMergeNode in="specC"/></feMerge>
    </filter>
    <radialGradient id="glint" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(210,240,243,.18)"/><stop offset="55%" stop-color="rgba(190,228,233,.05)"/>
      <stop offset="100%" stop-color="rgba(190,228,233,0)"/>
    </radialGradient>

    <!-- terrain relief lighting for land -->
    <filter id="relief" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.055" numOctaves="4" seed="3" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="2" diffuseConstant="1.15" lighting-color="#8a975f" result="lit">
        <feDistantLight azimuth="235" elevation="58"/>
      </feDiffuseLighting>
      <feComposite in="lit" in2="SourceGraphic" operator="in" result="litC"/>
      <feBlend in="SourceGraphic" in2="litC" mode="multiply"/>
    </filter>

    <filter id="surf" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6"/></filter>
    <filter id="chumblur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.5"/></filter>`;
  chart.appendChild(defs);

  // --- water: dark base + lit rippled ocean surface ---
  chart.appendChild(el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"url(#sea)" }));
  const ocean = el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"#0b2a30", filter:"url(#ocean)" });
  ocean.style.mixBlendMode = "screen"; ocean.style.opacity = ".7";
  chart.appendChild(ocean);
  // re-darken the depths so the surface light reads against shadow
  const deep = el("rect", { x:0, y:0, width:VB.w, height:VB.h, fill:"url(#sea)" });
  deep.style.mixBlendMode = "multiply"; deep.style.opacity = ".4";
  chart.appendChild(deep);
  // cheap drifting sun-glint (GPU transform, no filter recompute)
  const glint = el("ellipse", { class:"glint", cx:0, cy:0, rx:300, ry:140, fill:"url(#glint)" });
  glint.style.mixBlendMode = "screen";
  chart.appendChild(glint);

  // grid (faint nav lines under the texture)
  const g = el("g", { stroke:"#1a3a44", "stroke-width":.5, opacity:.22 });
  for (let lon=-150; lon<=150; lon+=30){ const p=proj(lon,0).x; g.appendChild(el("line",{x1:p,y1:0,x2:p,y2:VB.h})); }
  for (let lat=-60;  lat<=60;  lat+=30){ const p=proj(0,lat).y; g.appendChild(el("line",{x1:0,y1:p,x2:VB.w,y2:p})); }
  chart.appendChild(g);

  // land: blurred surf foam behind, terrain-lit fill on top
  const surf = el("g", { filter:"url(#surf)" });
  const lg = el("g", { filter:"url(#relief)" });
  LAND.forEach(poly => {
    const pts = poly.map(([lo,la]) => { const q=proj(lo,la); return q.x+","+q.y; }).join(" ");
    surf.appendChild(el("polygon", { points:pts, fill:"none", stroke:"#cfeef0", "stroke-width":3, "stroke-opacity":.3 }));
    lg.appendChild(el("polygon", { points:pts, fill:"url(#landg)", stroke:"#4a5a38", "stroke-width":.8, "stroke-opacity":.85 }));
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
    holder.innerHTML = sharkSVG(sel ? 1.0 : 0.68, hot);
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
