// shark.js — the snarling shark marker. Faces +x; flip horizontally to head west.
// Globals: sharkSVG(), bearingWest()

// build a row of conical teeth along a jaw line.
// x0..x1 span, y = gum line, dir = +1 teeth point down / -1 point up, n = count
function teethRow(x0, y, x1, dir, n) {
  let s = "";
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + step * (i + 0.5);
    const w = step * 0.46;
    const len = (4.4 - i * 0.18) * dir;          // front teeth longest, megalodon-size
    s += `<polygon points="${(x-w).toFixed(1)},${y} ${(x+w).toFixed(1)},${y} ${x.toFixed(1)},${(y+len).toFixed(1)}"`
       + ` fill="url(#gTooth)" stroke="#a89f8c" stroke-width=".2"/>`;
  }
  return s;
}

function sharkSVG(scale, hot) {
  return `
  <g class="body" transform="scale(${scale})">
    <!-- caudal fin: big lunate megalodon tail -->
    <g class="tail" style="transform-box:fill-box;transform-origin:90% 50%">
      <path d="M-34 0 Q-50 -6 -70 -27 Q-63 -18 -60 -9 Q-58 -3 -58 0 Q-58 4 -60 10 Q-63 20 -70 30 Q-52 8 -34 1 Z"
            fill="url(#gDorsal)" stroke="#0f1319" stroke-width=".5"/>
    </g>
    <!-- pelvic + pectoral fins -->
    <path d="M-18 8 Q-23 17 -12 15 Q-14 10 -18 8 Z" fill="url(#gDorsal)" stroke="#0f1319" stroke-width=".4"/>
    <path d="M-2 6 Q-15 27 11 20 Q6 11 -2 6 Z" fill="url(#gDorsal)" stroke="#0f1319" stroke-width=".4"/>
    <!-- tall dorsal fin -->
    <path d="M-14 -12 Q-3 -41 17 -12 Q0 -15 -14 -12 Z" fill="url(#gDorsal)" stroke="#0c1015" stroke-width=".5"/>
    <!-- bulky countershaded body -->
    <path d="M-40 -2 Q-38 -15 -18 -17 Q7 -18 31 -14 Q47 -11 53 -3 Q51 -1 47 0 L18 -3 Q4 -3 -6 0 Q-24 5 -40 3 Z"
          fill="url(#gHide)" stroke="#11151b" stroke-width=".7"/>
    <!-- top-of-back highlight -->
    <path d="M-30 -11 Q-4 -15 26 -11 Q0 -10 -30 -8 Z" fill="#aeb4b8" opacity=".16"/>
    <!-- pale belly -->
    <path d="M-38 3 Q-20 8 -4 9 Q14 10 30 7 Q41 6 48 8 Q43 10 33 10 Q10 12 -10 11 Q-26 10 -38 5 Z"
          fill="url(#gBelly)" stroke="#9aa39a" stroke-width=".3" stroke-opacity=".5"/>
    <!-- snout sheen -->
    <path d="M16 -14 Q43 -13 53 -3 Q46 -8 29 -9 Q20 -11 16 -14 Z" fill="url(#gSnout)"/>
    <!-- gill slits -->
    <g stroke="#0d121a" stroke-width=".7" opacity=".5" fill="none">
      <path d="M-22 -9 q-3 8 -1 16"/><path d="M-17 -10 q-3 8 -1 17"/>
      <path d="M-12 -10 q-3 8 -1 17"/><path d="M-7 -10 q-3 8 -1 16"/><path d="M-2 -9 q-3 7 -1 14"/>
    </g>
    <!-- ampullae pores -->
    <g fill="#141920" opacity=".45">
      <circle cx="31" cy="-10" r=".5"/><circle cx="36" cy="-8" r=".5"/><circle cx="41" cy="-6" r=".5"/>
      <circle cx="45" cy="-4" r=".5"/><circle cx="38" cy="-10" r=".5"/><circle cx="28" cy="-11" r=".5"/>
    </g>
    <!-- gaping throat -->
    <path d="M14 -4 Q37 -5 50 -1 Q45 12 23 14 Q14 11 13 3 Z" fill="url(#gThroat)"/>
    <!-- upper gum + teeth -->
    <path d="M14 -4 Q31 -7 50 -4 Q43 -1 30 -1 Q19 -1 14 0 Z" fill="url(#gGum)"/>
    ${teethRow(16, -1.6, 49, 1, 9)}
    ${hot ? `<path d="M17 -1 Q30 3 48 0 Q32 4 19 3 Z" fill="#7d0a10" opacity=".5"/>` : ``}
    <!-- lower jaw (chomps): gum, teeth, gore -->
    <g class="jaw" style="transform-box:fill-box;transform-origin:6% 14%">
      <path d="M13 3 Q32 14 50 6 Q45 17 24 17 Q14 14 13 8 Z" fill="url(#gHide)" stroke="#11151b" stroke-width=".5"/>
      <path d="M14 4 Q32 12 49 6 Q41 14 26 14 Q16 12 14 8 Z" fill="url(#gGum)"/>
      ${teethRow(16, 7, 48, -1, 9)}
      ${hot ? `<path class="gdrip" d="M31 14 q-1.8 8 0 12 q1.8 -5 0 -12 Z" fill="#b00710"/>` : ``}
    </g>
    <!-- deep-set pissed-off eye -->
    <path d="M18 -11 Q25 -14 31 -11" stroke="#0a0d10" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
    <circle cx="25" cy="-8" r="2.8" fill="#070a0b"/>
    <circle cx="25" cy="-8" r="2.8" fill="none" stroke="#2c3236" stroke-width=".5"/>
    <circle cx="24" cy="-9" r=".8" fill="#b6c0c4" opacity=".85"/>
    ${hot ? `<circle class="eye" cx="25" cy="-8" r="3.6" fill="none" stroke="#ff2a1e" stroke-width=".9" opacity="0"/>` : ``}
    <!-- battle scars -->
    <g stroke="#d2d7d3" stroke-width=".4" opacity=".26" fill="none" stroke-linecap="round">
      <path d="M33 -11 l5 1"/><path d="M23 -12 l4 -1"/><path d="M-6 -13 l6 1"/>
    </g>
    ${hot ? `<circle class="bloodbead" cx="42" cy="15" r="1.6" fill="#8c060b"/>` : ``}
    <!-- the shark's own deck-flopper, mounted at the belly (painted last = on top) -->
    <g class="sdickv" style="--fd:${((scale * 100) % 4) * 0.09}s" transform="translate(-8,11) scale(.6)">${partDick()}</g>
  </g>`;
}

// true if the shark's last leg trended west (so we mirror the marker)
function bearingWest(s) {
  const p = s.pings;
  if (!p || p.length < 2) return false;
  return (+p[p.length - 1].longitude) < (+p[p.length - 2].longitude);
}

// ---- floating body parts (campy chum) ----------------------------------
// each returns small SVG art centered on (0,0); goreField() places + animates it.
function partArm() {
  return `<g>
    <path d="M-8 0 C-3 -3 5 -3 10 0 C13 2 15 1 17 0" fill="none" stroke="url(#gSkin)" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M17 0 l3 -2 m-3 2 l3.4 0 m-3.4 1 l3 2" stroke="url(#gSkin)" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <circle cx="-8" cy="0" r="2.7" fill="#7d0a10"/><circle cx="-8" cy="0" r="1.2" fill="#f0ead8"/>
  </g>`;
}
function partLeg() {
  return `<g>
    <path d="M-9 -3 C-3 -2 5 0 11 4 C12 5 12 6 12 8" fill="none" stroke="url(#gSkin)" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M10 9 q6 0 8 2 q-1 2.4 -4.5 2.4 q-3.5 0 -4.5 -2.4 Z" fill="url(#gSkin)" stroke="#a9744f" stroke-width=".4"/>
    <circle cx="-9" cy="-3" r="2.9" fill="#7d0a10"/><circle cx="-9" cy="-3" r="1.3" fill="#f0ead8"/>
  </g>`;
}
function partBone() {
  return `<g fill="url(#gBone)" stroke="#b3ab95" stroke-width=".4">
    <circle cx="-7" cy="-2.2" r="2.4"/><circle cx="-7" cy="2.2" r="2.4"/>
    <rect x="-7" y="-1.7" width="14" height="3.4" rx="1.6"/>
    <circle cx="7" cy="-2.2" r="2.4"/><circle cx="7" cy="2.2" r="2.4"/>
  </g>`;
}
function partFlesh() {
  return `<g>
    <path d="M0 -5 q6 -1 7 4 q1 5 -4 6.2 q-7 1 -8.2 -4 q-1.2 -5.2 5.2 -6.2 Z" fill="url(#gFlesh)" stroke="#54060c" stroke-width=".5"/>
    <circle cx="-1" cy="0" r="1" fill="#3a0509"/><circle cx="3" cy="2" r=".8" fill="#7d0a10"/>
    <path d="M-3 -2 q3 1 5 4" stroke="#e0707a" stroke-width=".4" fill="none" opacity=".5"/>
  </g>`;
}
function partEye() {
  return `<g>
    <path d="M0 1 q-6 3 -11 8" stroke="#9c1118" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="3.5" fill="url(#gEye)" stroke="#c4c4ba" stroke-width=".4"/>
    <circle cx="0" cy="0" r="1.6" fill="#1f3f72"/><circle cx="0" cy="0" r=".7" fill="#070a0b"/>
    <path d="M-2.4 -2 q-.8 1 -.8 2 M2.4 1.6 q.8 -.8 .8 -1.8" stroke="#c0202a" stroke-width=".3" fill="none"/>
  </g>`;
}
function partRib() {
  return `<g fill="none">
    <path d="M-5 -6 v12" stroke="#cfc8b5" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M-5 -5 q8 1 9 9" stroke="url(#gBone)" stroke-width="1.3"/>
    <path d="M-5 -1 q7 1 8 8" stroke="url(#gBone)" stroke-width="1.3"/>
    <path d="M-5 3 q6 1 6.5 6" stroke="url(#gBone)" stroke-width="1.3"/>
  </g>`;
}
function partDick() {
  // "The Deck Flop" — the full set, freshly separated, in panicked
  // fish-out-of-water mode: hinged flop, tip follow-through, sack jiggle,
  // splashing in its own puddle. The bios promised; the chum delivers.
  return `<g>
    <ellipse cx="-4" cy="8" rx="10" ry="3" fill="#6e060b" opacity=".6"/>
    <g class="dsack">
      <circle cx="-7" cy="3.4" r="3.7" fill="url(#gSkin)" stroke="#a9744f" stroke-width=".5"/>
      <circle cx="-2.4" cy="4.6" r="3.3" fill="url(#gSkin)" stroke="#a9744f" stroke-width=".5"/>
      <path d="M-9 2 q1.5 1.5 0 3 M-4 3.6 q1.4 1.4 0 2.8" stroke="#a9744f" stroke-width=".35" fill="none" opacity=".7"/>
      <path d="M-10 5 q3 2.6 7 2.2" stroke="#9c1118" stroke-width=".9" fill="none" opacity=".8"/>
    </g>
    <g class="dflop">
      <path d="M-7 -1 q0 -3 3 -3.2 L6 -3.6 q4 -.4 4.8 2.9 q-.8 3.5 -4.8 2.9 L-4 1.6 q-3 -.2 -3 -2.6 Z" fill="url(#gSkin)" stroke="#a9744f" stroke-width=".5"/>
      <path d="M-5 -3.2 q6 -1.4 10.5 -.6 M-4.5 1 q6 1.2 10 .4" stroke="#9c1118" stroke-width="1" fill="none" opacity=".75"/>
      <path d="M-2 -3.4 q1 2.6 0 4.8" stroke="#b00710" stroke-width=".8" fill="none" opacity=".8"/>
      <g class="dtip">
        <path d="M6 -3.8 q5 .4 5 3.1 q0 2.7 -5 3.1 q2.3 -1.6 2.3 -3.1 q0 -1.5 -2.3 -3.1 Z" fill="#d89a80" stroke="#a9744f" stroke-width=".4"/>
        <path d="M8 -2.6 q2.4 1.2 2.4 1.9" stroke="#9c1118" stroke-width=".8" fill="none" opacity=".85"/>
      </g>
    </g>
    <path d="M-8.6 -3.4 l1.7 1.3 l-1.7 1.2 l1.7 1.3 l-1.7 1.2" fill="none" stroke="#7d0a10" stroke-width="1.2"/>
    <circle cx="-8.8" cy="-1.2" r="2.5" fill="#7d0a10"/><circle cx="-8.8" cy="-1.2" r="1" fill="#f0ead8"/>
    <path class="dsplash" d="M-14 7 l-2 -3 M-12 8 l-1 -3" stroke="#b00710" stroke-width=".8" fill="none"/>
    <path class="dsplash s2" d="M4 8 l2 -3 M7 7 l1 -2.6" stroke="#b00710" stroke-width=".8" fill="none"/>
    <path class="ddrip" d="M-8.8 1 q-.9 3 0 5 q.9 -2 0 -5 Z" fill="#b00710"/>
    <path class="ddrip d2" d="M-3 6.6 q-.8 2.6 0 4.4 q.8 -1.8 0 -4.4 Z" fill="#a30912"/>
  </g>`;
}
// (the deck-flopper now rides the sharks themselves — none in the chum)
const GORE_PARTS = [partArm, partLeg, partBone, partFlesh, partEye, partRib, partFlesh, partArm];

// chum cloud + drifting limbs + rising blood, seeded per shark so it's stable
function goreField(seed) {
  const rng = mulberry((seed * 101 + 7) >>> 0);
  let s = `<ellipse class="chum" cx="0" cy="3" rx="44" ry="27" fill="url(#chum)"/>`;
  const n = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = 24 + rng() * 22;
    const x = (Math.cos(ang) * rad).toFixed(1);
    const y = (Math.sin(ang) * rad * 0.72).toFixed(1);
    const rot = (rng() * 360).toFixed(0);
    const sc = (0.8 + rng() * 0.6).toFixed(2);
    const d = (rng() * 3).toFixed(1);
    const art = GORE_PARTS[Math.floor(rng() * GORE_PARTS.length)]();
    s += `<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc})">`
       + `<ellipse class="bloodpool" cx="0" cy="1.5" rx="7" ry="3.6" fill="#6e060b" opacity=".5"/>`
       + `<g class="gpart" style="animation-delay:${d}s;--fd:${(rng() * 0.4).toFixed(2)}s">${art}</g></g>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = (rng() * 64 - 32).toFixed(1);
    const r = (0.7 + rng() * 1).toFixed(1);
    const d = (rng() * 3.4).toFixed(1);
    s += `<circle class="bbit" cx="${x}" cy="20" r="${r}" fill="#9c1118" style="animation-delay:${d}s"/>`;
  }
  return s;
}
