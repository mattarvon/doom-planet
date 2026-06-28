// shark.js — the snarling shark marker. Faces +x; flip horizontally to head west.
// Globals: sharkSVG(), bearingWest()

// build a row of conical teeth along a jaw line.
// x0..x1 span, y = gum line, dir = +1 teeth point down / -1 point up, n = count
function teethRow(x0, y, x1, dir, n) {
  let s = "";
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + step * (i + 0.5);
    const w = step * 0.42;
    const len = (3.6 - i * 0.16) * dir;          // front teeth longest
    s += `<polygon points="${(x-w).toFixed(1)},${y} ${(x+w).toFixed(1)},${y} ${x.toFixed(1)},${(y+len).toFixed(1)}"`
       + ` fill="url(#gTooth)" stroke="#a89f8c" stroke-width=".2"/>`;
  }
  return s;
}

function sharkSVG(scale, hot) {
  return `
  <g class="body" transform="scale(${scale})">
    <!-- caudal fin (swishes) -->
    <g class="tail" style="transform-box:fill-box;transform-origin:92% 50%">
      <path d="M-36 0 Q-52 -5 -67 -21 Q-61 -7 -58 0 Q-61 9 -65 19 Q-51 5 -36 1 Z"
            fill="url(#gDorsal)" stroke="#13171c" stroke-width=".5"/>
    </g>
    <!-- pectoral fin -->
    <path d="M2 5 Q-7 23 13 17 Q8 9 2 5 Z" fill="url(#gDorsal)" stroke="#13171c" stroke-width=".4"/>
    <!-- dorsal fin -->
    <path d="M-11 -10 Q0 -35 15 -11 Q2 -13 -11 -10 Z" fill="url(#gDorsal)" stroke="#10141a" stroke-width=".5"/>
    <!-- body (grey hide, countershaded) -->
    <path d="M-42 -1 Q-36 -11 -18 -13 Q4 -14 26 -12 Q44 -10 51 -3 Q49 -1 45 0 L16 -3 Q2 -2 -8 1 Q-26 5 -40 3 Z"
          fill="url(#gHide)" stroke="#13171c" stroke-width=".7"/>
    <!-- pale belly -->
    <path d="M-40 2 Q-22 6 -6 7 Q10 8 24 6 Q35 5 45 7 Q40 9 30 9 Q10 10 -8 9 Q-26 8 -40 4 Z"
          fill="url(#gBelly)" stroke="#9aa39a" stroke-width=".3" stroke-opacity=".5"/>
    <!-- snout sheen -->
    <path d="M14 -12 Q40 -12 51 -3 Q44 -7 26 -8 Q18 -9 14 -12 Z" fill="url(#gSnout)"/>
    <!-- gill slits -->
    <g stroke="#10151a" stroke-width=".6" opacity=".55" fill="none">
      <path d="M-20 -7 q-3 7 -1 13"/><path d="M-15 -8 q-3 7 -1 14"/>
      <path d="M-10 -8 q-3 7 -1 14"/><path d="M-5 -8 q-3 7 -1 13"/>
    </g>
    <!-- ampullae pores on the snout -->
    <g fill="#171c21" opacity=".5">
      <circle cx="30" cy="-9" r=".5"/><circle cx="34" cy="-7" r=".5"/><circle cx="38" cy="-6" r=".5"/>
      <circle cx="42" cy="-4" r=".5"/><circle cx="36" cy="-9" r=".5"/><circle cx="27" cy="-10" r=".5"/>
    </g>
    <!-- dark throat -->
    <path d="M13 -3 Q34 -4 47 -1 Q42 10 22 12 Q13 9 12 2 Z" fill="url(#gThroat)"/>
    <!-- upper gum + fixed teeth -->
    <path d="M13 -3 Q30 -6 47 -3 Q40 -1 28 -1 Q18 -1 13 0 Z" fill="url(#gGum)"/>
    ${teethRow(15, -1.4, 46, 1, 9)}
    ${hot ? `<path d="M16 -1 Q28 3 45 0 Q30 4 18 3 Z" fill="#7d0a10" opacity=".5"/>` : ``}
    <!-- lower jaw (chomps): gum, teeth, gore -->
    <g class="jaw" style="transform-box:fill-box;transform-origin:6% 14%">
      <path d="M12 3 Q30 13 47 6 Q42 16 22 16 Q13 13 12 7 Z" fill="url(#gHide)" stroke="#13171c" stroke-width=".5"/>
      <path d="M13 4 Q30 11 46 6 Q38 13 24 13 Q15 11 13 7 Z" fill="url(#gGum)"/>
      ${teethRow(15, 6.6, 45, -1, 9)}
      ${hot ? `<path class="gdrip" d="M30 13 q-1.8 8 0 12 q1.8 -5 0 -12 Z" fill="#b00710"/>` : ``}
    </g>
    <!-- hook + leader line snagged in the jaw (camp detail) -->
    <path d="M44 9 q5 1 6 5 q0 4 -4 4 q-3 0 -3 -3" fill="none" stroke="#9aa0a3" stroke-width=".7" stroke-linecap="round"/>
    <!-- black eye with catchlight -->
    <circle cx="24" cy="-7" r="2.6" fill="#080a0b"/>
    <circle cx="24" cy="-7" r="2.6" fill="none" stroke="#2c3236" stroke-width=".5"/>
    <circle cx="23.1" cy="-7.9" r=".7" fill="#b6c0c4" opacity=".85"/>
    ${hot ? `<circle class="eye" cx="24" cy="-7" r="3.4" fill="none" stroke="#ff2a1e" stroke-width=".8" opacity="0"/>` : ``}
    <!-- battle scars -->
    <g stroke="#d2d7d3" stroke-width=".4" opacity=".3" fill="none" stroke-linecap="round">
      <path d="M30 -10 l5 1"/><path d="M21 -11 l4 -1"/>
    </g>
    ${hot ? `<circle class="bloodbead" cx="40" cy="14" r="1.6" fill="#8c060b"/>` : ``}
  </g>`;
}

// true if the shark's last leg trended west (so we mirror the marker)
function bearingWest(s) {
  const p = s.pings;
  if (!p || p.length < 2) return false;
  return (+p[p.length - 1].longitude) < (+p[p.length - 2].longitude);
}
