// data.js — load order: OCEARCH live feed first, themed demo pod on failure.
// Globals: SHARKS, LIVE, OCEARCH, load(), parseTz(), lastPing(), daysAgo()
//
// The live endpoint is undocumented and serves plain http, so in most browser
// contexts it will be blocked by mixed-content / CORS and we fall back to the
// demo pod. Put a CORS-adding proxy in front of OCEARCH and point this there to
// light up real data — the render code is schema-identical.

const OCEARCH = "https://www.ocearch.org/tracker/ajax/filter-sharks?tracking-activity=ping-most-recent";

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
    bio:"The reigning warlord of the Cape Cod summer bloodbath. Mary Lee has personally decommissioned over 400 boogie boards, two Jet Skis, and one entire wedding party who thought a sunset sandbar ceremony was 'romantic.' She doesn't hunt for food anymore — she hunts for the scream. The Coast Guard keeps a group chat just about her. She has read it. She was not flattered."},
  {id:2,name:"Katharine",species:WS,gender:"female",stageOfLife:"Sub-adult",length:"14ft 2in (4.3 m)",weight:"2300 lbs.",tagLocation:"Cape Cod, MA",tagDate:"02 Aug 2013",pings:track(23,-73.5,33.5,14,2.0,1.6, 0.42,-0.42),
    bio:"Technically still a teenager, already banned from six beaches and one aquarium gift shop. Katharine treats the entire Eastern Seaboard like an all-you-can-eat buffet where the plates beg. Scientists tagged her 'for research'; she treats the tracker as a body-count leaderboard and she is absolutely, disgustingly winning. Feral. Cocky. Leaves a tip in teeth."},
  {id:3,name:"Lydia",species:WS,gender:"female",stageOfLife:"Mature",length:"14ft 6in (4.4 m)",weight:"2000 lbs.",tagLocation:"Jacksonville, FL",tagDate:"02 Mar 2013",pings:track(37,-58,39.5,16,2.4,1.4, 0.62,-0.08),
    bio:"First white shark documented crossing the whole Atlantic — not to migrate, to TOUR. Lydia got bored of American swimmers mid-summer and went looking for continental cuisine, leaving a wake of shredded pedalos from Jacksonville to the Azores. She has ranked every nation by flavor, keeps notes, and will share them unprompted, chewing."},
  {id:4,name:"Contender",species:WS,gender:"male",stageOfLife:"Mature",length:"13ft 9in (4.2 m)",weight:"1653 lbs.",tagLocation:"FL-GA line",tagDate:"17 Jan 2025",pings:track(51,-76,30.5,13,2.0,1.5, 0.5,0.34),
    bio:"Named Contender because he keeps trying to fight boats. And winning. He once headbutted a 40-foot charter so hard the captain filed a police report against a fish, which was dismissed, because you cannot subpoena a nightmare. Contender surfaces to make eye contact first — a courtesy — right before he does the unforgivable thing. A threat with a fin."},
  {id:5,name:"Breton",species:WS,gender:"male",stageOfLife:"Mature",length:"13ft 3in (4.0 m)",weight:"1437 lbs.",tagLocation:"Scatarie Island, NS",tagDate:"12 Sep 2020",pings:track(67,-57,43.5,14,2.2,1.6, 0.5,-0.18),
    bio:"Canada's most courteous massacre — apologizes to each seal, individually, right before. Breton works the Scotian Shelf like a hitman who genuinely loves the craft, leaving behind a single fin, a rumor, and the faint smell of salt and regret. Thirteen feet of 'sorry aboot that, bud.' The seals report that this does not help."},
  {id:6,name:"Nukumi",species:WS,gender:"female",stageOfLife:"Mature",length:"17ft 2in (5.2 m)",weight:"3541 lbs.",tagLocation:"Lunenburg, NS",tagDate:"02 Oct 2020",pings:track(83,-51,42.5,13,2.4,1.5, 0.55,-0.12),
    bio:"The grandmother. Seventeen feet, half a ton, older than your car and twice as likely to total it. Nukumi has eaten creatures that science has not named yet and refuses to describe them. Legend says she remembers the last three shipwrecks personally, because she caused two of them and reviewed the third. When she surfaces, the tide leaves early out of respect."},
  {id:7,name:"Maple",species:TG,gender:"female",stageOfLife:"Sub-adult",length:"10ft 7in (3.2 m)",weight:"616 lbs.",tagLocation:"Bermuda",tagDate:"21 Jun 2023",pings:track(97,-64.7,31.5,12,1.9,1.8, 0.12,0.18),
    bio:"Tiger sharks eat everything; Maple took that as a dare. Confirmed stomach contents: a license plate, a full set of patio furniture, one (1) very unlucky drone, and a cooler that still had a sandwich in it — she remembers the sandwich fondly. Bermuda installed a Maple-shaped warning sign. She ate it. Then she ate the sign they put up about the first sign."},
  {id:8,name:"Khaleesi",species:WS,gender:"female",stageOfLife:"Sub-adult",length:"9ft 4in (2.8 m)",weight:"460 lbs.",tagLocation:"Gansbaai, ZA",tagDate:"15 May 2022",pings:track(110,21.5,-36.5,12,2.0,1.5, 0.34,-0.16),
    bio:"Breaches twelve feet out of the water purely for the theatrics. Khaleesi does not need to jump that high to catch a seal — she does it because the tourists gasp, and she LIVES for the gasp. South Africa's most dramatic murderer; if sharks could talk she'd have a villain monologue and a wind machine. Instead she just does the thing. With the teeth. Slowly."},
  {id:9,name:"Bronson",species:WS,gender:"male",stageOfLife:"Mature",length:"12ft 9in (3.9 m)",weight:"1326 lbs.",tagLocation:"Neptune Is, AU",tagDate:"08 Dec 2021",pings:track(126,135.5,-37.5,11,1.9,1.4, 0.28,-0.16),
    bio:"Named after the actor because he squints right before he ruins your entire decade. Bronson works the Neptune Islands like a bouncer guarding a door nobody is cleared to use. He has personally launched more surfboards into orbit than the Australian space program. He doesn't chase — he waits, calm as a coffin, because everyone comes to Bronson eventually. Everyone does."},
  {id:10,name:"Riptide",species:MK,gender:"male",stageOfLife:"Mature",length:"8ft 1in (2.5 m)",weight:"298 lbs.",tagLocation:"Montauk, NY",tagDate:"30 Jul 2024",pings:track(140,-69.5,38.8,15,2.4,1.7, 0.52,-0.34),
    bio:"Fastest shark in the ocean and physically incapable of shutting up about it. Riptide hits 45 mph and spends every single one of them being as annoying and lethal as the laws of physics allow. He has outrun boats, jumped into two of them, and bitten a propeller clean off purely to hear the noise it made. Montauk fishermen don't tell Riptide stories at the bar. Riptide tells fisherman stories. They're all very short."},
];

async function load(){
  try{
    const c=new AbortController();
    const t=setTimeout(()=>c.abort(),4500);
    const r=await fetch(OCEARCH,{signal:c.signal});
    clearTimeout(t);
    if(!r.ok) throw 0;
    const j=await r.json();
    if(Array.isArray(j)&&j.length&&j[0].pings){ SHARKS=j; LIVE=true; }
    else throw 0;
  }catch(e){
    SHARKS=MOCK; LIVE=false;
  }
}
