// meatspace.js — Konami-code MEATSPACE mode. Everything wet, dripping, veined,
// and swarming with flies. Session-sticky within the tab so a reload keeps the
// gore up. Enter: ↑ ↑ ↓ ↓ ← → ← → B A. Type it again to purge.
// Console hook: window.__meatspace.on() / .off() / .toggle() for testing.

(function () {
  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  const KEY = "meatspace";
  let buf = [];

  window.addEventListener("keydown", e => {
    if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
    const k = (e.key || "").toLowerCase();
    buf.push(k);
    if (buf.length > KONAMI.length) buf.shift();
    if (buf.length === KONAMI.length && buf.every((v, i) => v === KONAMI[i])) {
      toggle(); buf = [];
    }
  });

  function toggle() { document.body.classList.contains("meatspace") ? disable() : enable(); }
  function enable() {
    document.body.classList.add("meatspace");
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    mount(); flash("MEATSPACE ENABLED");
  }
  function disable() {
    document.body.classList.remove("meatspace");
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    unmount(); flash("purged");
  }

  // ===================== overlays =====================
  let rafId = 0, spatterTimer = 0, mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  window.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });

  function mount() {
    if (document.getElementById("ms-layer")) return;
    const layer = document.createElement("div");
    layer.id = "ms-layer";
    layer.innerHTML =
      `<div class="ms-meat"></div>
       <div class="ms-veins">${veinsSVG()}</div>
       <div class="ms-drips ms-drips-top">${dripsSVG(22, false)}</div>
       <div class="ms-drips ms-drips-bot">${dripsSVG(28, true)}</div>
       <div class="ms-flies"></div>
       <div class="ms-spatters"></div>`;
    document.body.appendChild(layer);

    const flies = layer.querySelector(".ms-flies");
    for (let i = 0; i < 7; i++) {
      const f = document.createElement("div");
      f.className = "ms-fly";
      f.style.setProperty("--wob", (0.4 + Math.random() * 1.2).toFixed(2));
      flies.appendChild(f);
    }
    tail(flies);
    scheduleSpatter(layer.querySelector(".ms-spatters"));
  }

  function unmount() {
    const layer = document.getElementById("ms-layer");
    if (layer) layer.remove();
    if (rafId) cancelAnimationFrame(rafId), (rafId = 0);
    if (spatterTimer) clearTimeout(spatterTimer), (spatterTimer = 0);
  }

  // cursor-tracking swarm — springy, wobbly, buzzy
  function tail(container) {
    const flies = [...container.children];
    const pos = flies.map(() => ({ x: mouseX, y: mouseY, vx: 0, vy: 0 }));
    const step = () => {
      const now = performance.now() * 0.001;
      flies.forEach((f, i) => {
        const p = pos[i];
        const wob = +f.style.getPropertyValue("--wob") || 1;
        const tx = mouseX + Math.cos(now * 1.3 + i * 1.7) * 42 * wob;
        const ty = mouseY + Math.sin(now * 1.7 + i * 2.1) * 34 * wob;
        p.vx = p.vx * 0.85 + (tx - p.x) * 0.045 + (Math.random() - 0.5) * 0.8;
        p.vy = p.vy * 0.85 + (ty - p.y) * 0.045 + (Math.random() - 0.5) * 0.8;
        p.x += p.vx; p.y += p.vy;
        f.style.transform = `translate3d(${(p.x - 3).toFixed(1)}px, ${(p.y - 3).toFixed(1)}px, 0)`;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function scheduleSpatter(host) {
    const spawn = () => {
      const s = document.createElement("div");
      s.className = "ms-spatter";
      s.style.left = (Math.random() * 92 + 4) + "vw";
      s.style.top = (Math.random() * 80 + 8) + "vh";
      const rot = Math.floor(Math.random() * 360);
      const scale = (0.55 + Math.random() * 1.2).toFixed(2);
      s.style.setProperty("--rot", rot + "deg");
      s.style.setProperty("--scl", scale);
      s.innerHTML = spatterSVG();
      host.appendChild(s);
      setTimeout(() => s.remove(), 8500);
      spatterTimer = setTimeout(spawn, 2200 + Math.random() * 5200);
    };
    spatterTimer = setTimeout(spawn, 800);
  }

  // ===================== SVG factories =====================
  function veinsSVG() {
    const w = 320, h = 320;
    let paths = "";
    for (let i = 0; i < 10; i++) {
      let x = Math.random() * w, y = Math.random() * h;
      let d = `M ${x.toFixed(0)},${y.toFixed(0)}`;
      for (let k = 0; k < 5; k++) {
        const cx = (Math.random() - 0.5) * 90, cy = (Math.random() - 0.5) * 90;
        const nx = (Math.random() - 0.5) * 130, ny = (Math.random() - 0.5) * 130;
        d += ` q ${cx.toFixed(0)},${cy.toFixed(0)} ${nx.toFixed(0)},${ny.toFixed(0)}`;
      }
      const sw = (0.7 + Math.random() * 1.5).toFixed(1);
      const op = (0.35 + Math.random() * 0.45).toFixed(2);
      const col = Math.random() < 0.5 ? "#7a0b10" : "#5a0006";
      paths += `<path d="${d}" stroke="${col}" stroke-width="${sw}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id="msvp" x="0" y="0" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${paths}</pattern></defs>
      <rect width="100%" height="100%" fill="url(#msvp)"/></svg>`;
  }

  // hanging tongues: 100-unit wide viewbox, rendered non-uniformly to viewport width
  function dripsSVG(count, flip) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const x = 3 + Math.random() * 94;
      const w = 1.2 + Math.random() * 2.6;
      const h = 6 + Math.random() * 26;
      const dur = (5 + Math.random() * 8).toFixed(2);
      const dly = (Math.random() * 8).toFixed(2);
      const y0 = flip ? 40 : 0;
      const sign = flip ? -1 : 1;
      const yEnd = y0 + sign * h;
      const cy = y0 + sign * (h * 0.4);
      items.push(
        `<path d="M ${(x - w / 2).toFixed(1)} ${y0} Q ${(x - w * 0.25).toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${yEnd.toFixed(1)} Q ${(x + w * 0.25).toFixed(1)} ${cy.toFixed(1)} ${(x + w / 2).toFixed(1)} ${y0} Z" fill="#7a0b10">
          <animate attributeName="opacity" values="0.85;1;.9;1;.85" dur="${dur}s" begin="${dly}s" repeatCount="indefinite"/>
        </path>`
      );
      // occasional falling bead
      if (Math.random() < 0.35) {
        const bDur = (2 + Math.random() * 3.5).toFixed(2);
        items.push(
          `<circle cx="${x.toFixed(1)}" cy="${yEnd.toFixed(1)}" r="0.9" fill="#7a0b10" opacity="0">
             <animate attributeName="cy" from="${yEnd}" to="${flip ? -8 : 100}" dur="${bDur}s" begin="${dly}s" repeatCount="indefinite"/>
             <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="${bDur}s" begin="${dly}s" repeatCount="indefinite"/>
             <animate attributeName="r" values="0.7;1.2;1.4" dur="${bDur}s" begin="${dly}s" repeatCount="indefinite"/>
           </circle>`
        );
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height="100%">${items.join("")}</svg>`;
  }

  function spatterSVG() {
    const dots = [`<circle cx="50" cy="50" r="${(6 + Math.random() * 6).toFixed(1)}" fill="#7a0b10" opacity=".95"/>`];
    const n = 12 + Math.floor(Math.random() * 12);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 1.6) * 40;
      const cr = (0.9 + Math.random() * 3.2).toFixed(1);
      dots.push(`<circle cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(50 + Math.sin(a) * r).toFixed(1)}" r="${cr}" fill="#7a0b10" opacity="${(0.45 + Math.random() * 0.5).toFixed(2)}"/>`);
    }
    // tendrils
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const r1 = 8 + Math.random() * 8, r2 = r1 + 8 + Math.random() * 24;
      dots.push(`<line x1="${(50 + Math.cos(a) * r1).toFixed(1)}" y1="${(50 + Math.sin(a) * r1).toFixed(1)}" x2="${(50 + Math.cos(a) * r2).toFixed(1)}" y2="${(50 + Math.sin(a) * r2).toFixed(1)}" stroke="#7a0b10" stroke-width="${(0.6 + Math.random() * 1.4).toFixed(1)}" opacity=".7" stroke-linecap="round"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="160" height="160">${dots.join("")}</svg>`;
  }

  // ===================== toast =====================
  function flash(msg) {
    const t = document.createElement("div");
    t.className = "ms-toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => t.classList.remove("on"), 1500);
    setTimeout(() => t.remove(), 2300);
  }

  // ===================== restore + hook =====================
  function restore() {
    try {
      if (sessionStorage.getItem(KEY) === "1") {
        document.body.classList.add("meatspace"); mount();
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restore);
  else restore();

  window.__meatspace = { on: enable, off: disable, toggle };
})();
