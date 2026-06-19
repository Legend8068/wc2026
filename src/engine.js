/* ============================================================
   WC2026 — Tournament engine
   Pure logic: deterministic match simulation, live-state
   merging, standings computation and bracket resolution.
   Produces a "snapshot" the UI renders from.
   ============================================================ */

import D from './data';

/* ---------- deterministic RNG ---------- */
const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/* ---------- host venues (city + stadium), keyed in lockstep with HostMap ---------- */
const VENUE_LIST = [
  { stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { stadium: 'Gillette Stadium', city: 'Boston' },
  { stadium: 'AT&T Stadium', city: 'Dallas' },
  { stadium: 'NRG Stadium', city: 'Houston' },
  { stadium: 'Arrowhead Stadium', city: 'Kansas City' },
  { stadium: 'SoFi Stadium', city: 'Los Angeles' },
  { stadium: 'Hard Rock Stadium', city: 'Miami' },
  { stadium: 'MetLife Stadium', city: 'New York / New Jersey' },
  { stadium: 'Lincoln Financial Field', city: 'Philadelphia' },
  { stadium: "Levi's Stadium", city: 'San Francisco Bay Area' },
  { stadium: 'Lumen Field', city: 'Seattle' },
  { stadium: 'BMO Field', city: 'Toronto' },
  { stadium: 'BC Place', city: 'Vancouver' },
  { stadium: 'Estadio Azteca', city: 'Mexico City' },
  { stadium: 'Estadio Akron', city: 'Guadalajara' },
  { stadium: 'Estadio BBVA', city: 'Monterrey' }
];

const venueByStadium = (stadium) => VENUE_LIST.find((v) => v.stadium === stadium);

// Short keys → the canonical stadium names in VENUE_LIST (city is derived from
// there, so card headers and the host-map pulse always agree).
const V = {
  ATL: 'Mercedes-Benz Stadium', BOS: 'Gillette Stadium', DAL: 'AT&T Stadium',
  HOU: 'NRG Stadium', KC: 'Arrowhead Stadium', LA: 'SoFi Stadium',
  MIA: 'Hard Rock Stadium', NYNJ: 'MetLife Stadium', PHI: 'Lincoln Financial Field',
  SF: "Levi's Stadium", SEA: 'Lumen Field', TOR: 'BMO Field', VAN: 'BC Place',
  MEX: 'Estadio Azteca', GDL: 'Estadio Akron', MTY: 'Estadio BBVA'
};

// The real FIFA World Cup 2026 venue for every match. Group fixtures (A1–L6)
// are mapped by their actual matchup; knockout matches (M73–M104) by FIFA's
// official match number, which this site's KO ids mirror exactly. Source:
// the official 2026 match schedule.
const MATCH_VENUE = {
  // Group A
  A1: V.MEX, A2: V.GDL, A3: V.ATL, A4: V.GDL, A5: V.MEX, A6: V.MTY,
  // Group B
  B1: V.TOR, B2: V.SF, B3: V.LA, B4: V.VAN, B5: V.VAN, B6: V.SEA,
  // Group C
  C1: V.NYNJ, C2: V.BOS, C3: V.BOS, C4: V.PHI, C5: V.MIA, C6: V.ATL,
  // Group D
  D1: V.LA, D2: V.VAN, D3: V.SEA, D4: V.SF, D5: V.LA, D6: V.SF,
  // Group E
  E1: V.HOU, E2: V.PHI, E3: V.TOR, E4: V.KC, E5: V.PHI, E6: V.NYNJ,
  // Group F
  F1: V.DAL, F2: V.MTY, F3: V.HOU, F4: V.MTY, F5: V.DAL, F6: V.KC,
  // Group G
  G1: V.SEA, G2: V.LA, G3: V.LA, G4: V.VAN, G5: V.VAN, G6: V.SEA,
  // Group H
  H1: V.ATL, H2: V.MIA, H3: V.ATL, H4: V.MIA, H5: V.GDL, H6: V.HOU,
  // Group I
  I1: V.NYNJ, I2: V.BOS, I3: V.PHI, I4: V.NYNJ, I5: V.BOS, I6: V.TOR,
  // Group J
  J1: V.KC, J2: V.SF, J3: V.DAL, J4: V.SF, J5: V.DAL, J6: V.KC,
  // Group K
  K1: V.HOU, K2: V.MEX, K3: V.HOU, K4: V.GDL, K5: V.MIA, K6: V.ATL,
  // Group L
  L1: V.DAL, L2: V.TOR, L3: V.BOS, L4: V.TOR, L5: V.NYNJ, L6: V.PHI,
  // Round of 32
  M73: V.LA, M74: V.BOS, M75: V.MTY, M76: V.HOU, M77: V.NYNJ, M78: V.DAL,
  M79: V.MEX, M80: V.ATL, M81: V.SF, M82: V.SEA, M83: V.TOR, M84: V.LA,
  M85: V.VAN, M86: V.MIA, M87: V.KC, M88: V.DAL,
  // Round of 16
  M89: V.PHI, M90: V.HOU, M91: V.NYNJ, M92: V.MEX, M93: V.DAL, M94: V.SEA,
  M95: V.ATL, M96: V.VAN,
  // Quarter-finals
  M97: V.BOS, M98: V.LA, M99: V.MIA, M100: V.KC,
  // Semi-finals · third place · final
  M101: V.DAL, M102: V.ATL, M103: V.MIA, M104: V.NYNJ
};

// Stadium+city for any match id. Same value `simulate()` stamps onto its
// `venue` field, so a card's header, its stats drawer, the live ticker and the
// host-map pulse all name the same real venue. Falls back to a deterministic
// pick only if an id is somehow unmapped.
export function venueFor(matchId) {
  const stadium = MATCH_VENUE[matchId];
  return (stadium && venueByStadium(stadium)) || VENUE_LIST[hash(`${matchId}:venue`) % VENUE_LIST.length];
}

const norm = (s) => s.toLowerCase().normalize('NFD')
  .replace(/-/g, ' ')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

const lastTok = (s) => {
  const t = norm(s).split(' ').filter(Boolean);
  return t[t.length - 1] || '';
};

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const poisson = (rng, lambda) => {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
};

/* ---------- match scripts (simulation) ---------- */
const scriptCache = {};
function getScript(matchId, a, b, knockout) {
  const key = `${matchId}:${a}:${b}`;
  if (scriptCache[key]) return scriptCache[key];
  const rng = mulberry32(hash(key));
  const sa = D.TEAMS[a].str, sb = D.TEAMS[b].str;
  const edge = (sa - sb) / 28;
  const la = Math.max(0.2, 1.35 + edge * 1.1);
  const lb = Math.max(0.2, 1.35 - edge * 1.1);
  const mins = (n) => Array.from({ length: n }, () => 2 + Math.floor(rng() * 89)).sort((x, y) => x - y);
  const ga = mins(poisson(rng, la));
  const gb = mins(poisson(rng, lb));
  let pens = null;
  if (knockout && ga.length === gb.length) {
    const aWins = rng() < sa / (sa + sb);
    const w = 3 + Math.floor(rng() * 3);          // winner takes 3–5
    const l = Math.max(0, w - 1 - Math.floor(rng() * 2));
    pens = aWins ? [w, l] : [l, w];
  }
  return (scriptCache[key] = { ga, gb, pens });
}

/* ---------- match phase from a clock ---------- */
export function phase(now, kickoff) {
  if (now < kickoff) return { status: 'pre' };
  const el = (now - kickoff) / 60000;
  if (el <= 45) return { status: 'live', minute: Math.max(1, Math.ceil(el)) };
  if (el <= 62) return { status: 'ht', minute: 45 };
  if (el <= 107) return { status: 'live', minute: Math.min(90, Math.ceil(el - 17)) };
  return { status: 'ft', minute: 90 };
}

const MOCK_PLAYERS = {
  USA: ['C. Pulisic', 'F. Balogun', 'T. Weah', 'W. McKennie', 'G. Reyna', 'T. Adams', 'A. Robinson', 'S. Dest'],
  MEX: ['S. Giménez', 'H. Lozano', 'U. Antuna', 'E. Álvarez', 'J. Quiñones', 'L. Chávez', 'J. Sánchez', 'C. Montes'],
  CAN: ['J. David', 'A. Davies', 'C. Larin', 'T. Buchanan', 'S. Eustáquio', 'I. Koné', 'A. Johnston', 'K. Miller'],
  ENG: ['H. Kane', 'J. Bellingham', 'P. Foden', 'B. Saka', 'D. Rice', 'K. Trippier', 'J. Stones', 'K. Walker'],
  FRA: ['K. Mbappé', 'A. Griezmann', 'O. Dembélé', 'M. Thuram', 'K. Coman', 'E. Camavinga', 'A. Tchouaméni', 'T. Hernández'],
  ARG: ['L. Messi', 'L. Martínez', 'J. Álvarez', 'A. Di María', 'E. Fernández', 'A. Mac Allister', 'R. De Paul', 'N. Otamendi'],
  BRA: ['Vinícius Jr.', 'Rodrygo', 'Neymar Jr.', 'Richarlison', 'Raphinha', 'Bruno Guimarães', 'Lucas Paquetá', 'Marquinhos'],
  ESP: ['Alvaro Morata', 'Dani Olmo', 'Ferran Torres', 'Lamine Yamal', 'Pedri', 'Gavi', 'Rodri', 'Dani Carvajal'],
  GER: ['K. Havertz', 'J. Musiala', 'F. Wirtz', 'L. Sané', 'T. Müller', 'I. Gündogan', 'T. Kroos', 'J. Kimmich'],
  POR: ['C. Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'João Félix', 'Rafael Leão', 'Vitinha', 'João Palhinha', 'Rúben Dias'],
  BEL: ['R. Lukaku', 'K. De Bruyne', 'J. Doku', 'L. Trossard', 'Y. Tielemans', 'A. Onana', 'W. Faes', 'T. Castagne'],
  NED: ['M. Depay', 'C. Gakpo', 'W. Weghorst', 'X. Simons', 'D. Dumfries', 'F. de Jong', 'T. Koopmeiners', 'V. van Dijk'],
  ITA: ['F. Chiesa', 'G. Scamacca', 'N. Barella', 'D. Frattesi', 'L. Pellegrini', 'M. Locatelli', 'A. Bastoni', 'G. Di Lorenzo'],
  URU: ['D. Núñez', 'F. Valverde', 'L. Suárez', 'F. Pellistri', 'R. Bentancur', 'M. Ugarte', 'M. Olivera', 'R. Araújo'],
  COL: ['L. Díaz', 'J. Rodríguez', 'R. Borré', 'J. Arias', 'M. Uribe', 'K. Castaño', 'D. Muñoz', 'Y. Mina'],
  SEN: ['S. Mané', 'N. Jackson', 'I. Sarr', 'P. Gueye', 'L. Camara', 'I. Gueye', 'K. Koulibaly', 'Y. Sabaly'],
  CRO: ['A. Kramarić', 'L. Modrić', 'M. Kovačić', 'M. Pašalić', 'M. Brozović', 'I. Perišić', 'J. Gvardiol', 'J. Šutalo'],
  MAR: ['Y. En-Nesyri', 'H. Ziyech', 'A. Ounahi', 'S. Amrabat', 'A. Harit', 'B. El Khannouss', 'A. Hakimi', 'N. Mazraoui'],
  JPN: ['A. Ueda', 'T. Kubo', 'K. Mitoma', 'R. Doan', 'W. Endo', 'H. Morita', 'Y. Sugawara', 'K. Itakura'],
  KOR: ['Son Heung-min', 'Hwang Hee-chan', 'Lee Kang-in', 'Cho Gue-sung', 'Hwang In-beom', 'Lee Jae-sung', 'Kim Min-jae', 'Seol Young-woo']
};

const MOCK_LASTNAMES = ['Silva', 'Santos', 'García', 'Rodríguez', 'Hernández', 'Smith', 'Jones', 'Müller', 'Schmidt', 'Kim', 'Lee', 'Tanaka', 'Sato', 'Sissoko', 'Diallo', 'Okonkwo', 'Mensah', 'Petrović', 'Kovačić', 'Ivanov'];
const MOCK_FIRSTNAMES = ['Alex', 'David', 'Chris', 'Juan', 'Luis', 'Carlos', 'Jean', 'Pierre', 'Thomas', 'Michael', 'Min-jun', 'Jae-hyun', 'Hiroto', 'Ren', 'Sadio', 'Moussa', 'Samuel', 'Kofi', 'Luka', 'Marko'];

function getPlayerName(teamCode, playerIndex) {
  const list = MOCK_PLAYERS[teamCode];
  if (list && list[playerIndex % list.length]) {
    return list[playerIndex % list.length];
  }
  const rngSeed = hash(`${teamCode}:${playerIndex}`);
  const r = mulberry32(rngSeed);
  const first = MOCK_FIRSTNAMES[Math.floor(r() * MOCK_FIRSTNAMES.length)];
  const last = MOCK_LASTNAMES[Math.floor(r() * MOCK_LASTNAMES.length)];
  return `${first[0]}. ${last}`;
}

/* ---------- deterministic line-ups ----------
   No public feed carries XIs, so (like the player-name mocks above) we derive a
   stable formation, starting XI and bench for each side from the match id + team
   code. Same inputs → same line-up on every render and reload. */
const FORMATIONS = {
  '4-3-3':   { DEF: 4, MID: 3, FWD: 3 },
  '4-2-3-1': { DEF: 4, MID: 5, FWD: 1 },
  '4-4-2':   { DEF: 4, MID: 4, FWD: 2 },
  '3-5-2':   { DEF: 3, MID: 5, FWD: 2 },
};
const NUM_PREFS = {
  GK:  [1, 12, 23],
  DEF: [2, 3, 4, 5, 6, 15, 22, 24],
  MID: [8, 10, 7, 14, 18, 20, 16, 25],
  FWD: [9, 11, 19, 21, 17, 26],
};

function teamLineup(matchId, team) {
  const rng = mulberry32(hash(`${matchId}:${team}:lineup`));
  const formKeys = Object.keys(FORMATIONS);
  const formation = formKeys[Math.floor(rng() * formKeys.length)];
  const shape = FORMATIONS[formation];

  const usedNames = new Set();
  // A fresh generated name (initial + surname) that hasn't been used in THIS
  // line-up — used for the keeper and the bench so they never collide with the
  // curated outfield stars.
  const genName = () => {
    let n, guard = 0;
    do {
      const f = MOCK_FIRSTNAMES[Math.floor(rng() * MOCK_FIRSTNAMES.length)];
      const l = MOCK_LASTNAMES[Math.floor(rng() * MOCK_LASTNAMES.length)];
      n = `${f[0]}. ${l}`;
    } while (usedNames.has(n) && guard++ < 40);
    usedNames.add(n);
    return n;
  };
  // Curated stars are ordered roughly forward→back; consume them for the
  // outfield XI (FWD → MID → DEF), then fall back to generated names.
  const stars = (MOCK_PLAYERS[team] || []).filter(n => !usedNames.has(n));
  const pickOutfield = () => {
    while (stars.length) { const n = stars.shift(); if (!usedNames.has(n)) { usedNames.add(n); return n; } }
    return genName();
  };

  const usedNums = new Set();
  const numFor = (pos) => {
    for (const n of NUM_PREFS[pos]) if (!usedNums.has(n)) { usedNums.add(n); return n; }
    let x = 2; while (usedNums.has(x)) x++; usedNums.add(x); return x;
  };

  const gk = { name: genName(), pos: 'GK', num: numFor('GK') };
  const fwd = Array.from({ length: shape.FWD }, () => pickOutfield());
  const mid = Array.from({ length: shape.MID }, () => pickOutfield());
  const def = Array.from({ length: shape.DEF }, () => pickOutfield());

  const xi = [
    gk,
    ...def.map((name) => ({ name, pos: 'DEF', num: numFor('DEF') })),
    ...mid.map((name) => ({ name, pos: 'MID', num: numFor('MID') })),
    ...fwd.map((name) => ({ name, pos: 'FWD', num: numFor('FWD') })),
  ];

  const subPos = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'];
  const subs = subPos.map((pos) => ({ name: genName(), pos, num: numFor(pos) }));

  /* ---------- second-half starting XI ----------
     Most matches see 0–2 changes at the interval. We derive them deterministically
     and produce the XI that walks out for the second half. Each incoming bench
     player inherits the OUTGOING player's slot (index + line position) so the
     formation shape stays intact and players land in their exact spots. */
  const htRng = mulberry32(hash(`${matchId}:${team}:htsubs`));
  const roll = htRng();
  const nSubs = roll < 0.45 ? 0 : roll < 0.8 ? 1 : 2;

  const xi2 = xi.map((p) => ({ ...p }));
  const bench = subs.map((p) => ({ ...p }));
  const htSubs = [];
  const usedSlots = new Set([0]); // never replace the keeper at the break
  for (let k = 0; k < nSubs; k++) {
    let slot = 1 + Math.floor(htRng() * (xi2.length - 1));
    let guard = 0;
    while (usedSlots.has(slot) && guard++ < 24) slot = 1 + Math.floor(htRng() * (xi2.length - 1));
    if (usedSlots.has(slot)) break;
    const out = xi2[slot];
    let bi = bench.findIndex((s) => s.pos === out.pos);   // like-for-like first
    if (bi === -1) bi = bench.findIndex((s) => s.pos !== 'GK');
    if (bi === -1) break;
    const inP = bench.splice(bi, 1)[0];
    // Incoming player keeps own name/number, takes the slot's line position.
    xi2[slot] = { ...inP, pos: out.pos, on: true };
    usedSlots.add(slot);
    htSubs.push({ off: out, on: xi2[slot] });
  }

  return { formation, xi, subs, formation2: formation, xi2, htSubs };
}

export function lineups(matchId, a, b) {
  return { home: teamLineup(matchId, a), away: teamLineup(matchId, b) };
}

/* ---------- simulated per-player badges ----------
   The live feed attaches real goal/assist/card/sub/injury events to line-up
   players; in DEMO/SIM mode we synthesize the same, kept consistent with the
   current scoreline and minute so the graphic shows the markers too. */
function decorateSide(side, matchId, team, isHomeSide, details, minute) {
  if (!side) return;
  const evByNum = {};
  const ensure = (num) => (evByNum[num] ||
    (evByNum[num] = { goals: 0, assists: 0, yellow: false, red: false, subOff: null, subOn: null, injured: false }));

  const findByName = (name) => {
    if (!name) return null;
    const normName = norm(name);
    const last = lastTok(name);

    // First try starting XI
    let found = side.xi.find(p => {
      const n = norm(p.name);
      return n === normName || lastTok(p.name) === last;
    });
    if (found) return found;

    // Then try substitutes list
    found = side.subs.find(p => {
      const n = norm(p.name);
      return n === normName || lastTok(p.name) === last;
    });
    return found;
  };

  (details || []).forEach(d => {
    if (d.isHome !== isHomeSide) return;
    if (d.type === 'goal') {
      const scorer = findByName(d.player);
      if (scorer) ensure(scorer.num).goals++;
      if (d.assist) {
        const assister = findByName(d.assist);
        if (assister) ensure(assister.num).assists++;
      }
    } else if (d.type === 'yellow') {
      const p = findByName(d.player);
      if (p) ensure(p.num).yellow = true;
    } else if (d.type === 'red') {
      const p = findByName(d.player);
      if (p) ensure(p.num).red = true;
    }
  });

  // Half-time subs walk out for the second half.
  if (minute > 45 && side.htSubs) {
    side.htSubs.forEach(s => { ensure(s.on.num).subOn = "45'"; ensure(s.off.num).subOff = "45'"; });
  }
  // One knock late in the game.
  const rng = mulberry32(hash(`${matchId}:${team}:injuries`));
  if (minute > 60 && rng() < 0.4) {
    const cand = side.xi[1 + Math.floor(rng() * (side.xi.length - 1))];
    if (cand) ensure(cand.num).injured = true;
  }

  const apply = (p) => { if (evByNum[p.num]) p.ev = evByNum[p.num]; };
  side.xi.forEach(apply);
  if (side.xi2) side.xi2.forEach(apply);
  side.subs.forEach(apply);
}

export function applySimBadges(lu, fx, st) {
  if (!lu || !st || st.status === 'pre') return lu;
  decorateSide(lu.home, fx.id, fx.a, true, st.details || [], st.minute || 0);
  decorateSide(lu.away, fx.id, fx.b, false, st.details || [], st.minute || 0);
  return lu;
}

/* Simulated state of one match at virtual time `now`. */
function simulate(matchId, a, b, kickoff, knockout, now) {
  const ph = phase(now, kickoff);
  if (ph.status === 'pre') return { status: 'pre', sa: null, sb: null, minute: 0 };
  const sc = getScript(matchId, a, b, knockout);
  const m = ph.minute;
  const sa = sc.ga.filter(g => g <= m).length;
  const sb = sc.gb.filter(g => g <= m).length;

  const rng = mulberry32(hash(`${matchId}:stats`));
  const saStrength = D.TEAMS[a]?.str || 75;
  const sbStrength = D.TEAMS[b]?.str || 75;

  const basePossession = 50 + (saStrength - sbStrength) / 3;
  const homePoss = Math.max(35, Math.min(65, Math.round((basePossession + (rng() - 0.5) * 8) * 10) / 10));
  const awayPoss = Math.round((100 - homePoss) * 10) / 10;

  const finalHomeShots = sa * 2 + Math.floor(homePoss / 5) + Math.floor(rng() * 5);
  const finalAwayShots = sb * 2 + Math.floor(awayPoss / 5) + Math.floor(rng() * 5);

  const finalHomeSOG = sa + Math.floor(rng() * (finalHomeShots - sa) * 0.4);
  const finalAwaySOG = sb + Math.floor(rng() * (finalAwayShots - sb) * 0.4);

  const finalHomeFouls = 7 + Math.floor(rng() * 11);
  const finalAwayFouls = 7 + Math.floor(rng() * 11);

  const finalHomeCorners = Math.floor(homePoss / 9) + Math.floor(rng() * 4);
  const finalAwayCorners = Math.floor(awayPoss / 9) + Math.floor(rng() * 4);

  const scale = ph.status === 'ft' ? 1 : m / 90;
  const hShots = Math.max(sa, Math.round(finalHomeShots * scale));
  const aShots = Math.max(sb, Math.round(finalAwayShots * scale));
  const hSOG = Math.max(sa, Math.min(hShots, Math.round(finalHomeSOG * scale)));
  const aSOG = Math.max(sb, Math.min(aShots, Math.round(finalAwaySOG * scale)));
  const hFouls = Math.round(finalHomeFouls * scale);
  const aFouls = Math.round(finalAwayFouls * scale);
  const hCorners = Math.round(finalHomeCorners * scale);
  const aCorners = Math.round(finalAwayCorners * scale);

  const details = [];

  sc.ga.forEach((min, idx) => {
    if (min <= m) {
      const isPenalty = hash(`${matchId}:goal:home:${idx}`) % 10 === 0;
      const isOwnGoal = hash(`${matchId}:goal:home:${idx}`) % 20 === 0;
      let assist = '';
      if (!isOwnGoal && !isPenalty) {
        const hasAssist = hash(`${matchId}:assist:home:${idx}`) % 10 < 7;
        if (hasAssist) {
          assist = getPlayerName(a, idx + min + 1);
        }
      }
      details.push({
        type: 'goal',
        typeText: isOwnGoal ? 'Own Goal' : isPenalty ? 'Penalty Goal' : 'Goal',
        clock: `${min}'`,
        player: getPlayerName(isOwnGoal ? b : a, idx + min),
        assist,
        isHome: true,
        ownGoal: isOwnGoal,
        penalty: isPenalty
      });
    }
  });

  sc.gb.forEach((min, idx) => {
    if (min <= m) {
      const isPenalty = hash(`${matchId}:goal:away:${idx}`) % 10 === 0;
      const isOwnGoal = hash(`${matchId}:goal:away:${idx}`) % 20 === 0;
      let assist = '';
      if (!isOwnGoal && !isPenalty) {
        const hasAssist = hash(`${matchId}:assist:away:${idx}`) % 10 < 7;
        if (hasAssist) {
          assist = getPlayerName(b, idx + min + 1);
        }
      }
      details.push({
        type: 'goal',
        typeText: isOwnGoal ? 'Own Goal' : isPenalty ? 'Penalty Goal' : 'Goal',
        clock: `${min}'`,
        player: getPlayerName(isOwnGoal ? a : b, idx + min),
        assist,
        isHome: false,
        ownGoal: isOwnGoal,
        penalty: isPenalty
      });
    }
  });

  const numCards = 2 + Math.floor(rng() * 4);
  for (let idx = 0; idx < numCards; idx++) {
    const cardMin = Math.floor(5 + rng() * 83);
    if (cardMin <= m) {
      const isHome = rng() < 0.5;
      const cardType = rng() < 0.08 ? 'red' : 'yellow';
      const team = isHome ? a : b;
      details.push({
        type: cardType,
        typeText: cardType === 'red' ? 'Red Card' : 'Yellow Card',
        clock: `${cardMin}'`,
        player: getPlayerName(team, idx + 10),
        isHome: isHome
      });
    }
  }

  details.sort((x, y) => {
    const minX = parseInt(x.clock.replace("'", ''), 10);
    const minY = parseInt(y.clock.replace("'", ''), 10);
    return minX - minY;
  });

  const assignedVenue = venueFor(matchId).stadium;

  const out = {
    status: ph.status,
    sa,
    sb,
    minute: m,
    details,
    statsHome: {
      possessionPct: String(homePoss),
      totalShots: String(hShots),
      shotsOnTarget: String(hSOG),
      foulsCommitted: String(hFouls),
      wonCorners: String(hCorners)
    },
    statsAway: {
      possessionPct: String(awayPoss),
      totalShots: String(aShots),
      shotsOnTarget: String(aSOG),
      foulsCommitted: String(aFouls),
      wonCorners: String(aCorners)
    },
    venue: assignedVenue
  };

  if (ph.status === 'ft' && knockout) {
    if (sc.pens) { out.pensA = sc.pens[0]; out.pensB = sc.pens[1]; }
    out.winner = sc.pens ? (sc.pens[0] > sc.pens[1] ? a : b) : (sa > sb ? a : b);
  }
  return out;
}

/* ---------- standings ---------- */
export function computeStandings(states) {
  const standings = {};
  for (const [g, codes] of Object.entries(D.GROUPS)) {
    const rows = {};
    codes.forEach(c => { rows[c] = { code: c, group: g, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, qualified: false }; });
    for (const fx of D.GROUP_FIXTURES) {
      if (fx.group !== g) continue;
      const st = states[fx.id];
      if (!st || !['ft', 'live', 'ht'].includes(st.status)) continue;
      const A = rows[fx.a], B = rows[fx.b];
      A.p++; B.p++; A.gf += st.sa; A.ga += st.sb; B.gf += st.sb; B.ga += st.sa;
      if (st.sa > st.sb) { A.w++; B.l++; A.pts += 3; }
      else if (st.sa < st.sb) { B.w++; A.l++; B.pts += 3; }
      else { A.d++; B.d++; A.pts++; B.pts++; }
    }
    Object.values(rows).forEach(r => { r.gd = r.gf - r.ga; });
    standings[g] = Object.values(rows).sort((x, y) =>
      y.pts - x.pts || y.gd - x.gd || y.gf - x.gf ||
      codes.indexOf(x.code) - codes.indexOf(y.code));
    standings[g].forEach((r, i) => { r.rank = i + 1; });
  }
  return standings;
}

export const groupComplete = (g, states) =>
  D.GROUP_FIXTURES.filter(f => f.group === g).every(f => states[f.id] && states[f.id].status === 'ft');

export function bestThirds(standings) {
  return rankThirds(standings).slice(0, 8).map(r => r.code);
}

export function rankThirds(standings) {
  return Object.entries(standings).map(([group, rows]) => ({ ...rows[2], group }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.group.localeCompare(y.group))
    .map((r, i) => ({ ...r, thirdRank: i + 1 }));
}

function enumerateGroupOutcomes(group, states, standings) {
  const codes = D.GROUPS[group];
  const fixtures = D.GROUP_FIXTURES.filter(f => f.group === group);
  const remaining = fixtures.filter(f => !states[f.id] || !['ft', 'live', 'ht'].includes(states[f.id].status));
  const basePts = {};
  standings[group].forEach(r => { basePts[r.code] = r.pts; });

  const outcomes = [];
  const walk = (idx, pts) => {
    if (idx >= remaining.length) {
      const sorted = codes.map(code => ({ code, pts: pts[code] }))
        .sort((a, b) => b.pts - a.pts || codes.indexOf(a.code) - codes.indexOf(b.code));
      outcomes.push({ pts: { ...pts }, thirdPts: sorted[2].pts });
      return;
    }
    const fx = remaining[idx];

    const homeWin = { ...pts, [fx.a]: pts[fx.a] + 3 };
    walk(idx + 1, homeWin);

    const draw = { ...pts, [fx.a]: pts[fx.a] + 1, [fx.b]: pts[fx.b] + 1 };
    walk(idx + 1, draw);

    const awayWin = { ...pts, [fx.b]: pts[fx.b] + 3 };
    walk(idx + 1, awayWin);
  };

  walk(0, basePts);
  return outcomes;
}

function applyQualificationFlags(standings, states, allGroupsDone) {
  const rankedThirds = rankThirds(standings);
  const finalBestThirdCodes = new Set(allGroupsDone ? rankedThirds.slice(0, 8).map(r => r.code) : []);

  if (allGroupsDone) {
    Object.values(standings).forEach(rows => {
      rows.forEach(r => {
        r.qualified = r.rank <= 2 || finalBestThirdCodes.has(r.code);
        r.qualificationRoute = r.rank <= 2 ? 'group' : finalBestThirdCodes.has(r.code) ? 'third' : null;
      });
    });
    return rankedThirds.map(r => ({
      ...r,
      qualified: finalBestThirdCodes.has(r.code),
      qualificationRoute: finalBestThirdCodes.has(r.code) ? 'third' : null
    }));
  }

  const outcomesByGroup = {};
  const maxThirdPtsByGroup = {};
  Object.keys(D.GROUPS).forEach(g => {
    outcomesByGroup[g] = enumerateGroupOutcomes(g, states, standings);
    maxThirdPtsByGroup[g] = Math.max(...outcomesByGroup[g].map(o => o.thirdPts));
  });

  Object.entries(standings).forEach(([group, rows]) => {
    const groupOutcomes = outcomesByGroup[group];

    rows.forEach(row => {
      let sawThirdRoute = false;
      const qualifiesInEveryOutcome = groupOutcomes.every(outcome => {
        const teamPts = outcome.pts[row.code];
        const worstRank = D.GROUPS[group]
          .filter(code => code !== row.code && outcome.pts[code] >= teamPts)
          .length + 1;

        if (worstRank <= 2) return true;
        if (worstRank > 3) return false;

        const groupsAbleToOvertake = Object.entries(maxThirdPtsByGroup)
          .filter(([otherGroup, maxPts]) => otherGroup !== group && maxPts >= teamPts)
          .length;

        const thirdRouteIsSafe = groupsAbleToOvertake <= 7;
        if (thirdRouteIsSafe) sawThirdRoute = true;
        return thirdRouteIsSafe;
      });

      row.qualified = qualifiesInEveryOutcome;
      row.qualificationRoute = qualifiesInEveryOutcome ? (sawThirdRoute ? 'third' : 'group') : null;
    });
  });

  return rankThirds(standings).map(r => {
    const source = standings[r.group].find(row => row.code === r.code);
    return {
      ...r,
      qualified: Boolean(source && source.qualified),
      qualificationRoute: source ? source.qualificationRoute : null
    };
  });
}

/* ---------- bracket resolution ---------- */
function resolveBracket(states, standings, allGroupsDone, provider, now) {
  const teams = {}; // matchId -> [codeA|null, codeB|null]
  const thirds = allGroupsDone ? bestThirds(states.__standings || standings) : null;

  const resolveSrc = (s) => {
    if (s.w) return allGroupsDone && groupComplete(s.w, states) ? standings[s.w][0].code : null;
    if (s.r) return allGroupsDone && groupComplete(s.r, states) ? standings[s.r][1].code : null;
    if (s.t) return thirds ? thirds[s.t - 1] : null;
    if (s.win || s.lose) {
      const ref = s.win || s.lose;
      const st = states[ref], tm = teams[ref];
      if (!st || st.status !== 'ft' || !tm) return null;
      const winner = st.winner;
      if (!winner) return null;
      return s.win ? winner : (tm[0] === winner ? tm[1] : tm[0]);
    }
    return null;
  };

  for (const m of D.KO) {
    const a = resolveSrc(m.src[0]);
    const b = resolveSrc(m.src[1]);
    teams[m.id] = [a, b];
    states[m.id] = (a && b) ? provider(m, a, b, now) : { status: 'pre', sa: null, sb: null, minute: 0 };
  }
  return teams;
}

/* ---------- snapshot ---------- */
export function snapshot(now, mode, liveStates) {
  const states = {};

  for (const fx of D.GROUP_FIXTURES) {
    states[fx.id] = mode === 'sim'
      ? simulate(fx.id, fx.a, fx.b, fx.ts, false, now)
      : (liveStates && liveStates[fx.id]) || { status: 'pre', sa: null, sb: null, minute: 0 };
  }

  const standings = computeStandings(states);
  const allDone = Object.keys(D.GROUPS).every(g => groupComplete(g, states));
  const thirdStandings = applyQualificationFlags(standings, states, allDone);

  const provider = mode === 'sim'
    ? (m, a, b, t) => simulate(m.id, a, b, m.ts, true, t)
    : (m, a, b) => {
        const st = liveStates && (liveStates[m.id] || liveStates[`${a}|${b}`] || liveStates[`${b}|${a}`]);
        if (!st) return { status: 'pre', sa: null, sb: null, minute: 0 };
        if (st.status === 'ft' && !st.winner) st.winner = st.sa > st.sb ? a : b;
        return st;
      };

  const teams = resolveBracket(states, standings, allDone, provider, now);

  const finalSt = states.M104;
  const champion = (finalSt && finalSt.status === 'ft' && finalSt.winner) ? finalSt.winner : null;

  return { now, states, standings, thirdStandings, teams, allGroupsDone: allDone, champion };
}
