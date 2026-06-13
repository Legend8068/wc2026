/* ============================================================
   WC2026 — Live score provider
   Polls ESPN's public World Cup scoreboard (no API key) and
   maps events onto our fixture ids.
   ============================================================ */

import D from './data';

const FEED = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=400&dates=20260611-20260721';

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

  const espnState = (ev.status && ev.status.type && ev.status.type.state) || 'pre'; // pre | in | post
  const detail = (ev.status && ev.status.type && (ev.status.type.shortDetail || '')) || '';
  const status = espnState === 'post' ? 'ft'
    : espnState === 'in' ? (/half/i.test(detail) ? 'ht' : 'live')
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
      const athlete = d.athletesInvolved?.[0]?.displayName || '';
      const teamId = d.team?.id || '';
      const isHomeTeam = teamId === home.id;

      if (isGoal || isRed || isYellow) {
        details.push({
          type: isGoal ? 'goal' : isRed ? 'red' : 'yellow',
          typeText,
          clock: clockVal,
          player: athlete,
          isHome: isHomeTeam,
          ownGoal: d.ownGoal || false,
          penalty: d.penaltyKick || false
        });
      }
    });
  }

  const st = {
    status,
    sa: status === 'pre' ? null : parseInt(home.score, 10) || 0,
    sb: status === 'pre' ? null : parseInt(away.score, 10) || 0,
    minute: status === 'live' ? Math.round((ev.status.displayClock || '0').replace("'", '')) || 0 : (status === 'pre' ? 0 : 90),
    details,
    statsHome: getStats(home),
    statsAway: getStats(away)
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
  return { a, b, st, date: ev.date ? Date.parse(ev.date) : null };
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
      // erroneously; first FT result wins
      states[fxId] = p.st;
    } else if (!fxId) {
      states[`${p.a}|${p.b}`] = p.st; // knockout — resolved by pair
    }
    mapped++;
  }
  if (!mapped) throw new Error('no events mapped');
  return states;
}
