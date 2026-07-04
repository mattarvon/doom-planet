// eyeball.js — the DOOM PLANET eyes. A hero eye beside the wordmark plus a row
// of unique bloodshot eyeballs filling the topbar. Every eye tracks the cursor
// independently (a wall of eyes converging on you), darts when idle, twitches,
// and drips blood into its own rippling puddle. Procedural + seeded, so every
// build renders the same wall. Ships identically public + private.

(function () {
  const brand = document.querySelector(".brand");
  if (!brand) return;

  function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

  // branching capillaries; roots/depth scale the gore (hero eye > row eyes)
  function veins(seed, roots, depth){
    const r = mul(seed);
    let paths = "";
    function branch(x,y,ang,len,w,d){
      if(d<=0||len<3) return;
      const nx = x+Math.cos(ang)*len, ny = y+Math.sin(ang)*len;
      const dc = Math.hypot(nx,ny);
      if(dc>46) return;
      const cx = x+Math.cos(ang+(r()-.5)*1.2)*len*.5, cy = y+Math.sin(ang+(r()-.5)*1.2)*len*.5;
      const col = r()<.5 ? "#a92a4e" : (r()<.5 ? "#8c2a68" : "#c03a3a");
      const op = (dc>40?.85:.55) - d*0.04;
      paths += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}" stroke="${col}" stroke-width="${w.toFixed(2)}" fill="none" opacity="${Math.max(.25,op).toFixed(2)}" stroke-linecap="round"/>`;
      branch(nx,ny,ang+(r()-.5)*1.1,len*(.62+r()*.25),w*.62,d-1);
      if(r()<.75) branch(nx,ny,ang+(r()<.5?1:-1)*(.5+r()*.9),len*(.5+r()*.3),w*.55,d-1);
    }
    for(let i=0;i<roots;i++){
      const a = (i/roots)*Math.PI*2 + (r()-.5)*.4;
      branch(Math.cos(a)*46, Math.sin(a)*46, a+Math.PI+(r()-.5)*.7, 10+r()*12, 1.9+r()*1.3, depth);
    }
    return paths;
  }

  const striations = tone => Array.from({length:26},(_,i)=>{
    const a=i/26*Math.PI*2;
    return `<line x1="${(Math.cos(a)*10).toFixed(1)}" y1="${(Math.sin(a)*10).toFixed(1)}" x2="${(Math.cos(a)*22).toFixed(1)}" y2="${(Math.sin(a)*22).toFixed(1)}" stroke="${tone}"/>`;
  }).join("");

  // shared gradient defs (url(#id) resolves document-wide) + 3 iris variants
  const defsHost = document.createElement("div");
  defsHost.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  defsHost.innerHTML = `<svg width="0" height="0"><defs>
    <radialGradient id="ebSc" cx="42%" cy="36%" r="72%">
      <stop offset="0" stop-color="#dfe6ef"/><stop offset="55%" stop-color="#bccadd"/>
      <stop offset="85%" stop-color="#93a6c4"/><stop offset="100%" stop-color="#6f7fa0"/>
    </radialGradient>
    <radialGradient id="ebIr" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#2a3a10"/><stop offset="38%" stop-color="#4d7d16"/>
      <stop offset="62%" stop-color="#8fd42e"/><stop offset="86%" stop-color="#5c9a1c"/>
      <stop offset="100%" stop-color="#1c3608"/>
    </radialGradient>
    <radialGradient id="ebIrY" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#3a3208"/><stop offset="38%" stop-color="#8a7a12"/>
      <stop offset="62%" stop-color="#d8c22e"/><stop offset="86%" stop-color="#9a8a18"/>
      <stop offset="100%" stop-color="#332a06"/>
    </radialGradient>
    <radialGradient id="ebIrR" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#3a0e06"/><stop offset="38%" stop-color="#8a2a10"/>
      <stop offset="62%" stop-color="#e0632e"/><stop offset="86%" stop-color="#9a3414"/>
      <stop offset="100%" stop-color="#330d04"/>
    </radialGradient>
    <radialGradient id="ebPu" cx="46%" cy="44%" r="60%">
      <stop offset="0" stop-color="#1a1408"/><stop offset="80%" stop-color="#0a0803"/><stop offset="100%" stop-color="#000"/>
    </radialGradient>
  </defs></svg>`;
  document.body.appendChild(defsHost);

  const IRIS = [
    { grad: "ebIr",  ring: "#16250a", stri: "#274d0c" },
    { grad: "ebIrY", ring: "#241f06", stri: "#4d420c" },
    { grad: "ebIrR", ring: "#240a04", stri: "#4d1c0c" },
  ];

  function eyeSVG(seed, opts){
    const rng = mul(seed);
    const iris = IRIS[opts.iris || 0];
    const stainOp = o => (o * (0.8 + rng() * 0.5)).toFixed(2);
    return `<svg viewBox="-52 -52 104 104">
      <circle r="49" fill="url(#ebSc)" stroke="#3d4c66" stroke-width="1.4"/>
      <circle r="47" fill="none" stroke="#8c1220" stroke-width="4.5" opacity=".38"/>
      <circle r="43" fill="none" stroke="#a92a3e" stroke-width="2.5" opacity=".22"/>
      <g fill="#7a0b10">
        <path d="M-44 -14 q8 -6 14 -2 q-2 8 -10 10 q-8 0 -4 -8 Z" opacity="${stainOp(.34)}"/>
        <path d="M30 -34 q10 -2 12 6 q-6 6 -14 2 q-4 -6 2 -8 Z" opacity="${stainOp(.3)}"/>
        <path d="M-30 30 q6 8 16 8 q-4 8 -14 4 q-8 -6 -2 -12 Z" opacity="${stainOp(.4)}"/>
        <path d="M38 22 q8 4 6 12 q-10 2 -14 -6 q2 -6 8 -6 Z" opacity="${stainOp(.36)}"/>
      </g>
      <g>${veins(seed, opts.roots, opts.depth)}</g>
      <path d="M-26 40 Q0 54 26 40 Q18 50 8 52 L8 60 Q4 54 2 52 Q-2 54 -6 62 L-8 52 Q-18 50 -26 40 Z" fill="#8c0a12"/>
      <path d="M-15 46 q-2 10 0 16 q3 -8 0 -16 Z" fill="#7a0b10" opacity=".85"/>
      <g class="eyelook">
        <circle r="24" fill="${iris.ring}"/>
        <circle r="23" fill="url(#${iris.grad})"/>
        <g stroke-width=".8" opacity=".65">${striations(iris.stri)}</g>
        <circle r="10.5" fill="url(#ebPu)"/>
        <circle cx="11" cy="-9" r="3.2" fill="#9fdcff" opacity=".95"/>
        <circle cx="13" cy="-7" r="1.2" fill="#fff"/>
      </g>
      <ellipse cx="-12" cy="-18" rx="18" ry="10" fill="#fff" opacity=".14" transform="rotate(-24 -12 -18)"/>
      <g class="ebGoreAnim">
        <ellipse cx="${(opts.puddle*.8).toFixed(1)}" cy="97.5" rx="${(opts.puddle*.34).toFixed(1)}" ry="${(opts.puddle*.1+1).toFixed(1)}" fill="#7a0b10" opacity=".7"/>
        <ellipse cx="${(-opts.puddle*.75).toFixed(1)}" cy="98" rx="${(opts.puddle*.22).toFixed(1)}" ry="${(opts.puddle*.08+.8).toFixed(1)}" fill="#6e060b" opacity=".65"/>
        <ellipse class="ebPuddle" cx="-2" cy="96" rx="${opts.puddle}" ry="${(opts.puddle*.3).toFixed(1)}" fill="#7a0b10" opacity=".92"/>
        <ellipse class="ebPuddleCore" cx="-2" cy="95" rx="${(opts.puddle*.6).toFixed(1)}" ry="${(opts.puddle*.18).toFixed(1)}" fill="#9c1118"/>
        <ellipse cx="-6" cy="94.5" rx="${(opts.puddle*.28).toFixed(1)}" ry="${(opts.puddle*.08).toFixed(1)}" fill="#c22030" opacity=".55"/>
        <circle class="ebDrop" r="2" fill="#b00710" opacity="0"/>
        <circle class="ebDrop" r="2" fill="#a30912" opacity="0"/>
      </g>
    </svg>`;
  }

  const EYES = [];   // {holder, look, drops:[{el,x,y,per,off,prev}], puddle, core, cx,cy,tx,ty, nextDart, twitchUntil, lastSplash}
  function makeEye(seed, size, opts, parent, before){
    const holder = document.createElement("div");
    holder.className = "eyeball";
    holder.style.width = holder.style.height = size + "px";
    holder.innerHTML = eyeSVG(seed, opts);
    before ? parent.insertBefore(holder, before) : parent.appendChild(holder);
    const rng = mul(seed ^ 0xBEEF);
    const drops = [...holder.querySelectorAll(".ebDrop")].map((el, i) => ({
      el, x: [2, -8][i], y: [56, 60][i],
      per: 2600 + rng() * 4200, off: rng(), prev: 0,
    }));
    EYES.push({
      holder, look: holder.querySelector(".eyelook"), drops,
      puddle: holder.querySelector(".ebPuddle"), core: holder.querySelector(".ebPuddleCore"),
      basePud: opts.puddle,
      cx: 0, cy: 0, tx: 0, ty: 0, nextDart: Date.now() + 1500 + rng() * 3000, twitchUntil: 0, lastSplash: 0,
    });
  }

  // hero eye: full gore, left of the wordmark
  makeEye(1337, 58, { roots: 42, depth: 6, iris: 0, puddle: 30 }, brand, brand.lastElementChild);

  // the row: fills the topbar gap right of the logo, one unique eye per slot
  const row = document.getElementById("eyerow");
  function buildRow(){
    if (!row) return;
    // rebuild only when the slot count changes
    const count = Math.max(0, Math.min(14, Math.floor((row.clientWidth - 8) / 52)));
    if (count === row.childElementCount) return;
    // drop old row eyes from the registry, then re-make
    for (let i = EYES.length - 1; i >= 1; i--) EYES.splice(i, 1);
    row.innerHTML = "";
    for (let i = 0; i < count; i++){
      const seed = 7001 + i * 131;
      const iris = [0,0,1,0,2,0,1,0,0,2,0,1,0,2][i % 14];
      makeEye(seed, 44, { roots: 20, depth: 4, iris, puddle: 20 }, row, null);
    }
  }
  buildRow();
  let rsT; window.addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(buildRow, 250); });

  // ---- shared animation: tracking + darts + twitch + drips ----
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const MAX = 14, PUDDLE_Y = 94;
  let lastInput = 0;

  function aimAll(clientX, clientY){
    lastInput = Date.now();
    for (const e of EYES){
      const r = e.holder.getBoundingClientRect();
      if (!r.width) continue;
      const dx = clientX - (r.left + r.width / 2), dy = clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, m = Math.min(d / 60, 1) * MAX;
      e.tx = dx / d * m; e.ty = dy / d * m;
    }
  }
  document.addEventListener("mousemove", ev => aimAll(ev.clientX, ev.clientY), { passive: true });
  document.addEventListener("touchstart", ev => { const t = ev.touches[0]; if (t) aimAll(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener("touchmove", ev => { const t = ev.touches[0]; if (t) aimAll(t.clientX, t.clientY); }, { passive: true });

  (function frame(){
    const now = Date.now();
    for (const e of EYES){
      if (now - lastInput > 4000 && now > e.nextDart){     // idle: every eye wanders on its own
        const a = Math.random() * Math.PI * 2, m = Math.random() * MAX;
        e.tx = Math.cos(a) * m; e.ty = Math.sin(a) * m;
        e.nextDart = now + 1200 + Math.random() * 3500;
        if (Math.random() < .3) e.twitchUntil = now + 200;
      }
      e.cx += (e.tx - e.cx) * .16; e.cy += (e.ty - e.cy) * .16;
      const jx = now < e.twitchUntil ? (Math.random() - .5) * 2.6 : 0;
      const jy = now < e.twitchUntil ? (Math.random() - .5) * 2.6 : 0;
      e.look.setAttribute("transform", `translate(${(e.cx + jx).toFixed(2)} ${(e.cy + jy).toFixed(2)})`);

      for (const d of e.drops){
        const t = ((now + d.off * d.per) % d.per) / d.per;
        if (t < 0.3){
          d.el.setAttribute("cx", d.x); d.el.setAttribute("cy", d.y);
          d.el.setAttribute("r", (0.8 + (t / 0.3) * 1.6).toFixed(2));
          d.el.setAttribute("opacity", ".95");
        } else if (t < 0.78){
          const p = (t - 0.3) / 0.48;
          d.el.setAttribute("cy", (d.y + (PUDDLE_Y - d.y) * p * p).toFixed(1));
          d.el.setAttribute("r", "2.3");
          d.el.setAttribute("opacity", ".95");
        } else {
          d.el.setAttribute("opacity", "0");
        }
        if (d.prev < 0.78 && t >= 0.78) e.lastSplash = now;
        d.prev = t;
      }
      const sp = Math.max(0, 1 - (now - e.lastSplash) / 450);
      e.puddle.setAttribute("rx", (e.basePud + sp * e.basePud * .22).toFixed(2));
      e.puddle.setAttribute("ry", (e.basePud * .3 + sp * e.basePud * .08).toFixed(2));
      e.core.setAttribute("rx", (e.basePud * .6 + sp * e.basePud * .16).toFixed(2));
    }
    requestAnimationFrame(frame);
  })();
})();
