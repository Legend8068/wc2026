import React from 'react';

/* Pick the XI / formation to show for the requested half. Live feed line-ups
   only carry one XI (already rebuilt for the current period upstream), so we
   gracefully fall back to it when no second-half XI is present. */
function xiForHalf(team, half) {
  if (half === 2 && team.xi2 && team.xi2.length) {
    return { xi: team.xi2, formation: team.formation2 || team.formation };
  }
  return { xi: team.xi, formation: team.formation };
}

/* Vertical bands (% of pitch height): 0% = away goal line (top),
   100% = home goal line (bottom), 50% = halfway. Each side keeps to its half. */
function bandsFor(side) {
  return side === 'home'
    ? { gk: 93, def: 85, fwd: 56 }   // home defends the bottom, attacks up
    : { gk: 7, def: 15, fwd: 44 };   // away defends the top, attacks down
}

/* Spread n players evenly across a row, mirroring home so the XI reads
   left-to-right consistently for the viewer. */
function spreadRow(group, y, side, plotted) {
  group.forEach((p, i) => {
    let x = ((i + 1) * 100) / (group.length + 1);
    if (side === 'home') x = 100 - x;
    plotted.push({ ...p, x, y, side });
  });
}

/* Exact placement from API-Football "row:col" grid coordinates. Row 1 is the
   keeper; higher rows are more advanced. Returns null if the data isn't grid-shaped. */
function plotByGrid(xi, side) {
  if (!xi.length || !xi.every(p => typeof p.grid === 'string' && /^\d+:\d+$/.test(p.grid))) return null;
  const bands = bandsFor(side);
  const plotted = [];

  const rows = {};
  xi.forEach(p => {
    const [r, c] = p.grid.split(':').map(Number);
    (rows[r] = rows[r] || []).push({ ...p, _c: c });
  });
  const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b);

  // Keeper row = a lone GK on the deepest row; place it on the goal line.
  const gkRow = rowNums[0];
  const outRows = rowNums.filter(r => !(r === gkRow && rows[r].length === 1 && rows[r][0].pos === 'GK'));
  rows[gkRow]
    .filter(p => p.pos === 'GK' || (rows[gkRow].length === 1 && !outRows.includes(gkRow)))
    .forEach(p => plotted.push({ ...p, x: 50, y: bands.gk, side }));

  const minR = outRows[0];
  const maxR = outRows[outRows.length - 1];
  outRows.forEach(r => {
    const group = rows[r].slice().sort((a, b) => a._c - b._c);
    let frac = maxR === minR ? 0 : (r - minR) / (maxR - minR); // 0 = defence … 1 = attack
    if (outRows.length === 4) {
      const idx = outRows.indexOf(r);
      if (idx === 1) frac = 0.33;
      else if (idx === 2) frac = 0.66;
    } else if (outRows.length === 3) {
      const idx = outRows.indexOf(r);
      if (idx === 1) frac = 0.50;
    }
    const y = bands.def + frac * (bands.fwd - bands.def);
    spreadRow(group, y, side, plotted);
  });

  return plotted;
}

/* Fallback: derive rows from the formation string (e.g. "4-3-3"). */
function plotByFormation(xi, formation, side) {
  const plotted = [];
  const gk = xi[0];
  const lines = (formation || '4-3-3').split('-').map(Number).filter(n => n > 0);
  const outfield = xi.slice(1);
  const bands = bandsFor(side);

  plotted.push({ ...gk, x: 50, y: bands.gk, side });

  let idx = 0;
  const nLines = lines.length;
  lines.forEach((count, li) => {
    let t = nLines === 1 ? 0 : li / (nLines - 1);
    if (nLines === 4) {
      if (li === 1) t = 0.33;
      else if (li === 2) t = 0.66;
    } else if (nLines === 3) {
      if (li === 1) t = 0.50;
    }
    const y = bands.def + t * (bands.fwd - bands.def);
    spreadRow(outfield.slice(idx, idx + count), y, side, plotted);
    idx += count;
  });
  if (idx < outfield.length) spreadRow(outfield.slice(idx), bands.fwd, side, plotted);

  return plotted;
}

/* ---------- ESPN position-based placement ----------
   ESPN gives a detailed position abbreviation per player (e.g. "CD-L", "CM-R",
   "DM", "LB") plus a 1–11 formationPlace. We read each abbr into two axes:
     • tier  — vertical band: GK < DEF < DM < MID < AM < FWD
     • lane  — left↔right ordering hint (touchline-hugging wingers/backs outermost)
   Tiers emerge from the data, so any formation reconstructs itself; players are
   then spread EVENLY across each occupied tier, which guarantees no overlap. */
const TIER = { GK: 0, DEF: 1, DM: 2, MID: 3, AM: 4, FWD: 5 };
const TIER_FRAC = { 0: 0.0, 1: 0.20, 2: 0.36, 3: 0.52, 4: 0.76, 5: 1.0 }; // 0 = own goal line, 1 = halfway line

function classifyAbbr(p) {
  let a = String(p.abbr || '').toUpperCase().trim();
  let suffix = '';
  const m = a.match(/-(L|R|C)$/);
  if (m) { suffix = m[1]; a = a.slice(0, m.index); }
  const stem = a.replace(/[^A-Z]/g, '');

  let tier;
  if (/^G/.test(stem)) tier = TIER.GK;
  else if (/^(AM|CAM)/.test(stem)) tier = TIER.AM;
  else if (/^(DM|CDM)/.test(stem)) tier = TIER.DM;
  else if (/(WB|CB|CD|^LB$|^RB$|^D$|^DF$|^DEF$|^LCB$|^RCB$)/.test(stem)) tier = TIER.DEF;
  else if (/(^F$|^FW$|ST|CF|^LW$|^RW$|^W$|^S$|^SS$|LF|RF)/.test(stem)) tier = TIER.FWD;
  else if (/(^M$|MF|CM|^LM$|^RM$|LCM|RCM)/.test(stem)) tier = TIER.MID;
  else tier = ({ GK: 0, DEF: 1, MID: 3, FWD: 5 })[p.pos] ?? TIER.MID;

  // Lane rank governs left→right order only (magnitude is not used for x).
  let lane = suffix === 'L' ? -1 : suffix === 'R' ? 1 : 0;
  if (/^LW/.test(stem)) lane = -3;
  else if (/^RW/.test(stem)) lane = 3;
  else if (/^L/.test(stem)) lane = -2;
  else if (/^R/.test(stem)) lane = 2;

  return { tier, lane };
}

function tierY(frac, side) {
  const b = bandsFor(side);
  return side === 'home' ? b.gk - frac * (b.gk - b.fwd) : b.gk + frac * (b.fwd - b.gk);
}

/* True when ESPN gave us positional detail worth trusting over the formation string. */
function hasDetailedAbbr(xi) {
  return xi.some(p => {
    const a = String(p.abbr || '').toUpperCase();
    return a.includes('-') ||
      /^(DM|AM|CDM|CAM|LB|RB|LM|RM|LW|RW|LWB|RWB|LF|RF|LCB|RCB|LCM|RCM)$/.test(a);
  });
}

/* Per-shape vertical tweaks. For a 4-1-4-1 (back-4, lone holder, midfield-4,
   lone striker) push the midfield band forward and sit the holder exactly
   halfway between the defence (1st row) and that midfield (3rd row). */
function shapeFracOverride(tiers) {
  const c = t => (tiers[t] ? tiers[t].length : 0);
  const def = TIER_FRAC[TIER.DEF], fwd = TIER_FRAC[TIER.FWD];

  // 4-1-4-1: midfield-4 forward, holder centred between defence and that midfield.
  if (c(TIER.DEF) === 4 && c(TIER.DM) === 1 && c(TIER.MID) === 4 && c(TIER.FWD) === 1 && c(TIER.AM) === 0) {
    const mid = 0.70; // 3rd row pushed forward
    return { [TIER.DEF]: def, [TIER.DM]: (def + mid) / 2, [TIER.MID]: mid, [TIER.FWD]: fwd };
  }

  // 3-row formations (DEF / MID / FWD only — e.g. 4-3-3, 3-4-3, 4-4-2, 5-3-2):
  // space the three lines evenly, so the midfield sits halfway up the pitch.
  if (c(TIER.DM) === 0 && c(TIER.AM) === 0 && c(TIER.DEF) > 0 && c(TIER.MID) > 0 && c(TIER.FWD) > 0) {
    return { [TIER.DEF]: def, [TIER.MID]: (def + fwd) / 2, [TIER.FWD]: fwd };
  }

  return null;
}

function plotByPositions(xi, side) {
  const items = xi.map((p, i) => ({ p, i, ...classifyAbbr(p), place: Number(p.place) || 999 }));
  const tiers = {};
  items.forEach(it => (tiers[it.tier] = tiers[it.tier] || []).push(it));
  const fracOverride = shapeFracOverride(tiers);

  const plotted = [];
  Object.keys(tiers).map(Number).sort((a, b) => a - b).forEach(t => {
    const group = tiers[t].sort((a, b) => a.lane - b.lane || a.place - b.place || a.i - b.i);
    const frac = (fracOverride && t in fracOverride) ? fracOverride[t] : (TIER_FRAC[t] ?? 0.5);
    const y = tierY(frac, side);
    const n = group.length;
    const margin = n <= 2 ? 30 : n === 3 ? 18 : n === 4 ? 11 : 9; // wider lines reach closer to the touchlines
    group.forEach((it, idx) => {
      let x = t === TIER.GK ? 50 : (n === 1 ? 50 : margin + (idx * (100 - 2 * margin)) / (n - 1));
      if (side === 'home') x = 100 - x; // mirror so both shapes read naturally for the viewer
      plotted.push({ ...it.p, x, y, side });
    });
  });
  return plotted;
}

/* Placement priority: API-Football grid → ESPN positions → formation string. */
function plotPlayers(xi, formation, side) {
  if (!xi || !xi.length) return [];
  return plotByGrid(xi, side)
    || (hasDetailedAbbr(xi) ? plotByPositions(xi, side) : plotByFormation(xi, formation, side));
}

/* Small event markers rendered on a player. */
function PlayerBadges({ ev }) {
  if (!ev) return null;
  const items = [];
  for (let i = 0; i < (ev.goals || 0); i++) items.push(<span key={`g${i}`} className="vl-b vl-b-goal" title="Goal">⚽</span>);
  for (let i = 0; i < (ev.assists || 0); i++) items.push(<span key={`a${i}`} className="vl-b vl-b-assist" title="Assist">👟</span>);
  if (ev.yellow) items.push(<span key="y" className="vl-b vl-b-yellow" title="Yellow card" />);
  if (ev.red) items.push(<span key="r" className="vl-b vl-b-red" title="Red card" />);
  if (ev.injured) items.push(<span key="inj" className="vl-b vl-b-injury" title="Injury">✚</span>);
  if (!items.length) return null;
  return <div className="vl-badges">{items}</div>;
}

export default function VisualLineup({ home, away, teamA, teamB, flagA, flagB, half = 1 }) {
  // Always display the starting XI on the pitch graphic
  const homeXI = xiForHalf(home, 1);
  const awayXI = xiForHalf(away, 1);

  const homePlotted = plotPlayers(homeXI.xi, homeXI.formation, 'home');
  const awayPlotted = plotPlayers(awayXI.xi, awayXI.formation, 'away');
  const allPlotted = [...awayPlotted, ...homePlotted];

  const renderSubs = (team, flag, teamName) => {
    const hasActivity = (s) => {
      if (!s.ev) return false;
      return !!(s.ev.subOn || s.ev.goals || s.ev.assists || s.ev.yellow || s.ev.red || s.ev.injured);
    };
    const sortedSubs = [...team.subs].sort((a, b) => {
      const actA = hasActivity(a);
      const actB = hasActivity(b);
      if (actA && !actB) return -1;
      if (!actA && actB) return 1;
      return 0;
    });

    return (
      <div className="vl-subs-col">
        <div className="vl-subs-header">
          <img src={flag} alt="" className="vl-subs-flag" />
          <span className="vl-subs-team-name">{teamName}</span>
          <span className="vl-subs-label">SUBS</span>
        </div>
        <ul className="vl-subs-list">
          {sortedSubs.map((s, i) => (
            <li key={i} className={`vl-sub-item ${s.ev?.subOn ? 'used' : ''}`}>
              <span className="vl-sub-num">{s.num}</span>
              <span className="vl-sub-name">{s.name}</span>
              <div className="vl-sub-events">
                {s.ev?.subOn && <span className="vl-sub-on" title={`Came on at ${s.ev.subOn}`}>▲{s.ev.subOn}</span>}
                {s.ev?.goals ? Array.from({ length: s.ev.goals }).map((_, gi) => (
                  <span key={`g-${gi}`} className="vl-sub-badge badge-goal" title="Goal">⚽</span>
                )) : null}
                {s.ev?.assists ? Array.from({ length: s.ev.assists }).map((_, ai) => (
                  <span key={`a-${ai}`} className="vl-sub-badge badge-assist" title="Assist">👟</span>
                )) : null}
                {s.ev?.yellow && <span className="vl-sub-badge badge-yellow" title="Yellow card" />}
                {s.ev?.red && <span className="vl-sub-badge badge-red" title="Red card" />}
                {s.ev?.injured && <span className="vl-sub-badge badge-injury" title="Injury">✚</span>}
              </div>
              <span className="vl-sub-pos pos-SUB">SUB</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="vl-container">
      {/* Visual Pitch */}
      <div className="vl-pitch-wrap">
        <div className="vl-half-flag vl-half-home">
          <img src={flagA} alt="" /><span>{homeXI.formation}</span>
        </div>
        <div className="vl-half-flag vl-half-away">
          <img src={flagB} alt="" /><span>{awayXI.formation}</span>
        </div>

        <div className="vl-pitch">
          <svg className="vl-pitch-svg" viewBox="0 0 100 140" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="140" className="vl-line" />
            <line x1="0" y1="70" x2="100" y2="70" className="vl-line" />
            <circle cx="50" cy="70" r="12" className="vl-line" />
            <circle cx="50" cy="70" r="0.8" className="vl-line-fill" />
            <rect x="20" y="0" width="60" height="22" className="vl-line" />
            <rect x="35" y="0" width="30" height="8" className="vl-line" />
            <path d="M 38 22 A 12 12 0 0 0 62 22" className="vl-line" />
            <rect x="20" y="118" width="60" height="22" className="vl-line" />
            <rect x="35" y="132" width="30" height="8" className="vl-line" />
            <path d="M 38 118 A 12 12 0 0 1 62 118" className="vl-line" />
          </svg>

          {allPlotted.map((p, idx) => (
            <div
              key={`${p.side}-${p.num}-${idx}`}
              className={`vl-player vl-${p.side} ${p.ev?.subOff ? 'vl-subbed-off' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <PlayerBadges ev={p.ev} />
              <div className="vl-player-shirt">
                {p.num}
              </div>
              {/* Sub marker sits between the shirt and the name — i.e. on the
                  opposite end of the circle from the goal/card badges, and never
                  overlapping the name box. */}
              {p.ev?.subOff && (
                <div className="vl-sub-marker" title={`Subbed off at ${p.ev.subOff}`}>
                  ▼<span className="vl-sub-min">{p.ev.subOff.replace("'", "")}</span>
                </div>
              )}
              <div className="vl-player-name">{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Substitutes Lists */}
      <div className="vl-subs-section">
        {renderSubs(away, flagB, teamB.name)}
        {renderSubs(home, flagA, teamA.name)}
      </div>
    </div>
  );
}
