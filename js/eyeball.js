// eyeball.js — the DOOM PLANET eyeball. Procedurally-veined icy sclera, toxic
// green iris, cyan glint. The pupil TRACKS THE CURSOR (it watches you work),
// darts on its own when idle, and twitches now and then. Pure SVG — ships
// identically in the public site and the private bundle.

(function () {
  const brand = document.querySelector(".brand");
  if (!brand) return;

  function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

  // branching capillaries, seeded so every build renders the same eye
  function veins(seed){
    const r = mul(seed);
    let paths = "";
    function branch(x,y,ang,len,w,depth){
      if(depth<=0||len<3) return;
      const nx = x+Math.cos(ang)*len, ny = y+Math.sin(ang)*len;
      const dc = Math.hypot(nx,ny);
      if(dc>46) return;
      const cx = x+Math.cos(ang+(r()-.5)*1.2)*len*.5, cy = y+Math.sin(ang+(r()-.5)*1.2)*len*.5;
      const col = r()<.5 ? "#a92a4e" : (r()<.5 ? "#8c2a68" : "#c03a3a");
      const op = (dc>40?.85:.55) - depth*0.04;
      paths += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}" stroke="${col}" stroke-width="${w.toFixed(2)}" fill="none" opacity="${Math.max(.25,op).toFixed(2)}" stroke-linecap="round"/>`;
      branch(nx,ny,ang+(r()-.5)*1.1,len*(.62+r()*.25),w*.62,depth-1);
      if(r()<.75) branch(nx,ny,ang+(r()<.5?1:-1)*(.5+r()*.9),len*(.5+r()*.3),w*.55,depth-1);
    }
    for(let i=0;i<26;i++){
      const a = (i/26)*Math.PI*2 + (r()-.5)*.4;
      branch(Math.cos(a)*46, Math.sin(a)*46, a+Math.PI+(r()-.5)*.7, 9+r()*10, 1.5+r()*.9, 5);
    }
    return paths;
  }

  const striations = Array.from({length:26},(_,i)=>{
    const a=i/26*Math.PI*2;
    return `<line x1="${(Math.cos(a)*10).toFixed(1)}" y1="${(Math.sin(a)*10).toFixed(1)}" x2="${(Math.cos(a)*22).toFixed(1)}" y2="${(Math.sin(a)*22).toFixed(1)}"/>`;
  }).join("");

  const holder = document.createElement("div");
  holder.className = "eyeball";
  holder.innerHTML = `<svg viewBox="-52 -52 104 104">
    <defs>
      <radialGradient id="ebSc" cx="42%" cy="36%" r="72%">
        <stop offset="0" stop-color="#dfe6ef"/><stop offset="55%" stop-color="#bccadd"/>
        <stop offset="85%" stop-color="#93a6c4"/><stop offset="100%" stop-color="#6f7fa0"/>
      </radialGradient>
      <radialGradient id="ebIr" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#2a3a10"/><stop offset="38%" stop-color="#4d7d16"/>
        <stop offset="62%" stop-color="#8fd42e"/><stop offset="86%" stop-color="#5c9a1c"/>
        <stop offset="100%" stop-color="#1c3608"/>
      </radialGradient>
      <radialGradient id="ebPu" cx="46%" cy="44%" r="60%">
        <stop offset="0" stop-color="#1a1408"/><stop offset="80%" stop-color="#0a0803"/><stop offset="100%" stop-color="#000"/>
      </radialGradient>
    </defs>
    <circle r="49" fill="url(#ebSc)" stroke="#3d4c66" stroke-width="1.4"/>
    <g>${veins(1337)}</g>
    <g class="eyelook">
      <circle r="24" fill="#16250a"/>
      <circle r="23" fill="url(#ebIr)"/>
      <g stroke="#274d0c" stroke-width=".8" opacity=".65">${striations}</g>
      <circle r="10.5" fill="url(#ebPu)"/>
      <circle cx="11" cy="-9" r="3.2" fill="#9fdcff" opacity=".95"/>
      <circle cx="13" cy="-7" r="1.2" fill="#fff"/>
    </g>
    <ellipse cx="-12" cy="-18" rx="18" ry="10" fill="#fff" opacity=".14" transform="rotate(-24 -12 -18)"/>
  </svg>`;
  // sits immediately left of the wordmark (logo art, if any, goes further left)
  brand.insertBefore(holder, brand.lastElementChild);

  // ---- the look: cursor tracking + idle darts + twitch ----
  const look = holder.querySelector(".eyelook");
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX = 14;                 // how far the iris can wander (svg units)
  let tx = 0, ty = 0, cx = 0, cy = 0, lastInput = 0, nextDart = Date.now() + 2500, twitchUntil = 0;

  function aimAt(clientX, clientY) {
    const r = holder.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2), dy = clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, m = Math.min(d / 60, 1) * MAX;
    tx = dx / d * m; ty = dy / d * m; lastInput = Date.now();
  }
  document.addEventListener("mousemove", e => aimAt(e.clientX, e.clientY), { passive: true });
  document.addEventListener("touchstart", e => { const t = e.touches[0]; if (t) aimAt(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener("touchmove", e => { const t = e.touches[0]; if (t) aimAt(t.clientX, t.clientY); }, { passive: true });

  (function frame() {
    const now = Date.now();
    if (now - lastInput > 4000 && now > nextDart) {   // nobody's moving — look around
      const a = Math.random() * Math.PI * 2, m = Math.random() * MAX;
      tx = Math.cos(a) * m; ty = Math.sin(a) * m;
      nextDart = now + 1200 + Math.random() * 3500;
      if (Math.random() < .3) twitchUntil = now + 200;
    }
    cx += (tx - cx) * .16; cy += (ty - cy) * .16;
    const jx = now < twitchUntil ? (Math.random() - .5) * 2.6 : 0;
    const jy = now < twitchUntil ? (Math.random() - .5) * 2.6 : 0;
    look.setAttribute("transform", `translate(${(cx + jx).toFixed(2)} ${(cy + jy).toFixed(2)})`);
    requestAnimationFrame(frame);
  })();
})();
