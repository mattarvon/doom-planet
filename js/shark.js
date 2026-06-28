// shark.js — the snarling shark marker. Faces +x; flip horizontally to head west.
// Globals: sharkSVG(), bearingWest()

function sharkSVG(scale, hot) {
  const skin  = hot ? "#33363b" : "#272f36";   // slate grey-blue hide
  const skin2 = hot ? "#1b1f24" : "#161c22";   // shadowed underside
  const maw   = "#3a0509";                       // dark bloody mouth interior
  return `
  <g class="body" transform="scale(${scale})">
    <!-- tail (swishes) -->
    <g class="tail" style="transform-box:fill-box;transform-origin:88% 50%">
      <path d="M-34 0 Q-50 -3 -64 -16 Q-55 0 -64 16 Q-50 3 -34 0 Z"
            fill="${skin2}" stroke="#04070a" stroke-width=".6"/>
    </g>
    <!-- pectoral fin -->
    <path d="M-4 5 Q-12 22 8 16 Q2 9 -4 5 Z" fill="${skin2}" stroke="#04070a" stroke-width=".5"/>
    <!-- dorsal fin -->
    <path d="M-14 -8 Q-5 -30 13 -10 Z" fill="${skin2}" stroke="#05080a" stroke-width=".6"/>
    <!-- main body -->
    <path d="M-36 0 Q-22 -12 -2 -12 Q22 -12 40 -8 L45 -2 L40 0 Q20 5 -2 7 Q-22 7 -36 2 Z"
          fill="${skin}" stroke="#04070a" stroke-width=".8"/>
    <!-- pale belly sheen -->
    <path d="M-30 3 Q-6 8 32 4 Q8 7 -12 7 Q-24 7 -30 3 Z" fill="#cfd6d4" opacity=".16"/>
    <!-- gills -->
    <g stroke="#04070a" stroke-width=".7" opacity=".7" fill="none">
      <path d="M-18 -6 q-3 7 0 13"/><path d="M-13 -7 q-3 7 0 14"/><path d="M-8 -7 q-3 7 0 14"/>
    </g>
    <!-- gaping mouth interior -->
    <path d="M12 -7 Q34 -9 48 -2 Q40 12 18 13 Q11 10 11 0 Z" fill="${maw}"/>
    <!-- upper jaw + fixed teeth -->
    <g>
      <path d="M11 -7 Q30 -12 47 -7 Q40 -3 28 -3 Q18 -3 11 -1 Z" fill="${skin}" stroke="#04070a" stroke-width=".5"/>
      <path d="M12 -2 l3 5.5 l2.2 -5.5 l3 5.5 l2.2 -5.5 l3 5.5 l2.2 -5.5 l3 5.5 l2.2 -5.5 l3 5.5 l2.2 -5.5"
            fill="#f3efe2" stroke="#9a9384" stroke-width=".3"/>
    </g>
    <!-- lower jaw + teeth (chomps) -->
    <g class="jaw" style="transform-box:fill-box;transform-origin:6% 0%">
      <path d="M11 2 Q28 13 47 6 Q40 16 20 16 Q12 13 11 7 Z" fill="${skin2}" stroke="#04070a" stroke-width=".5"/>
      <path d="M13 6 l3 -5.5 l2.2 5.5 l3 -5.5 l2.2 5.5 l3 -5.5 l2.2 5.5 l3 -5.5 l2.2 5.5 l3 -5.5 l2.2 5.5"
            fill="#efe9da" stroke="#9a9384" stroke-width=".3"/>
      ${hot ? `<path class="gdrip" d="M30 13 q-1.6 7 0 11 q1.6 -4 0 -11 Z" fill="#b00710"/>` : ``}
    </g>
    <!-- angry brow + glowing eye -->
    <path d="M15 -9 Q21 -12.5 28 -10" stroke="#04070a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle class="eye" cx="21" cy="-6" r="3.3" fill="#ff2a1e"/>
    <circle cx="21.7" cy="-6" r="1.3" fill="#1a0202"/>
    ${hot ? `<circle class="bloodbead" cx="40" cy="14" r="1.7" fill="#8c060b"/>` : ``}
  </g>`;
}

// true if the shark's last leg trended west (so we mirror the marker)
function bearingWest(s) {
  const p = s.pings;
  if (!p || p.length < 2) return false;
  return (+p[p.length - 1].longitude) < (+p[p.length - 2].longitude);
}
