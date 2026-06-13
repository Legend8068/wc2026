/* ============================================================
   WC2026 — Live score provider
   Polls ESPN's public World Cup scoreboard (no API key) and
   maps events onto our fixture ids. If the feed is missing or
   unreachable, main.js falls back to a real-clock simulation.
   ============================================================ */
window.WC = window.WC || {};

WC.live = (() => {
  const D = WC.data;
  const FEED = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=400&dates=20260611-20260721';

  /* name normalisation: lowercase, strip accents & punctuation */
  const norm = (s) => s.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

  const NAME_TO_CODE = {};
  for (const [code, t] of Object.entries(D.TEAMS)) NAME_TO_CODE[norm(t.name)] = code;
  Object.assign(NAME_TO_CODE, {
    'usa': 'USA', 'united states of america': 'USA',
    'korea republic': 'KOR', 'south korea': 'KOR',
    'czech republic': 'CZE',
    'turkey': 'TUR', 'turkiye': 'TUR',
    'bosnia and herzegovina': 'BIH', 'bosnia herzegovina': 'BIH',
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
    const a = NAME_TO_CODE[norm(home.team.displayName || home.team.name || '')];
    const b = NAME_TO_CODE[norm(away.team.displayName || away.team.name || '')];
    if (!a || !b) return null;

    const espnState = (ev.status && ev.status.type && ev.status.type.state) || 'pre'; // pre | in | post
    const detail = (ev.status && ev.status.type && (ev.status.type.shortDetail || '')) || '';
    const status = espnState === 'post' ? 'ft'
      : espnState === 'in' ? (/half/i.test(detail) ? 'ht' : 'live')
      : 'pre';

    const st = {
      status,
      sa: status === 'pre' ? null : parseInt(home.score, 10) || 0,
      sb: status === 'pre' ? null : parseInt(away.score, 10) || 0,
      minute: status === 'live' ? Math.round((ev.status.displayClock || '0').replace("'", '')) || 0 : (status === 'pre' ? 0 : 90)
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
  async function fetchStates() {
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

  return { fetchStates };
})();
