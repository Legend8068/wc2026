/* ============================================================
   WC2026 — Tournament engine
   Pure logic: deterministic match simulation, live-state
   merging, standings computation and bracket resolution.
   Produces a "snapshot" the UI renders from.
   ============================================================ */
window.WC = window.WC || {};

WC.engine = (() => {
  const D = WC.data;

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

  /* ---------- match scripts (simulation) ----------
     A "script" is the full pre-computed story of a match:
     goal minutes per side and, for knockouts, a shootout
     winner if level after 90'. Seeded by match id + teams,
     so it is identical on every reload. */
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

  /* ---------- match phase from a clock ----------
     0–45' play · 15' break · 46–90' play · short FT buffer */
  function phase(now, kickoff) {
    if (now < kickoff) return { status: 'pre' };
    const el = (now - kickoff) / 60000;
    if (el <= 45) return { status: 'live', minute: Math.max(1, Math.ceil(el)) };
    if (el <= 62) return { status: 'ht', minute: 45 };
    if (el <= 107) return { status: 'live', minute: Math.min(90, Math.ceil(el - 17)) };
    return { status: 'ft', minute: 90 };
  }

  /* Simulated state of one match at virtual time `now`. */
  function simulate(matchId, a, b, kickoff, knockout, now) {
    const ph = phase(now, kickoff);
    if (ph.status === 'pre') return { status: 'pre', sa: null, sb: null, minute: 0 };
    const sc = getScript(matchId, a, b, knockout);
    const m = ph.minute;
    const sa = sc.ga.filter(g => g <= m).length;
    const sb = sc.gb.filter(g => g <= m).length;
    const out = { status: ph.status, sa, sb, minute: m };
    if (ph.status === 'ft' && knockout) {
      if (sc.pens) { out.pensA = sc.pens[0]; out.pensB = sc.pens[1]; }
      out.winner = sc.pens ? (sc.pens[0] > sc.pens[1] ? a : b) : (sa > sb ? a : b);
    }
    return out;
  }

  /* ---------- standings ---------- */
  function computeStandings(states) {
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

  const groupComplete = (g, states) =>
    D.GROUP_FIXTURES.filter(f => f.group === g).every(f => states[f.id] && states[f.id].status === 'ft');

  function bestThirds(standings) {
    return Object.values(standings).map(rows => rows[2])
      .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
      .slice(0, 8).map(r => r.code);
  }

  /* ---------- bracket resolution ----------
     Walks M73→M104 in order, resolving each slot's source to a
     team code (or null while unknown). `provider` returns the
     state of a match given (match, codeA, codeB). */
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

  /* ---------- snapshot ----------
     mode 'sim'  → everything simulated at virtual time `now`
     mode 'live' → `liveStates` (from the API) wins; anything the
     feed doesn't cover stays 'pre'. */
  function snapshot(now, mode, liveStates) {
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

  return { snapshot, phase };
})();
