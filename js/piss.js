// piss.js — the ISS Piss-o-meter, tucked under Space Weather.
// A canvas tank of sloshing yellow tracking the ISS urine-reclaim cycle: a timed
// fill/recycle cycle, rising bubbles, a real-time "liters reclaimed" counter, and
// (when reachable) live ISS altitude + orbital speed from wheretheiss.at.
// Pure canvas — ships in every build (public repo AND the private bundle).

(function () {
  const cv = document.getElementById("pisstank");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() { const w = cv.clientWidth || 218, h = cv.clientHeight || 96; cv.width = w * dpr; cv.height = h * dpr; }
  size(); window.addEventListener("resize", size);

  const CREW = 7;                    // assumed crew aboard
  const L_PER_DAY = CREW * 1.5;      // ~1.5 L of urine per astronaut per day
  const t0 = Date.now();
  let bubbles = [];

  function fillLevel(now) {          // 45s cycle: fill to ~0.85, snap-recycle to ~0.15
    const p = ((now - t0) % 45000) / 45000;
    return p < 0.9 ? 0.15 + (p / 0.9) * 0.7 : 0.85 - ((p - 0.9) / 0.1) * 0.7;
  }
  function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); }
  function surfaceY(px, tw, surface, tilt, now) {
    return surface + Math.sin(px * 0.06 + now * 0.004) * 2.2 + Math.sin(px * 0.11 - now * 0.006) * 1.2 + tilt * ((px / tw) - 0.5) * 2;
  }

  function draw() {
    const w = cv.width / dpr, h = cv.height / dpr, now = Date.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const pad = 6, tw = w - pad * 2, th = h - pad * 2, x = pad, y = pad, rad = 8;

    ctx.beginPath(); rr(ctx, x, y, tw, th, rad); ctx.fillStyle = "#0a1116"; ctx.fill();
    ctx.save(); ctx.clip();

    const lvl = fillLevel(now), surface = y + th - th * lvl, tilt = Math.sin(now * 0.0011) * 4;
    ctx.beginPath(); ctx.moveTo(x, y + th);
    for (let px = 0; px <= tw; px += 4) ctx.lineTo(x + px, surfaceY(px, tw, surface, tilt, now));
    ctx.lineTo(x + tw, y + th); ctx.closePath();
    const g = ctx.createLinearGradient(0, surface, 0, y + th);
    g.addColorStop(0, "#f6e23c"); g.addColorStop(1, "#c39d12");
    ctx.fillStyle = g; ctx.fill();

    ctx.beginPath();
    for (let px = 0; px <= tw; px += 4) { const yy = surfaceY(px, tw, surface, tilt, now); px === 0 ? ctx.moveTo(x + px, yy) : ctx.lineTo(x + px, yy); }
    ctx.strokeStyle = "rgba(255,255,180,.55)"; ctx.lineWidth = 1; ctx.stroke();

    if (Math.random() < 0.09 && lvl > 0.05) bubbles.push({ x: x + 4 + Math.random() * (tw - 8), y: y + th - 2, r: 0.6 + Math.random() * 1.4, v: 0.2 + Math.random() * 0.55 });
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y -= b.v;
      if (b.y < surface + 1) { bubbles.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fillStyle = "rgba(255,240,150,.5)"; ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); rr(ctx, x, y, tw, th, rad); ctx.strokeStyle = "#1d3a44"; ctx.lineWidth = 1; ctx.stroke();
    requestAnimationFrame(draw);
  }
  draw();

  // live ISS garnish (optional; hides if unreachable)
  let issLine = "";
  async function issFlavor() {
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 7000);
      const j = await (await fetch("https://api.wheretheiss.at/v1/satellites/25544", { signal: c.signal })).json();
      clearTimeout(t);
      issLine = `<div class="trow"><span class="tn">ISS altitude</span><span class="tv">${Math.round(j.altitude)}<small>km</small></span></div>` +
        `<div class="trow"><span class="tn">Orbital speed</span><span class="tv">${Math.round(j.velocity).toLocaleString()}<small>km/h</small></span></div>`;
    } catch (e) { issLine = ""; }
  }
  issFlavor(); setInterval(issFlavor, 60000);

  function tick() {
    const el = document.getElementById("piss-rows"); if (!el) return;
    const secs = (Date.now() - t0) / 1000;
    const liters = secs * (L_PER_DAY / 86400);
    el.innerHTML =
      `<div class="airagg" style="color:#f6e23c">${Math.round(fillLevel(Date.now()) * 100)}%<small>tank · ${CREW} crew pissing aboard</small></div>` +
      `<div class="trow"><span class="tn">Reclaimed this session</span><span class="tv" style="color:#f6e23c">${liters.toFixed(2)}<small>L</small></span></div>` +
      issLine;
  }
  tick(); setInterval(tick, 1000);
})();
