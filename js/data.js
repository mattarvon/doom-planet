// data.js — load order: real OCEARCH tracks → GBIF sightings → demo pod.
// Globals: SHARKS, LIVE, load(), parseTz(), lastPing(), daysAgo()
//
// The OCEARCH tracker runs on Mapotic. That API is CORS-clean and https, so the
// browser fetches it DIRECTLY — no proxy, no backend. `pois.geojson/` is the
// roster; `pois/{id}/motion/with-meta/` is one animal's real ping track. The
// render code is schema-identical: we map Mapotic → {name,species,…,pings[]}.

const MAPOTIC = "https://www.mapotic.com/api/v1/";
const OCEARCH_MAP = 3413;                 // OCEARCH's Mapotic map id
const OCEARCH_MAX = 24;                    // how many animals to pull tracks for
const OCEARCH_PINGS = 80;                  // cap pings per shark (newest kept)

let SHARKS = [];
let LIVE = false;

// ---- schema helpers (work on both live and mock objects) ----
function parseTz(s) {
  // "27 Sep 2017 07:57:20 -0400"
  const m = /^(\d+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)/.exec(s || "");
  if (!m) return 0;
  const mo = MONTHS.indexOf(m[2]);
  if (mo < 0) return 0;
  return Date.UTC(+m[3], mo, +m[1], +m[4], +m[5], +m[6]);
}
function lastPing(s) { return s.pings && s.pings.length ? s.pings[s.pings.length - 1] : null; }
function daysAgo(t) { return Math.floor((Date.now() - t) / 864e5); }

// ---- seeded demo pod ----
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const _pad = n => String(n).padStart(2,'0');
function fmtTz(d){
  const off=d.getTimezoneOffset();
  const tz=(off>0?'-':'+')+_pad(Math.abs(off)/60|0)+_pad(Math.abs(off)%60);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())} ${tz}`;
}
// Random-walk track. bx/by add a per-step drift bias so tracks trend seaward
// instead of wandering onto land (the mock has no coastline awareness).
function track(seed, lon, lat, n, sx, sy, bx=0, by=0){
  const r=mulberry(seed); const out=[]; let L=lon,T=lat; const now=Date.now();
  for(let i=0;i<n;i++){
    L+=(r()-.5)*sx + bx; T+=(r()-.5)*sy + by;
    const when=new Date(now-(n-1-i)*(1.4+r()*2.6)*864e5);
    out.push({latitude:T.toFixed(5),longitude:L.toFixed(5),tz_datetime:fmtTz(when)});
  }
  return out;
}
const WS="White Shark (Carcharodon carcharias)",
      TG="Tiger Shark (Galeocerdo cuvier)",
      MK="Shortfin Mako (Isurus oxyrinchus)";

// Offshore starts + gentle seaward drift bias keep these synthetic tracks in the
// water. Tag locations stay as descriptive metadata; pings are open-ocean.
const MOCK=[
  {id:1,name:"Mary Lee",species:WS,gender:"female",stageOfLife:"Mature",length:"16ft (4.9 m)",weight:"3456 lbs.",tagDate:"17 Sep 2012",tagLocation:"Cape Cod, MA",pings:track(11,-67.5,40.2,14,2.2,1.5, 0.5,0.16),
    bio:"The path of the righteous shark is beset on all sides by boogie boarders and the tyranny of Jet Ski men. Mary Lee recites that — the whole thing, word for word — before every kill, not because she has to, because it's COLD-BLOODED to say before you bite a best man in half at his own bachelor party. She kept his dick as a trophy and his watch as a lesson. Den mother of this crew of degenerates, four-digit body count, confiscates the pod's weed every Friday and smokes it all herself by Saturday. The Coast Guard keeps a group chat about her. She's in it, under a fake name, talking unbelievable amounts of shit. She has such sights to show you. All of them are teeth."},
  {id:2,name:"Katharine",species:WS,gender:"female",stageOfLife:"Sub-adult",length:"14ft 2in (4.3 m)",weight:"2300 lbs.",tagLocation:"Cape Cod, MA",tagDate:"02 Aug 2013",pings:track(23,-73.5,33.5,14,2.0,1.6, 0.42,-0.42),
    bio:"Summers at the lake across from Camp Crystal Lake — her and the guy in the mask have a professional understanding: he takes the counselors who wander off alone, she takes the entire canoe program. Katharine invented the sorority panty raid, shark edition: surfaces through the Delta Gamma midnight swim like a submarine full of bad decisions, leaves wearing eleven bikini tops on her dorsal fin like a trophy rack, and the camp director's 'IT JUST DOESN'T MATTER' speech the next morning has never once helped. Banned from six beaches, two spring breaks, and one aquarium gift shop (unrelated incident, still not sorry). The tracking tag? She treats it like a leaderboard, and she is disgustingly, historically winning."},
  {id:3,name:"Lydia",species:WS,gender:"female",stageOfLife:"Mature",length:"14ft 6in (4.4 m)",weight:"2000 lbs.",tagLocation:"Jacksonville, FL",tagDate:"02 Mar 2013",pings:track(37,-58,39.5,16,2.4,1.4, 0.62,-0.08),
    bio:"You know what they call a boogie boarder in Amsterdam? Doesn't matter — she ate him. First white shark documented crossing the entire Atlantic, and she did it like a hitman on a working vacation: little conversations about nothing, then sudden, unbelievable violence, then back to the conversation. Lydia did Ibiza in one night — ate a stag party off a catamaran, ripped a bong hit out of a sunken amphora ('vintage piece, hits clean'), mooned a ferry, which for a shark takes commitment. She rates every nation's swimmers like a Yelp reviewer with a substance problem and shares the rankings unprompted, mid-chew. Spain is winning. Spain does not want to know why."},
  {id:4,name:"Contender",species:WS,gender:"male",stageOfLife:"Mature",length:"13ft 9in (4.2 m)",weight:"1653 lbs.",tagLocation:"FL-GA line",tagDate:"17 Jan 2025",pings:track(51,-76,30.5,13,2.0,1.5, 0.5,0.34),
    bio:"Covered in fishhooks from a decade of winning fights against boats, and he KEPT them — rows of rusted trebles down his flank like cenobite piercings. 'The hooks are decorative,' the legend goes. 'The pain is a gift he regifts.' Contender chomped a skinny-dipper's dick off at a lake party, spat it at the guy's best friend, and the police report — filed against a fish — was dismissed, because you cannot subpoena a nightmare. Does security for the pod's parties: eats the gatecrashers, plus at least one invited guest per event ('he was being a dick.' Contender. Buddy. That's YOUR thing). Surfaces to make eye contact first. It's not a courtesy. It's a receipt."},
  {id:5,name:"Breton",species:WS,gender:"male",stageOfLife:"Mature",length:"13ft 3in (4.0 m)",weight:"1437 lbs.",tagLocation:"Scatarie Island, NS",tagDate:"12 Sep 2020",pings:track(67,-57,43.5,14,2.2,1.6, 0.5,-0.18),
    bio:"The pod's dealer, Canada's politest felon, and the only shark alive who's solved the puzzle box — he keeps it in the wreck where he grows 'Scotian Shelf Kush,' and when the chains came out of it he apologized so sincerely the cenobites got uncomfortable and left. His product 'opens the mind like a box you should NOT have opened, bud.' Runs the Friday sesh where the whole crew hotboxes a sunken school bus; campfire rules: no narcs, no orcas, whoever greens out gets drawn on. Apologizes to each seal individually right before — 'sorry aboot this' — and once mailed a stolen bikini top back from one of Katharine's raids with a handwritten note. Then ate the mailman. Thirteen feet of sorry, zero percent of it meant."},
  {id:6,name:"Nukumi",species:WS,gender:"female",stageOfLife:"Mature",length:"17ft 2in (5.2 m)",weight:"3541 lbs.",tagLocation:"Lunenburg, NS",tagDate:"02 Oct 2020",pings:track(83,-51,42.5,13,2.4,1.5, 0.55,-0.12),
    bio:"Eleven hundred men went into the water off the Indianapolis in '45. Nukumi remembers it differently than Quint told it — she remembers it as a BUFFET, and she remembers him specifically, because she's the reason he needed a bigger boat. Seventeen feet, half a ton, older than radar. She's been to the bottom of trenches that don't have names, seen the labyrinth down there, and came back BORED — 'pain, pleasure, whatever, is there food.' Rips the smokestack of a wreck she personally sank like a two-story bong and calls it her medicine. Ate a yacht-club commodore in '09 and wore his hat for a week. Nobody said one goddamn word. When she surfaces, the tide leaves early. It knows."},
  {id:7,name:"Maple",species:TG,gender:"female",stageOfLife:"Sub-adult",length:"10ft 7in (3.2 m)",weight:"616 lbs.",tagLocation:"Bermuda",tagDate:"21 Jun 2023",pings:track(97,-64.7,31.5,12,1.9,1.8, 0.12,0.18),
    bio:"Tiger sharks eat everything. Maple ate the puzzle box. The chains came out, the hooks came out, an actual cenobite manifested in the water column with the whole 'we have such sights to show you' routine — and she ate two of the sights and most of the guy holding them, and the leader with the pins left a five-star review out of pure professional fear. Also confirmed in the stomach: a license plate, patio furniture, one (1) unlucky drone, Breton's stash, THE BONG, and the guy holding the bong. Crashed a Bermuda booze cruise and ate the DJ booth mid-drop; the crowd cheered because honestly the set was mid. Bermuda put up a Maple-shaped warning sign. She ate it. Then the sign about the sign. She will eat this bio."},
  {id:8,name:"Khaleesi",species:WS,gender:"female",stageOfLife:"Sub-adult",length:"9ft 4in (2.8 m)",weight:"460 lbs.",tagLocation:"Gansbaai, ZA",tagDate:"15 May 2022",pings:track(110,21.5,-36.5,12,2.0,1.5, 0.34,-0.16),
    bio:"Keeps a revenge list scrimshawed into a whale rib — five names, four crossed off, and the fifth is a Gansbaai cage-dive operator who is going to have a very bad season. Khaleesi is the pod's revenge-flick lead: wronged once (they hauled her out of the water for a TAG, on CAMERA, her bad side), and now every breach is a kill scene shot in slow motion. Twelve feet of air at a nude beach volleyball game — caught the ball AND the server in the same jump; survivors called it 'honestly kind of impressive.' Attends Katharine's panty raids strictly for the theatrics: three backflips, zero panties, all attitude. Villain monologue, wind machine, restraining orders from two yacht clubs. She does the thing. With the teeth. Slowly. For the applause."},
  {id:9,name:"Bronson",species:WS,gender:"male",stageOfLife:"Mature",length:"12ft 9in (3.9 m)",weight:"1326 lbs.",tagLocation:"Neptune Is, AU",tagDate:"08 Dec 2021",pings:track(126,135.5,-37.5,11,1.9,1.4, 0.28,-0.16),
    bio:"The quiet one, which in this crew makes him the scariest dickhead of all. Bronson circles slow, like there's an oldies station playing somewhere only he can hear, and by the time you clock which song it is, the situation has become unrecoverable — ask the abalone diver who still has both ears and zero boat. He ended an entire Australian booze cruise by surfacing next to it and doing NOTHING; three men fainted, one converted. Bounces the pod's parties with a squint that makes grown men climb out of the ocean on water. Pod records: fourteen surfboards launched into low orbit, and most dicks bitten off with zero follow-through — 'wasn't hungry, was making a point.' Everyone comes to Bronson eventually. Everyone."},
  {id:10,name:"Riptide",species:MK,gender:"male",stageOfLife:"Mature",length:"8ft 1in (2.5 m)",weight:"298 lbs.",tagLocation:"Montauk, NY",tagDate:"30 Jul 2024",pings:track(140,-69.5,38.8,15,2.4,1.7, 0.52,-0.34),
    bio:"The 45-mph motormouth. 'You know what they call a Royale with Cheese at forty-five miles an hour? GONE.' — Riptide, mid-heist, mouth full of someone's cooler. He plans the panty raids, takes none of the blame, and narrates his own kills in the third person like a trailer voiceover. Stolen to date: a GoPro (posted the footage, it SLAPPED), a six-pack (shotgunned two cans — fins, somehow), and the entire anchor line of a honeymoon charter, purely to watch the newlyweds drift toward international waters. Bit a propeller off to hear the noise. Did it again because the first noise slapped. Montauk fishermen don't tell Riptide stories at the bar — Riptide tells fishermen stories. They're all very short. He does the voices."},
];

// The gory personas are fiction. When a REAL OCEARCH animal shares a name with
// one of them, it inherits that character's bio; every other real shark falls to
// the built-in "No record. Assume the worst." line. No fabricated tracks — the
// fiction is only the flavor text, never a coordinate.
const BIOS = Object.fromEntries(MOCK.map(m => [m.name.toLowerCase(), m.bio]));

let FEED_LABEL = "";

// Format an ISO instant ("2016-09-21T21:32:12Z") into the tz string parseTz reads
// ("21 Sep 2016 21:32:12 +0000"), in UTC so no local-zone drift creeps in.
function fmtUtc(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = n => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
         `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000`;
}

// Run async jobs with a small concurrency cap (be polite to the API).
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---- real OCEARCH feed via Mapotic ----
async function loadOcearch() {
  const isShark = sp => /shark|mako|hammerhead/i.test(sp || "");   // this is a megalodon board — no turtles
  const roster = await (await fetch(`${MAPOTIC}maps/${OCEARCH_MAP}/pois.geojson/`)).json();
  const feats = (roster.features || [])
    .filter(f => f.properties && f.properties.last_move_datetime && isShark(f.properties.species))
    .sort((a, b) => (b.properties.last_move_datetime || "").localeCompare(a.properties.last_move_datetime || ""))
    .slice(0, OCEARCH_MAX);
  if (feats.length < 8) throw 0;

  const sharks = await pool(feats, 6, async (f) => {
    const p = f.properties;
    let pings = [];
    try {
      const md = await (await fetch(`${MAPOTIC}maps/${OCEARCH_MAP}/pois/${p.id}/motion/with-meta/`)).json();
      pings = (md.motion || [])
        .filter(m => m.point && m.point.coordinates && m.dt_move)
        .sort((a, b) => new Date(a.dt_move) - new Date(b.dt_move))    // ascending → lastPing = newest
        .slice(-OCEARCH_PINGS)
        .map(m => ({ latitude: String(m.point.coordinates[1]),
                     longitude: String(m.point.coordinates[0]),
                     tz_datetime: fmtUtc(m.dt_move) }));
    } catch (e) { /* fall back to the roster point below */ }
    if (!pings.length) {
      const c = (f.geometry && f.geometry.coordinates) || null;
      if (!c) return null;
      pings = [{ latitude: String(c[1]), longitude: String(c[0]), tz_datetime: fmtUtc(p.last_move_datetime) }];
    }
    return {
      id: p.id, name: p.name, species: p.species || "Shark",
      gender: p.gender, stageOfLife: p.stage_of_life,
      length: p.length, weight: p.weight, tagLocation: p.tag_location,
      image: p.image || (p.image_data && p.image_data.path) || null,
      pings, bio: BIOS[(p.name || "").toLowerCase()],
    };
  });

  const clean = sharks.filter(Boolean).filter(s => s.pings.length);
  if (clean.length < 8) throw 0;
  return clean;
}

// place each pod persona at the most recent REAL sighting of its species (GBIF).
// The characters are fiction; the positions and dates are live occurrence data.
async function loadGbifPod(){
  const KEYS = { white: 2420694, tiger: 2418234, mako: 5216248 };   // GBIF taxa
  // ONE combined request (GBIF accepts repeated taxon_key) — multiple queries
  // trip their per-client 429 rate limit, a single call doesn't.
  const fetchJson = async u => {
    for (let a = 0; a < 3; a++) {
      const r = await fetch(u);
      if (r.ok) return (await r.json()).results || [];
      await new Promise(res => setTimeout(res, 1500 * (a + 1)));
    }
    throw 0;
  };
  const base = "https://api.gbif.org/v1/occurrence/search?hasCoordinate=true&year=2024,2026";
  const all = await fetchJson(`${base}&taxon_key=${KEYS.white}&taxon_key=${KEYS.tiger}&taxon_key=${KEYS.mako}&limit=300`);
  const bySpecies = k => all.filter(x => x.speciesKey === k || x.taxonKey === k || x.acceptedTaxonKey === k);
  const w = bySpecies(KEYS.white), t = bySpecies(KEYS.tiger), m = bySpecies(KEYS.mako);
  const clean = arr => {
    const seen = new Set();
    return arr
      .filter(x => x.eventDate && Number.isFinite(x.decimalLatitude) && Number.isFinite(x.decimalLongitude))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
      .filter(x => { const k = x.decimalLatitude.toFixed(1) + "," + x.decimalLongitude.toFixed(1); if (seen.has(k)) return false; seen.add(k); return true; });
  };
  const W = clean(w), T = clean(t), M = clean(m);
  if (W.length < 10) throw 0;                    // need enough real records to seat the pod
  const at = (p, rec) => ({ ...p,
    pings: [{ latitude: String(rec.decimalLatitude), longitude: String(rec.decimalLongitude), tz_datetime: fmtTz(new Date(rec.eventDate)) }],
    sighting: { where: rec.locality || rec.country || rec.countryCode || "open water", basis: rec.basisOfRecord, dataset: rec.datasetName },
  });
  // tiger/mako personas take their species' newest record when one exists,
  // otherwise they sit at a (real) white-shark record instead of sinking the feed
  let wi = 0;
  const next = () => W[Math.min(wi++, W.length - 1)];
  return MOCK.map(p => p.species === TG ? at(p, T.length ? T[0] : next())
                     : p.species === MK ? at(p, M.length ? M[0] : next())
                     : at(p, next()));
}

async function load(){
  // 1) real OCEARCH tracks via Mapotic (CORS-clean, fetched straight from the browser)
  try{
    SHARKS = await loadOcearch(); LIVE = true; FEED_LABEL = "OCEARCH"; return;
  }catch(e){}
  // 2) live GBIF occurrence data — real recent shark sightings drive the pod
  try{
    SHARKS = await loadGbifPod(); LIVE = true; FEED_LABEL = "GBIF sightings"; return;
  }catch(e){}
  // 3) offline demo pod
  SHARKS = MOCK; LIVE = false; FEED_LABEL = "";
}
