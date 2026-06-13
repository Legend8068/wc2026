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
      details.push({
        type: 'goal',
        typeText: isOwnGoal ? 'Own Goal' : isPenalty ? 'Penalty Goal' : 'Goal',
        clock: `${min}'`,
        player: getPlayerName(isOwnGoal ? b : a, idx + min),
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
      details.push({
        type: 'goal',
        typeText: isOwnGoal ? 'Own Goal' : isPenalty ? 'Penalty Goal' : 'Goal',
        clock: `${min}'`,
        player: getPlayerName(isOwnGoal ? a : b, idx + min),
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
    }
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
    codes.forEach(c => { rows[c] = { code: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    for (const fx of D.GROUP_FIXTURES) {
      if (fx.group !== g) continue;
      const st = states[fx.id];
      if (!st || st.status !== 'ft') continue;
      const A = rows[fx.a], B = rows[fx.b];
      A.p++; B.p++; A.gf += st.sa; A.ga += st.sb; B.gf += st.sb; B.ga += st.sa;
      if (st.sa > st.sb) { A.w++; B.l++; A.pts += 3; }
      else if (st.sa < st.sb) { B.w++; A.l++; B.pts += 3; }
      else { A.d++; B.d++; A.pts++; B.pts++; }
    }
    standings[g] = Object.values(rows).sort((x, y) =>
      y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf ||
      codes.indexOf(x.code) - codes.indexOf(y.code));
    standings[g].forEach((r, i) => { r.rank = i + 1; });
  }
  return standings;
}

export const groupComplete = (g, states) =>
  D.GROUP_FIXTURES.filter(f => f.group === g).every(f => states[f.id] && states[f.id].status === 'ft');

export function bestThirds(standings) {
  return Object.values(standings).map(rows => rows[2])
    .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
    .slice(0, 8).map(r => r.code);
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

  return { now, states, standings, teams, allGroupsDone: allDone, champion };
}
