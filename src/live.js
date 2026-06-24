/* ============================================================
   WC2026 — Live score provider
   Polls ESPN's public World Cup scoreboard (no API key) and
   maps events onto our fixture ids.
   ============================================================ */

import D from './data';

const FEED = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=400&dates=20260611-20260721';

/* ── API-Football line-ups ────────────────────────────────────────────────
   Real starting line-ups (formation + per-player grid positions) come from
   API-Football. The same key works via two hosts, which authenticate
   differently — we auto-detect from VITE_RAPIDAPI_HOST:
     • Direct API-Sports : host "v3.football.api-sports.io", header x-apisports-key,
                           base URL has the version in the host (no /v3 path).
     • RapidAPI marketplace: host "api-football-v1.p.rapidapi.com", X-RapidAPI-* headers,
                           base URL needs a /v3 path segment.
   Everything degrades gracefully: no key / failed call → ESPN rosters → sim. */
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'v3.football.api-sports.io';
const AF_DIRECT = /api-sports\.io/i.test(RAPIDAPI_HOST);
const AF_BASE = AF_DIRECT ? `https://${RAPIDAPI_HOST}` : `https://${RAPIDAPI_HOST}/v3`;
const afHeaders = AF_DIRECT
  ? { 'x-apisports-key': RAPIDAPI_KEY }
  : { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST };
const AF_LEAGUE = 1;      // FIFA World Cup
const AF_SEASON = 2026;

/* Session caches so we stay well under the free 100 req/day quota. */
const _afFixturesByDate = new Map();   // 'YYYY-MM-DD' -> [{id, a, b}]
const _afLineupCache = new Map();      // fixtureId -> { home, away } (raw API-Football)
let _afDisabled = false;               // tripped on a plan/quota error so we stop burning requests

/* name normalisation: lowercase, replace hyphens with spaces, strip accents & remaining punctuation */
const norm = (s) => s.toLowerCase().normalize('NFD')
  .replace(/-/g, ' ')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

const NAME_TO_CODE = {};
for (const [code, t] of Object.entries(D.TEAMS)) NAME_TO_CODE[norm(t.name)] = code;
Object.assign(NAME_TO_CODE, {
  'usa': 'USA', 'united states of america': 'USA',
  'korea republic': 'KOR', 'south korea': 'KOR',
  'czech republic': 'CZE',
  'turkey': 'TUR', 'turkiye': 'TUR',
  'bosnia and herzegovina': 'BIH', 'bosnia herzegovina': 'BIH', 'bosniaherzegovina': 'BIH',
  'ivory coast': 'CIV', 'cote divoire': 'CIV',
  'cabo verde': 'CPV',
  'congo dr': 'COD', 'dr congo': 'COD', 'democratic republic of the congo': 'COD',
  'ir iran': 'IRN', 'iran': 'IRN',
  'curacao': 'CUW'
});

/* unordered team-pair -> group fixture id */
const PAIR_TO_FIXTURE = {};
for (const fx of D.GROUP_FIXTURES) {
  PAIR_TO_FIXTURE[`${fx.a}|${fx.b}`] = fx.id;
  PAIR_TO_FIXTURE[`${fx.b}|${fx.a}`] = fx.id;
}

function parseEvent(ev) {
  const comp = ev.competitions && ev.competitions[0];
  if (!comp || !comp.competitors || comp.competitors.length < 2) return null;
  const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
  const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];

  const rawHome = home.team.displayName || home.team.name || '';
  const rawAway = away.team.displayName || away.team.name || '';
  const a = NAME_TO_CODE[norm(rawHome)];
  const b = NAME_TO_CODE[norm(rawAway)];

  if (!a || !b) {
    // Only warn for matches within the scope of the World Cup feed
    if (!a) console.warn(`live scoreboard: could not map home team name "${rawHome}" (normalized: "${norm(rawHome)}") to a country code.`);
    if (!b) console.warn(`live scoreboard: could not map away team name "${rawAway}" (normalized: "${norm(rawAway)}") to a country code.`);
    return null;
  }

  const type = (ev.status && ev.status.type) || {};
  const espnState = type.state || 'pre'; // pre | in | post
  // ESPN labels the break inconsistently: type.name === 'STATUS_HALFTIME',
  // shortDetail "HT", or description/detail containing "Halftime". Check all so
  // the break never slips through as a live minute (it used to read "0′ LIVE").
  const detailBlob = `${type.name || ''} ${type.shortDetail || ''} ${type.detail || ''} ${type.description || ''}`;
  const isHalftime = type.name === 'STATUS_HALFTIME' || /halftime|half[\s-]?time|\bht\b/i.test(detailBlob);
  const isDelayed = type.name === 'STATUS_DELAYED' || /delay/i.test(detailBlob);
  const isSuspended = type.name === 'STATUS_SUSPENDED' || /suspend/i.test(detailBlob);
  const period = (ev.status && ev.status.period) || 1;
  const status = espnState === 'post' ? 'ft'
    : espnState === 'in' ? (
        period === 5 ? 'pen' :
        period === 4 ? 'et2' :
        period === 3 ? (isHalftime ? 'et-ht' : 'et1') :
        (isHalftime ? 'ht' : 'live')
      )
    : 'pre';

  const getStats = (competitor) => {
    const stats = {};
    if (competitor.statistics) {
      competitor.statistics.forEach(s => {
        stats[s.name] = s.displayValue;
      });
    }
    return stats;
  };

  const details = [];
  if (comp.details) {
    comp.details.forEach(d => {
      const typeText = d.type?.text || '';
      const clockVal = d.clock?.displayValue || '';
      const isGoal = d.scoringPlay || false;
      const isRed = d.redCard || false;
      const isYellow = d.yellowCard || false;
      const involved = d.athletesInvolved || [];
      const athlete = involved[0]?.displayName || '';
      // Goals often carry the assister as a second athlete (role "assist").
      const assistObj = involved.find(x => /assist/i.test(x.type?.name || x.type || '')) || involved[1];
      const assist = isGoal ? (assistObj?.displayName || '') : '';
      const teamId = d.team?.id || '';
      const isHomeTeam = teamId === home.id;

      if (isGoal || isRed || isYellow) {
        details.push({
          type: isGoal ? 'goal' : isRed ? 'red' : 'yellow',
          typeText,
          clock: clockVal,
          player: athlete,
          assist,
          isHome: isHomeTeam,
          ownGoal: d.ownGoal || false,
          penalty: d.penaltyKick || false
        });
      }
    });
  }

  // ESPN's displayClock is already nicely formatted, incl. stoppage time
  // ("67'", "45'+2'", "90'+4'"). `minute` is the numeric base (90 for "90'+4'")
  // for logic; `clockText` is the display string ("90+4") incl. added time.
  const rawClock = (ev.status && ev.status.displayClock) || '';
  const liveMin = parseInt(rawClock, 10) || 0;
  const liveClockText = rawClock.replace(/'/g, '').trim();

  const venueObj = comp.venue || {};
  const venueStr = venueObj.fullName || venueObj.address?.city || '';

  const st = {
    status,
    eid: ev.id,                                    // ESPN event id — lets the UI lazily fetch the line-up on expand
    isoDate: (ev.date || '').slice(0, 10),
    period: (ev.status && ev.status.period) || 1, // 1 = first half, 2 = second half (used to rebuild the current XI)
    sa: status === 'pre' ? null : parseInt(home.score, 10) || 0,
    sb: status === 'pre' ? null : parseInt(away.score, 10) || 0,
    minute: ['live', 'et1', 'et2'].includes(status) ? liveMin : (status === 'pre' ? 0 : 90),
    clockText: ['live', 'et1', 'et2'].includes(status) ? (liveClockText || String(liveMin)) : null, // e.g. "90+4"
    details,
    statsHome: getStats(home),
    statsAway: getStats(away),
    venue: venueStr,
    homeId: home.id,
    awayId: away.id,
    isDelayed,
    isSuspended
  };
  if (status === 'ft') {
    if (home.winner) st.winner = a;
    else if (away.winner) st.winner = b;
    const pens = (sh) => sh && sh.find(x => /shootout/i.test(x.name || ''));
    const pa = pens(home.shootoutScore ? null : home.statistics); // best effort; many feeds put it on .shootoutScore
    if (home.shootoutScore != null && away.shootoutScore != null) {
      st.pensA = +home.shootoutScore; st.pensB = +away.shootoutScore;
      st.winner = st.pensA > st.pensB ? a : b;
    }
    void pa;
  }
  return {
    a, b, st,
    date: ev.date ? Date.parse(ev.date) : null,
    isoDate: (ev.date || '').slice(0, 10),  // 'YYYY-MM-DD' for API-Football lookups
    homeId: home.id, awayId: away.id,       // ESPN team ids (for matching sub events)
    eventId: ev.id
  };
}

/* ---------- RapidAPI · API-Football line-ups ----------
   Real formation + starting XI with per-player grid coordinates. Cached hard to
   respect the free quota. Returns null (→ ESPN fallback) on any miss. */
async function afFetch(path) {
  if (!RAPIDAPI_KEY || _afDisabled) return null;
  try {
    const res = await fetch(`${AF_BASE}${path}`, { headers: afHeaders, cache: 'no-store' });
    if (!res.ok) { console.warn(`API-Football ${path} → ${res.status}`); return null; }
    const j = await res.json();
    // API-Football returns HTTP 200 with an `errors` object for plan / quota /
    // auth problems. When the season or quota is off-limits, stop calling for the
    // rest of the session so we don't waste the daily request budget.
    const errs = j && j.errors;
    if (errs && (errs.plan || errs.token || errs.requests || errs.access)) {
      _afDisabled = true;
      console.warn('API-Football disabled this session:', errs);
      return null;
    }
    return j;
  } catch (e) { console.warn('API-Football fetch failed', e); return null; }
}

async function afFixtureId(dateStr, a, b) {
  if (!RAPIDAPI_KEY || !dateStr) return null;
  if (!_afFixturesByDate.has(dateStr)) {
    const j = await afFetch(`/fixtures?league=${AF_LEAGUE}&season=${AF_SEASON}&date=${dateStr}`);
    const list = (j?.response || []).map(f => ({
      id: f.fixture?.id,
      a: NAME_TO_CODE[norm(f.teams?.home?.name || '')],
      b: NAME_TO_CODE[norm(f.teams?.away?.name || '')]
    })).filter(x => x.id && x.a && x.b);
    _afFixturesByDate.set(dateStr, list);
  }
  const hit = (_afFixturesByDate.get(dateStr) || [])
    .find(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
  return hit ? hit.id : null;
}

const AF_POS = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };

function cloneSide(s) {
  return s && { formation: s.formation, xi: s.xi.map(p => ({ ...p })), subs: s.subs.map(p => ({ ...p })) };
}

async function afLineups(fixtureId, a, b) {
  if (!fixtureId) return null;
  if (!_afLineupCache.has(fixtureId)) {
    const j = await afFetch(`/fixtures/lineups?fixture=${fixtureId}`);
    const arr = j?.response || [];
    if (arr.length < 2) return null;
    const mapPlayer = (e) => ({
      id: e.player?.id,
      name: e.player?.name || 'Unknown',
      num: e.player?.number || '',
      pos: AF_POS[(e.player?.pos || '').toUpperCase()] || 'MID',
      grid: e.player?.grid || null   // "row:col" — exact pitch placement
    });
    const out = { home: null, away: null };
    arr.forEach(t => {
      const code = NAME_TO_CODE[norm(t.team?.name || '')];
      const side = code === a ? 'home' : code === b ? 'away' : null;
      if (!side) return;
      out[side] = {
        formation: t.formation || '4-3-3',
        xi: (t.startXI || []).map(mapPlayer),
        subs: (t.substitutes || []).map(mapPlayer)
      };
    });
    if (!out.home || !out.away) return null;
    _afLineupCache.set(fixtureId, out);
  }
  const c = _afLineupCache.get(fixtureId);
  return { home: cloneSide(c.home), away: cloneSide(c.away) };
}

/* ---------- per-player match events (badges) ----------
   Goals/assists/cards come from the ESPN scoreboard details we already parsed;
   substitutions + injuries come from the ESPN summary feed (the user asked to
   keep ESPN for subs). Everything is keyed by normalised player name so it can
   attach onto whichever line-up source we ended up with. */
const pnorm = (s) => norm(String(s || '')).replace(/\./g, '');
const lastTok = (s) => { const t = pnorm(s).split(' ').filter(Boolean); return t[t.length - 1] || ''; };

function buildBadgeIndex(st, sumEvents, homeId, awayId, injuries) {
  const idx = { home: new Map(), away: new Map() };
  const ensure = (side, name) => {
    const key = pnorm(name);
    let ev = idx[side].get(key);
    if (!ev) { ev = { goals: 0, assists: 0, yellow: false, red: false, subOff: null, subOn: null, injured: false, _last: lastTok(name) }; idx[side].set(key, ev); }
    return ev;
  };
  (st.details || []).forEach(d => {
    const side = d.isHome ? 'home' : 'away';
    if (d.type === 'goal') {
      if (d.player) ensure(side, d.player).goals++;
      if (d.assist) ensure(side, d.assist).assists++;
    } else if (d.type === 'yellow' && d.player) {
      ensure(side, d.player).yellow = true;
    } else if (d.type === 'red' && d.player) {
      ensure(side, d.player).red = true;
    }
  });
  (sumEvents || []).forEach(e => {
    if (e.type?.type !== 'substitution') return;
    const side = e.team?.id === homeId ? 'home' : e.team?.id === awayId ? 'away' : null;
    if (!side) return;
    const inName = e.participants?.[0]?.athlete?.displayName;
    const outName = e.participants?.[1]?.athlete?.displayName;
    const injured = /injur|knock/i.test(`${e.type?.text || ''} ${e.text || ''}`);
    if (inName) ensure(side, inName).subOn = e.clock?.displayValue || '½';
    if (outName) { const ev = ensure(side, outName); ev.subOff = e.clock?.displayValue || '½'; if (injured) ev.injured = true; }
  });
  // ESPN summary sometimes carries a dedicated injuries block.
  (injuries || []).forEach(block => {
    const side = block.team?.id === homeId ? 'home' : block.team?.id === awayId ? 'away' : null;
    if (!side) return;
    (block.injuries || []).forEach(inj => {
      const nm = inj.athlete?.displayName;
      if (nm) ensure(side, nm).injured = true;
    });
  });
  return idx;
}

function applyBadges(side, map) {
  if (!side || !map) return;
  // last-name fallback index for "K. De Bruyne" vs "Kevin De Bruyne" mismatches
  const byLast = new Map();
  map.forEach(ev => { if (ev._last && !byLast.has(ev._last)) byLast.set(ev._last, ev); });
  const apply = (p) => {
    const ev = map.get(pnorm(p.name)) || byLast.get(lastTok(p.name));
    if (ev) p.ev = ev;
  };
  side.xi.forEach(apply);
  side.subs.forEach(apply);
}

/* Second-half starting XI: API-Football only gives the kickoff XI, so we apply
   the ESPN substitutions made in/at the end of the first half. Each incoming
   player inherits the outgoing player's slot + grid so the shape holds. */
function buildSecondHalfXI(side, sumEvents, teamId) {
  if (!side) return;
  const xi2 = side.xi.map(p => ({ ...p }));
  (sumEvents || []).forEach(e => {
    if (e.type?.type !== 'substitution' || e.team?.id !== teamId) return;
    const pNum = e.period?.number || 1;
    const cMins = parseInt((e.clock?.displayValue || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const atBreak = cMins <= 45;
    if (pNum > 1 && !atBreak) return; // only first-half / interval subs define the 2nd-half start
    const inName = e.participants?.[0]?.athlete?.displayName;
    const outName = e.participants?.[1]?.athlete?.displayName;
    if (!inName || !outName) return;
    const i = xi2.findIndex(p => pnorm(p.name) === pnorm(outName) || lastTok(p.name) === lastTok(outName));
    if (i === -1) return;
    xi2[i] = {
      ...xi2[i],
      id: e.participants?.[0]?.athlete?.id,
      name: inName,
      num: e.participants?.[0]?.athlete?.jersey || xi2[i].num,
      on: true
    };
  });
  side.formation2 = side.formation;
  side.xi2 = xi2;
}

/* ---------- lazy line-up fetch (on card expand) ----------
   Pulls the ESPN summary for one match, builds the line-up (API-Football grid
   if ever available → ESPN rosters), attaches per-player badges + the
   second-half XI, and returns it. Completed matches are cached permanently
   (their line-up never changes); live/HT matches are re-fetched so badges and
   substitutions stay current. */
const _lineupByEid = new Map();   // eid -> enriched lineups (FT only)

export async function fetchLineup(eid, a, b, isoDate, st) {
  if (!eid) return null;
  if (_lineupByEid.has(eid)) return _lineupByEid.get(eid);

  let sumJson = null;
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eid}`, { cache: 'no-store' });
    if (res.ok) sumJson = await res.json();
  } catch (err) {
    console.error('Failed to fetch ESPN summary', err);
  }
  const sumEvents = sumJson?.keyEvents || [];

  // Inject assists from summary keyEvents into st.details
  if (st && st.details && sumEvents.length > 0) {
    sumEvents.forEach(e => {
      const isGoal = e.type?.type?.toLowerCase().includes('goal') || e.type?.text?.toLowerCase().includes('goal') || e.scoringPlay;
      if (isGoal && e.participants && e.participants.length >= 2) {
        const scorer = e.participants[0]?.athlete?.displayName;
        const assister = e.participants[1]?.athlete?.displayName;
        const clock = e.clock?.displayValue;
        if (scorer && assister) {
          const normScorer = norm(scorer);
          const match = st.details.find(d => {
            return d.type === 'goal' && 
                   d.clock === clock && 
                   (norm(d.player) === normScorer || lastTok(d.player) === lastTok(scorer));
          });
          if (match) {
            match.assist = assister;
          }
        }
      }
    });
  }

  // Line-ups: API-Football (grid) first if reachable, else ESPN rosters.
  let lu = null;
  try {
    const fid = await afFixtureId(isoDate, a, b);
    lu = await afLineups(fid, a, b);
  } catch (err) {
    console.warn('API-Football lineup lookup failed', err);
  }
  if ((!lu || !lu.home || !lu.away) && sumJson?.rosters) {
    lu = parseRosters(sumJson.rosters, sumEvents, st?.period || 1);
  }
  if (!lu || !lu.home || !lu.away) return null;

  lu.shootout = sumJson?.shootout || null;

  // Team ids (for matching substitution / injury events to a side).
  let homeId = null, awayId = null;
  (sumJson?.rosters || []).forEach(r => {
    if (r.homeAway === 'home') homeId = r.team?.id; else awayId = r.team?.id;
  });

  const idx = buildBadgeIndex(st || {}, sumEvents, homeId, awayId, sumJson?.injuries);
  applyBadges(lu.home, idx.home);
  applyBadges(lu.away, idx.away);
  buildSecondHalfXI(lu.home, sumEvents, homeId);
  buildSecondHalfXI(lu.away, sumEvents, awayId);

  if (st?.status === 'ft') _lineupByEid.set(eid, lu); // freeze finished matches
  return lu;
}

/* Fetch and map the feed into { fixtureId|teamPair : state }.
   Group games map by team pair; knockout games are keyed by
   "A|B" pair — the engine looks both orderings up once the
   bracket slots resolve. */
export async function fetchStates() {
  const res = await fetch(FEED, { cache: 'no-store' });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const json = await res.json();
  const events = json.events || [];
  const states = {};
  let mapped = 0;
  for (const ev of events) {
    const p = parseEvent(ev);
    if (!p) continue;
    const fxId = PAIR_TO_FIXTURE[`${p.a}|${p.b}`];
    if (fxId && !(states[fxId] && states[fxId].status === 'ft')) {
      // group fixtures can repeat pairs across the feed window only
      // erroneously; first FT result wins. Line-ups are fetched lazily by the
      // UI (fetchLineup) when a card is expanded — for live, HT and FT matches —
      // so polls stay cheap and every opened match shows real ESPN data.
      states[fxId] = p.st;
    } else if (!fxId) {
      states[`${p.a}|${p.b}`] = p.st; // knockout — resolved by pair
    }
    mapped++;
  }
  if (!mapped) throw new Error('no events mapped');
  return states;
}

function parseRosters(rosters, events = [], currentPeriod = 1) {
  const res = { home: null, away: null };
  if (!rosters) return res;
  for (const r of rosters) {
    const isHome = r.homeAway === 'home';
    const side = isHome ? 'home' : 'away';
    
    const formation = r.formation || '4-3-3';
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    const subs = [];
    
    // Map an ESPN abbreviation to a GK/DEF/MID/FWD bucket. ESPN uses hyphenated,
    // side-aware codes (CD-L, CM-R, DM, LWB…), so we classify by the STEM rather
    // than exact-matching — and never return an unknown bucket (a starter that
    // fell through used to crash the parser). Holding mids fold into MID; the
    // precise placement comes from the abbr later in VisualLineup.
    const mapPos = (abbr) => {
      const a = (abbr || '').toUpperCase().replace(/-(L|R|C)$/, '').replace(/[^A-Z]/g, '');
      if (!a || a === 'SUB' || a === 'SUBSTITUTE') return 'SUB';   // bench: ESPN tags these "SUB"
      if (/^G/.test(a)) return 'GK';
      if (/^(DM|CDM)/.test(a)) return 'MID';
      if (/(WB|CB|CD|^LB$|^RB$|^D$|^DF$|^DEF$)/.test(a)) return 'DEF';
      if (/(^F$|^FW$|ST|CF|^LW$|^RW$|^W$|^S$|^SS$|LF|RF)/.test(a)) return 'FWD';
      if (/(^M$|MF|CM|^LM$|^RM$|AM)/.test(a)) return 'MID';
      return 'MID';
    };
    
    const sortWeight = {
      'LWB': 10, 'LB': 20, 'CD-L': 30, 'LCB': 30, 'CB': 40, 'CD': 40, 'CD-R': 50, 'RCB': 50, 'RB': 60, 'RWB': 70,
      'LDM': 110, 'DM': 120, 'RDM': 130,
      'LM': 140, 'LCM': 150, 'CM': 160, 'M': 160, 'RCM': 170, 'RM': 180,
      'LW': 190, 'LAM': 200, 'AM-L': 200, 'AM': 210, 'AM-R': 220, 'RAM': 220, 'RW': 230,
      'LF': 310, 'CF': 320, 'F': 320, 'ST': 320, 'RF': 330
    };

    (r.roster || []).forEach(p => {
      if (p.active === false) return;
      const abbr = (p.position?.abbreviation || '').toUpperCase();
      const playerObj = {
        id: p.athlete?.id,
        name: p.athlete?.displayName || p.athlete?.shortName || 'Unknown',
        num: parseInt(p.jersey, 10) || '',
        pos: mapPos(abbr),
        abbr: abbr,                       // detailed ESPN position (e.g. "CD-L", "CM-R", "DM")
        place: p.formationPlace || null   // ESPN 1–11 slot number (lane-ordering tiebreaker)
      };
      if (p.starter) {
        (grouped[playerObj.pos] || grouped.MID).push(playerObj);
      } else {
        subs.push(playerObj);
      }
    });

    // Apply substitutions that happened before the start of the current half
    if (events.length > 0 && currentPeriod > 1 && r.team?.id) {
      const teamSubs = events.filter(e => 
        e.type?.type === 'substitution' && 
        e.team?.id === r.team.id
      );

      teamSubs.forEach(subEv => {
        const pNum = subEv.period?.number || 1;
        const cValStr = subEv.clock?.displayValue || "0'";
        const cMins = parseInt(cValStr.replace(/[^0-9]/g, ''), 10) || 0;
        const isStartOfPeriod = cMins === (currentPeriod - 1) * 45;

        // Apply if sub occurred in a previous period OR exactly at the kickoff of current period
        if (pNum < currentPeriod || (pNum === currentPeriod && isStartOfPeriod)) {
          const inId = subEv.participants?.[0]?.athlete?.id;
          const outId = subEv.participants?.[1]?.athlete?.id;
          
          if (inId && outId) {
            let foundPos = null;
            // Remove outId from grouped
            for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
              const idx = grouped[pos].findIndex(pl => pl.id === outId);
              if (idx !== -1) {
                foundPos = pos;
                grouped[pos].splice(idx, 1);
                break;
              }
            }
            
            if (foundPos) {
              // Find inId in subs and move to grouped
              const subIdx = subs.findIndex(pl => pl.id === inId);
              if (subIdx !== -1) {
                const inPlayer = subs[subIdx];
                subs.splice(subIdx, 1);
                // Inherit the position of the player being replaced
                inPlayer.pos = foundPos;
                grouped[foundPos].push(inPlayer);
              }
            }
          }
        }
      });
    }

    const sortByPos = (a, b) => (sortWeight[a.abbr] || 500) - (sortWeight[b.abbr] || 500);
    grouped.DEF.sort(sortByPos);
    grouped.MID.sort(sortByPos);
    grouped.FWD.sort(sortByPos);

    let gk = grouped.GK[0];
    if (!gk && grouped.DEF.length > 0) gk = grouped.DEF.shift();
    if (!gk) gk = { name: 'GK', num: 1, pos: 'GK' };

    const xi = [gk, ...grouped.DEF, ...grouped.MID, ...grouped.FWD].filter(Boolean);
    res[side] = { formation, xi, subs };
  }
  return res;
}

/* ── Match highlights ─────────────────────────────────────────────────────
   Asks our /api/highlights serverless proxy for an embeddable YouTube videoId
   from FIFA's official channel. The API key stays server-side; this only ever
   sees a videoId. Any failure — no key, no result, or running the static site
   without the function (plain `vite`, file://) — resolves to null so the UI
   falls back gracefully. */
export async function fetchHighlight(teamAName, teamBName) {
  try {
    const q = `a=${encodeURIComponent(teamAName)}&b=${encodeURIComponent(teamBName)}`;
    const r = await fetch(`/api/highlights?${q}`);
    if (!r.ok) {
      // Likely the serverless function isn't deployed (plain `vite`, file://,
      // or a misconfigured Vercel build → SPA HTML instead of JSON).
      console.warn(`[highlights] /api/highlights HTTP ${r.status} — function not reachable`);
      return null;
    }
    const data = await r.json();
    if (!data.videoId) {
      // reason/detail come from the function: no-key, yt-403 (key restricted/
      // API disabled/quota), no-results, fetch-failed …
      console.warn(`[highlights] no video for "${teamAName} vs ${teamBName}":`, data.reason || 'unknown', data.detail || '');
    }
    return data.videoId || null;
  } catch (err) {
    console.warn('[highlights] lookup failed (non-JSON response or network):', err?.message || err);
    return null;
  }
}
