import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import D from '../data';
import BrandText from './BrandText';
import RevealSection from './RevealSection';

/* ── Custom SVG Icon System ── */
const SI = ({ children, size = 20, ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const Ic = {
  ball: (p) => (
    <SI {...p}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 7.5l3.2 2.3-1.2 3.9H10l-1.2-3.9z"/>
      <path d="M12 7.5V2.5M15.2 9.8l4.5-1.8M14 13.7l1.8 4.8M10 13.7l-1.8 4.8M8.8 9.8l-4.5-1.8"/>
    </SI>
  ),
  boot: (p) => (
    <SI {...p}>
      <path d="m15 10.42 4.8-5.07"/>
      <path d="M19 18h3"/>
      <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14"/>
    </SI>
  ),
  stadium: (p) => (
    <SI {...p}>
      <path d="M3 21h18M5 21V10M19 21V10M5 10a7 7 0 0 1 14 0M9 21v-5M15 21v-5M5 15h14"/>
    </SI>
  ),
  trendUp: (p) => (
    <SI {...p}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </SI>
  ),
  shield: (p) => (
    <SI {...p}>
      <path d="M12 22s-8-4.5-8-11.8V4l8-2 8 2v6.2c0 7.3-8 11.8-8 11.8z"/>
    </SI>
  ),
  trophy: (p) => (
    <SI {...p}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/>
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>
    </SI>
  ),
  target: (p) => (
    <SI {...p}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </SI>
  ),
  crosshair: (p) => (
    <SI {...p}>
      <circle cx="12" cy="12" r="8"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    </SI>
  ),
  glove: (p) => (
    <SI {...p}>
      <path d="M6 19v-4a3 3 0 0 1 3-3v-5a1.5 1.5 0 0 1 3 0v-1a1.5 1.5 0 0 1 3 0v1a1.5 1.5 0 0 1 3 0v8a4 4 0 0 1-4 4H6z"/>
      <path d="M12 7v6"/>
      <path d="M15 7v6"/>
      <path d="M9 12v5"/>
      <rect x="5" y="19" width="14" height="3" rx="1"/>
    </SI>
  ),
  flag: (p) => (
    <SI {...p}>
      <line x1="5" y1="22" x2="5" y2="2"/>
      <path d="M5 3c3-1 5 1 8 0s5-2 8 0v10c-3-1-5 1-8 0s-5-2-8 0"/>
    </SI>
  ),
  whistle: (p) => (
    <SI {...p}>
      <path d="M15 11 H20 a1 1 0 0 1 1 1 v1 a1 1 0 0 1-1 1 H16 A5 5 0 1 1 15 11 Z" />
      <circle cx="11" cy="14" r="2" />
      <path d="M16 11 v2 h-2" />
      <path d="M8 10 a2 2 0 1 0 -3 -3" />
    </SI>
  ),
  ownGoal: (p) => (
    <SI {...p}>
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.5 15a9 9 0 1 0 2.5-9.5"/>
    </SI>
  ),
  goalNet: (p) => (
    <SI {...p}>
      <rect x="2" y="4" width="20" height="14" rx="1"/>
      <path d="M2 4l10 7 10-7M2 18l10-7M22 18l-10-7"/>
      <line x1="2" y1="18" x2="2" y2="22"/><line x1="22" y1="18" x2="22" y2="22"/>
    </SI>
  ),
  barChart: (p) => (
    <SI {...p}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </SI>
  ),
  cornerFlag: (p) => (
    <SI {...p}>
      <path d="M4 22c0-11 8-10 8-20"/>
      <path d="M12 2c3 0 6 2 9 1v7c-3 1-6-1-9-1"/>
    </SI>
  ),
  crown: (p) => (
    <SI {...p}>
      <path d="M2 17l3-10 5 6 2-11 2 11 5-6 3 10z"/>
      <path d="M2 17h20v3H2z"/>
    </SI>
  ),
  swords: (p) => (
    <SI {...p}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/>
      <path d="M13 19l6-6M16 16l4 4M9.5 17.5L21 6V3h-3L6.5 14.5"/>
      <path d="M11 19l-6-6M8 16l-4 4"/>
    </SI>
  ),
};

/* ── Card shape component ── */
function CardShape({ type, size = 'sm' }) {
  const cls = `card-shape card-shape--${type} card-shape--${size}`;
  return <span className={cls} />;
}

/* ── Animated Number (counts up on scroll) ── */
function AnimatedNumber({ value, decimals = 0, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const target = typeof value === 'number' ? value : parseFloat(value) || 0;
          const duration = 1200;
          const start = performance.now();
          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplay(eased * target);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display);

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

/* ── Radial Ring SVG ── */
function RadialRing({ value, max, size = 80, strokeWidth = 7, color = '#f5c542', label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="radial-ring" ref={ref}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={visible ? offset : circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="radial-ring-progress"
        />
      </svg>
      <div className="radial-ring-val">
        {label ?? (typeof value === 'number' ? value : '')}
      </div>
    </div>
  );
}

/* ── Helper: aggregate tournament-wide statistics from snapshot ── */
function computeTournamentStats(snapshot) {
  if (!snapshot) return null;
  const { states, standings } = snapshot;

  // ── Player tallies ──
  const playerGoals = {};
  const playerCards = {};
  const playerOwnGoals = {};

  // ── Team aggregations ──
  const teamAgg = {};
  const initTeam = (code) => {
    if (!teamAgg[code]) {
      teamAgg[code] = {
        code,
        goals: 0,
        conceded: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        played: 0,
        possession: [],
        shots: 0,
        shotsOnTarget: 0,
        fouls: 0,
        corners: 0,
        cleanSheets: 0,
        yellows: 0,
        reds: 0
      };
    }
  };

  // Process group stage fixtures
  for (const fx of D.GROUP_FIXTURES) {
    const st = states[fx.id];
    if (!st || (st.status !== 'ft' && st.status !== 'live' && st.status !== 'ht')) continue;

    const a = fx.a, b = fx.b;
    initTeam(a);
    initTeam(b);

    if (st.status === 'ft') {
      teamAgg[a].played++;
      teamAgg[b].played++;
      teamAgg[a].goals += st.sa;
      teamAgg[b].goals += st.sb;
      teamAgg[a].conceded += st.sb;
      teamAgg[b].conceded += st.sa;

      if (st.sa > st.sb) { teamAgg[a].wins++; teamAgg[b].losses++; }
      else if (st.sa < st.sb) { teamAgg[b].wins++; teamAgg[a].losses++; }
      else { teamAgg[a].draws++; teamAgg[b].draws++; }

      if (st.sb === 0) teamAgg[a].cleanSheets++;
      if (st.sa === 0) teamAgg[b].cleanSheets++;
    }

    if (st.statsHome) {
      teamAgg[a].possession.push(parseFloat(st.statsHome.possessionPct) || 0);
      teamAgg[a].shots += parseInt(st.statsHome.totalShots) || 0;
      teamAgg[a].shotsOnTarget += parseInt(st.statsHome.shotsOnTarget) || 0;
      teamAgg[a].fouls += parseInt(st.statsHome.foulsCommitted) || 0;
      teamAgg[a].corners += parseInt(st.statsHome.wonCorners) || 0;
    }
    if (st.statsAway) {
      teamAgg[b].possession.push(parseFloat(st.statsAway.possessionPct) || 0);
      teamAgg[b].shots += parseInt(st.statsAway.totalShots) || 0;
      teamAgg[b].shotsOnTarget += parseInt(st.statsAway.shotsOnTarget) || 0;
      teamAgg[b].fouls += parseInt(st.statsAway.foulsCommitted) || 0;
      teamAgg[b].corners += parseInt(st.statsAway.wonCorners) || 0;
    }

    if (st.details) {
      for (const ev of st.details) {
        if (ev.type === 'goal') {
          if (ev.ownGoal) {
            const playerTeam = ev.isHome ? b : a;
            const key = `${ev.player}|${playerTeam}`;
            if (!playerOwnGoals[key]) playerOwnGoals[key] = { player: ev.player, team: playerTeam, ownGoals: 0 };
            playerOwnGoals[key].ownGoals++;
          } else {
            const playerTeam = ev.isHome ? a : b;
            const key = `${ev.player}|${playerTeam}`;
            if (!playerGoals[key]) playerGoals[key] = { player: ev.player, team: playerTeam, goals: 0, penalties: 0 };
            playerGoals[key].goals++;
            if (ev.penalty) playerGoals[key].penalties++;
          }
        }
        if (ev.type === 'yellow' || ev.type === 'red') {
          const playerTeam = ev.isHome ? a : b;
          const key = `${ev.player}|${playerTeam}`;
          if (!playerCards[key]) playerCards[key] = { player: ev.player, team: playerTeam, yellows: 0, reds: 0 };
          if (ev.type === 'yellow') {
            playerCards[key].yellows++;
            teamAgg[playerTeam].yellows++;
          }
          if (ev.type === 'red') {
            playerCards[key].reds++;
            teamAgg[playerTeam].reds++;
          }
        }
      }
    }
  }

  // Also process knockout matches
  for (const m of D.KO) {
    const st = states[m.id];
    if (!st || (st.status !== 'ft' && st.status !== 'live' && st.status !== 'ht')) continue;

    const fxA = findKOTeam(m.id, 0, snapshot);
    const fxB = findKOTeam(m.id, 1, snapshot);
    if (!fxA || !fxB) continue;

    initTeam(fxA);
    initTeam(fxB);

    if (st.status === 'ft') {
      teamAgg[fxA].played++;
      teamAgg[fxB].played++;
      teamAgg[fxA].goals += st.sa;
      teamAgg[fxB].goals += st.sb;
      teamAgg[fxA].conceded += st.sb;
      teamAgg[fxB].conceded += st.sa;

      const winner = st.winner;
      if (winner === fxA) { teamAgg[fxA].wins++; teamAgg[fxB].losses++; }
      else if (winner === fxB) { teamAgg[fxB].wins++; teamAgg[fxA].losses++; }
      else { teamAgg[fxA].draws++; teamAgg[fxB].draws++; }

      if (st.sb === 0) teamAgg[fxA].cleanSheets++;
      if (st.sa === 0) teamAgg[fxB].cleanSheets++;
    }

    if (st.statsHome) {
      teamAgg[fxA].possession.push(parseFloat(st.statsHome.possessionPct) || 0);
      teamAgg[fxA].shots += parseInt(st.statsHome.totalShots) || 0;
      teamAgg[fxA].shotsOnTarget += parseInt(st.statsHome.shotsOnTarget) || 0;
      teamAgg[fxA].fouls += parseInt(st.statsHome.foulsCommitted) || 0;
      teamAgg[fxA].corners += parseInt(st.statsHome.wonCorners) || 0;
    }
    if (st.statsAway) {
      teamAgg[fxB].possession.push(parseFloat(st.statsAway.possessionPct) || 0);
      teamAgg[fxB].shots += parseInt(st.statsAway.totalShots) || 0;
      teamAgg[fxB].shotsOnTarget += parseInt(st.statsAway.shotsOnTarget) || 0;
      teamAgg[fxB].fouls += parseInt(st.statsAway.foulsCommitted) || 0;
      teamAgg[fxB].corners += parseInt(st.statsAway.wonCorners) || 0;
    }

    if (st.details) {
      for (const ev of st.details) {
        if (ev.type === 'goal') {
          if (ev.ownGoal) {
            const playerTeam = ev.isHome ? fxB : fxA;
            const key = `${ev.player}|${playerTeam}`;
            if (!playerOwnGoals[key]) playerOwnGoals[key] = { player: ev.player, team: playerTeam, ownGoals: 0 };
            playerOwnGoals[key].ownGoals++;
          } else {
            const playerTeam = ev.isHome ? fxA : fxB;
            const key = `${ev.player}|${playerTeam}`;
            if (!playerGoals[key]) playerGoals[key] = { player: ev.player, team: playerTeam, goals: 0, penalties: 0 };
            playerGoals[key].goals++;
            if (ev.penalty) playerGoals[key].penalties++;
          }
        }
        if (ev.type === 'yellow' || ev.type === 'red') {
          const playerTeam = ev.isHome ? fxA : fxB;
          const key = `${ev.player}|${playerTeam}`;
          if (!playerCards[key]) playerCards[key] = { player: ev.player, team: playerTeam, yellows: 0, reds: 0 };
          if (ev.type === 'yellow') {
            playerCards[key].yellows++;
            teamAgg[playerTeam].yellows++;
          }
          if (ev.type === 'red') {
            playerCards[key].reds++;
            teamAgg[playerTeam].reds++;
          }
        }
      }
    }
  }

  // Compute avg possession and accuracy for each team
  const teamList = Object.values(teamAgg).filter(t => t.played > 0);
  teamList.forEach(t => {
    t.avgPossession = t.possession.length > 0
      ? Math.round((t.possession.reduce((a, b) => a + b, 0) / t.possession.length) * 10) / 10
      : 0;
    t.goalDiff = t.goals - t.conceded;
    t.shotAccuracy = t.shots > 0 ? Math.round((t.shotsOnTarget / t.shots) * 100) : 0;
  });

  // Sort player stats
  const topScorers = Object.values(playerGoals).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player)).slice(0, 10);
  const penaltyKings = Object.values(playerGoals).filter(p => p.penalties > 0).sort((a, b) => b.penalties - a.penalties || a.player.localeCompare(b.player)).slice(0, 10);
  const topCards = Object.values(playerCards).sort((a, b) => b.reds - a.reds || b.yellows - a.yellows || a.player.localeCompare(b.player)).slice(0, 10);
  const ownGoalsList = Object.values(playerOwnGoals).sort((a, b) => b.ownGoals - a.ownGoals || a.player.localeCompare(b.player)).slice(0, 10);

  // Sort team stats
  const teamsByGoals = [...teamList].sort((a, b) => b.goals - a.goals).slice(0, 8);
  const teamsByDefense = [...teamList].sort((a, b) => a.conceded - b.conceded || b.cleanSheets - a.cleanSheets).slice(0, 8);
  const teamsByPossession = [...teamList].sort((a, b) => b.avgPossession - a.avgPossession).slice(0, 8);
  const teamsByWins = [...teamList].sort((a, b) => b.wins - a.wins || b.goalDiff - a.goalDiff).slice(0, 8);
  const teamsByShots = [...teamList].sort((a, b) => b.shotsOnTarget - a.shotsOnTarget || b.shots - a.shots).slice(0, 8);
  const teamsByDiscipline = [...teamList].sort((a, b) => (b.reds * 5 + b.yellows) - (a.reds * 5 + a.yellows) || b.fouls - a.fouls).slice(0, 8);
  const teamsByCleanSheets = [...teamList].sort((a, b) => b.cleanSheets - a.cleanSheets || a.conceded - b.conceded).slice(0, 8);
  const teamsByCorners = [...teamList].sort((a, b) => b.corners - a.corners).slice(0, 8);

  // Attack vs Defense for dual bars
  const teamsDualBar = [...teamList]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 8)
    .map(t => ({ ...t }));

  const totalGoals = teamList.reduce((s, t) => s + t.goals, 0) / 2;
  const totalMatches = [...Object.values(states)].filter(s => s && s.status === 'ft').length;

  return {
    topScorers, penaltyKings, topCards, ownGoalsList,
    teamsByGoals, teamsByDefense, teamsByPossession, teamsByWins,
    teamsByShots, teamsByDiscipline, teamsByCleanSheets, teamsByCorners,
    teamsDualBar,
    totalGoals, totalMatches, hasData: totalMatches > 0
  };
}

function findKOTeam(matchId, idx, snapshot) {
  const teams = snapshot.teams;
  if (!teams || !teams[matchId]) return null;
  return teams[matchId][idx];
}

/* ═══════════════════════════════════════════════
   VISUAL COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── Overview Cell (with animated number) ── */
function OverviewCell({ icon, value, label, accent, decimals = 0, suffix = '' }) {
  return (
    <div className="ov-cell">
      <div className="ov-icon" style={{ color: accent }}>{icon}</div>
      <div className="ov-val">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="ov-lbl">{label}</div>
    </div>
  );
}

/* ── Podium Display (Top 3 Scorers) ── */
function PodiumDisplay({ scorers }) {
  if (scorers.length < 1) return null;

  const podiumOrder = [];
  if (scorers[1]) podiumOrder.push({ ...scorers[1], pos: 2 });
  podiumOrder.push({ ...scorers[0], pos: 1 });
  if (scorers[2]) podiumOrder.push({ ...scorers[2], pos: 3 });

  return (
    <div className="podium-section">
      <div className="podium-header">
        <Ic.boot size={20} />
        <span>GOLDEN BOOT RACE</span>
      </div>
      <div className="podium">
        {podiumOrder.map((s) => {
          const team = D.TEAMS[s.team];
          const heights = { 1: 120, 2: 80, 3: 56 };
          return (
            <div className={`podium-slot podium-slot--${s.pos}`} key={`${s.player}|${s.team}`}>
              <div className="podium-avatar">
                <img src={D.flag(s.team)} alt="" className="podium-flag" />
                {s.pos === 1 && (
                  <div className="podium-crown">
                    <Ic.crown size={22} />
                  </div>
                )}
              </div>
              <div className="podium-name">{s.player}</div>
              <div className="podium-team">{team?.name}</div>
              <div className="podium-pedestal" style={{ height: heights[s.pos] }}>
                <div className="podium-goals">{s.goals}</div>
                <div className="podium-pos">{s.pos === 1 ? '1ST' : s.pos === 2 ? '2ND' : '3RD'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Compact Ranked Row (for positions 4–10) ── */
function CompactRow({ entry, rank, statKey, accent }) {
  const team = D.TEAMS[entry.team];
  return (
    <div className="cmp-row">
      <img src={D.flag(entry.team)} alt="" className="cmp-flag" />
      <span className="cmp-name">{entry.player}</span>
      <span className="cmp-team">{team?.name}</span>
      <span className="cmp-val" style={{ color: accent }}>{entry[statKey]}</span>
    </div>
  );
}

/* ── Discipline Card Wall ── */
function CardWall({ cards }) {
  if (cards.length === 0) return <div className="sp-empty">No cards issued yet</div>;
  const rotations = [-4, 2, -1, 3, -3, 1, -2, 4, 0, -1];
  return (
    <div className="card-wall">
      {cards.slice(0, 8).map((e, i) => {
        const team = D.TEAMS[e.team];
        const rot = rotations[i % rotations.length];
        const hasRed = e.reds > 0;
        return (
          <div
            className={`cw-card ${hasRed ? 'cw-card--red' : 'cw-card--yellow'}`}
            key={`${e.player}|${e.team}`}
            style={{ '--cw-rot': `${rot}deg`, '--cw-delay': `${i * 0.06}s` }}
          >
            <div className="cw-card-visual">
              <div className={`cw-card-shape ${hasRed ? 'cw-red' : 'cw-yellow'}`}>
                {hasRed && <span className="cw-card-x">✕</span>}
              </div>
            </div>
            <img src={D.flag(e.team)} alt="" className="cw-flag" />
            <div className="cw-info">
              <span className="cw-name">{e.player}</span>
              <span className="cw-team">{team?.name}</span>
            </div>
            <div className="cw-counts">
              {e.yellows > 0 && (
                <span className="cw-count cw-count--y">
                  <CardShape type="yellow" size="xs" /> {e.yellows}
                </span>
              )}
              {e.reds > 0 && (
                <span className="cw-count cw-count--r">
                  <CardShape type="red" size="xs" /> {e.reds}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Dual Bar (Attack vs Defense) ── */
function DualBarChart({ teams }) {
  if (teams.length === 0) return null;
  const maxGoals = Math.max(...teams.map(t => Math.max(t.goals, t.conceded)), 1);

  return (
    <div className="dual-bar-section">
      <div className="dual-bar-header">
        <span className="dual-bar-label dual-bar-label--atk">⚽ GOALS SCORED</span>
        <span className="dual-bar-label dual-bar-label--def">GOALS CONCEDED 🛡</span>
      </div>
      {teams.map((t) => {
        const team = D.TEAMS[t.code];
        const atkPct = (t.goals / maxGoals) * 100;
        const defPct = (t.conceded / maxGoals) * 100;
        return (
          <div className="dual-bar-row" key={t.code}>
            <div className="dual-bar-left">
              <div className="dual-bar-fill dual-bar-fill--atk" style={{ width: `${atkPct}%` }}>
                <span className="dual-bar-num">{t.goals}</span>
              </div>
            </div>
            <div className="dual-bar-center">
              <img src={D.flag(t.code)} alt="" className="dual-bar-flag" />
              <span className="dual-bar-name">{team?.name}</span>
            </div>
            <div className="dual-bar-right">
              <div className="dual-bar-fill dual-bar-fill--def" style={{ width: `${defPct}%` }}>
                <span className="dual-bar-num">{t.conceded}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Team Radial Card ── */
function TeamRadialCard({ entry, statKey, max, color, label, sublabel }) {
  const team = D.TEAMS[entry.code];
  const val = entry[statKey];
  const displayVal = statKey === 'avgPossession' ? `${val}%` : val;

  return (
    <div className="tr-card">
      <RadialRing value={val} max={max} size={72} strokeWidth={6} color={color} label={displayVal} />
      <div className="tr-info">
        <div className="tr-who">
          <img src={D.flag(entry.code)} alt="" className="tr-flag" />
          <span className="tr-name">{team?.name}</span>
        </div>
        {sublabel && <span className="tr-sub">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ── Team Category Panel ── */
function TeamCategoryPanel({ title, icon, data, statKey, maxVal, color, sublabelFn }) {
  return (
    <div className="tc-panel">
      <div className="tc-head">
        <span className="tc-icon" style={{ color }}>{icon}</span>
        <span className="tc-title">{title}</span>
      </div>
      <div className="tc-grid">
        {data.map((entry, i) => (
          <TeamRadialCard
            key={entry.code}
            entry={entry}
            statKey={statKey}
            max={maxVal}
            color={color}
            sublabel={sublabelFn ? sublabelFn(entry) : null}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Accent palette ── */
const A = {
  gold: '#f5c542',
  blue: '#4fc3f7',
  green: '#66bb6a',
  purple: '#ab47bc',
  teal: '#26a69a',
  orange: '#ff7043',
  yellow: '#ffab00',
  red: '#ef5350',
};

/* ── Team category definitions ── */
const TEAM_CATEGORIES = [
  { id: 'attack', label: 'Attack', icon: <Ic.ball size={16} /> },
  { id: 'dualbar', label: 'Attack vs Defense', icon: <Ic.swords size={16} /> },
  { id: 'possession', label: 'Possession', icon: <Ic.target size={16} /> },
  { id: 'results', label: 'Results', icon: <Ic.trophy size={16} /> },
  { id: 'accuracy', label: 'Accuracy', icon: <Ic.crosshair size={16} /> },
  { id: 'defense', label: 'Defense', icon: <Ic.shield size={16} /> },
  { id: 'cleansheets', label: 'Clean Sheets', icon: <Ic.glove size={16} /> },
  { id: 'corners', label: 'Corners', icon: <Ic.cornerFlag size={16} /> },
  { id: 'discipline', label: 'Discipline', icon: <Ic.whistle size={16} /> },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Statistics({ snapshot }) {
  const [tab, setTab] = useState('players');
  const [teamCat, setTeamCat] = useState('attack');
  const stats = useMemo(() => computeTournamentStats(snapshot), [snapshot]);
  const catScrollRef = useRef(null);

  if (!stats || !stats.hasData) {
    return (
      <RevealSection id="statistics">
        <div className="big-head">
          <BrandText text="STATISTICS" className="section-brand-header" />
          <div className="rule" />
        </div>
        <div className="st-empty">
          <Ic.barChart size={48} strokeWidth={1.5} style={{ opacity: 0.4 }} />
          <p className="st-empty-msg">
            Statistics will appear here once matches are played.
            <br /><span>Switch to demo mode to simulate the tournament!</span>
          </p>
        </div>
      </RevealSection>
    );
  }

  const gb = stats.topScorers[0];
  const goalsPerMatch = stats.totalMatches > 0
    ? (stats.totalGoals / stats.totalMatches)
    : 0;

  /* Render team category content */
  const renderTeamCategory = () => {
    switch (teamCat) {
      case 'attack':
        return (
          <TeamCategoryPanel
            title="GOALS SCORED" icon={<Ic.ball size={18} />}
            data={stats.teamsByGoals} statKey="goals"
            maxVal={stats.teamsByGoals[0]?.goals || 1} color={A.gold}
            sublabelFn={(e) => `${e.played} MP · ${(e.goals / Math.max(1, e.played)).toFixed(1)}/gm`}
          />
        );
      case 'dualbar':
        return <DualBarChart teams={stats.teamsDualBar} />;
      case 'possession':
        return (
          <TeamCategoryPanel
            title="AVG POSSESSION" icon={<Ic.target size={18} />}
            data={stats.teamsByPossession} statKey="avgPossession"
            maxVal={100} color={A.green}
            sublabelFn={(e) => `${e.shots} shots · ${e.shotsOnTarget} on target`}
          />
        );
      case 'results':
        return (
          <TeamCategoryPanel
            title="WINS" icon={<Ic.trophy size={18} />}
            data={stats.teamsByWins} statKey="wins"
            maxVal={stats.teamsByWins[0]?.wins || 1} color={A.gold}
            sublabelFn={(e) => `${e.wins}W ${e.draws}D ${e.losses}L`}
          />
        );
      case 'accuracy':
        return (
          <TeamCategoryPanel
            title="SHOTS ON TARGET" icon={<Ic.crosshair size={18} />}
            data={stats.teamsByShots} statKey="shotsOnTarget"
            maxVal={stats.teamsByShots[0]?.shotsOnTarget || 1} color={A.purple}
            sublabelFn={(e) => `${e.shots} total · ${e.shotAccuracy}% accuracy`}
          />
        );
      case 'defense':
        return (
          <TeamCategoryPanel
            title="GOALS CONCEDED (FEWER = BETTER)" icon={<Ic.shield size={18} />}
            data={stats.teamsByDefense} statKey="conceded"
            maxVal={stats.teamsByDefense[stats.teamsByDefense.length - 1]?.conceded || 1} color={A.blue}
            sublabelFn={(e) => `${e.cleanSheets} clean sheet${e.cleanSheets !== 1 ? 's' : ''}`}
          />
        );
      case 'cleansheets':
        return (
          <TeamCategoryPanel
            title="CLEAN SHEETS" icon={<Ic.glove size={18} />}
            data={stats.teamsByCleanSheets} statKey="cleanSheets"
            maxVal={stats.teamsByCleanSheets[0]?.cleanSheets || 1} color={A.teal}
            sublabelFn={(e) => `${e.conceded} conceded`}
          />
        );
      case 'corners':
        return (
          <TeamCategoryPanel
            title="CORNERS WON" icon={<Ic.cornerFlag size={18} />}
            data={stats.teamsByCorners} statKey="corners"
            maxVal={stats.teamsByCorners[0]?.corners || 1} color={A.green}
            sublabelFn={(e) => `${(e.corners / Math.max(1, e.played)).toFixed(1)} per game`}
          />
        );
      case 'discipline':
        return (
          <TeamCategoryPanel
            title="FOULS COMMITTED" icon={<Ic.whistle size={18} />}
            data={stats.teamsByDiscipline} statKey="fouls"
            maxVal={stats.teamsByDiscipline[0]?.fouls || 1} color={A.orange}
            sublabelFn={(e) => `${e.yellows}Y · ${e.reds}R`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <RevealSection id="statistics">
      <div className="rule-head">
        <div className="rule l"></div>
        <div style={{ textAlign: 'center' }}>
          <BrandText text="STATISTICS" className="section-brand-header" />
          <div className="section-brand-sub">TOURNAMENT INSIGHTS</div>
        </div>
        <div className="rule r"></div>
      </div>

      {/* ── Overview Strip (Animated Numbers) ── */}
      <div className="ov-strip">
        <OverviewCell
          icon={<Ic.ball size={22} />}
          value={Math.round(stats.totalGoals)}
          label="Total Goals"
          accent={A.gold}
        />
        <div className="ov-div" />
        <OverviewCell
          icon={<Ic.stadium size={22} />}
          value={stats.totalMatches}
          label="Matches Played"
          accent={A.blue}
        />
        <div className="ov-div" />
        <OverviewCell
          icon={<Ic.trendUp size={22} />}
          value={goalsPerMatch}
          decimals={1}
          label="Goals / Match"
          accent={A.green}
        />
        {gb && (
          <>
            <div className="ov-div" />
            <OverviewCell
              icon={<Ic.boot size={22} />}
              value={gb.goals}
              label={`${gb.player}`}
              accent={A.gold}
            />
          </>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div className="st-tabs">
        <button className={`st-tab ${tab === 'players' ? 'st-tab--on' : ''}`} onClick={() => setTab('players')}>
          <Ic.ball size={15} /> Players
        </button>
        <button className={`st-tab ${tab === 'teams' ? 'st-tab--on' : ''}`} onClick={() => setTab('teams')}>
          <Ic.trophy size={15} /> Teams
        </button>
      </div>

      {/* ── Players Tab ── */}
      {tab === 'players' && (
        <div className="st-players-layout" key="p">
          {/* Podium Hero */}
          <PodiumDisplay scorers={stats.topScorers} />

          {/* Remaining scorers 4–10 */}
          {stats.topScorers.length > 3 && (
            <div className="compact-panel">
              <div className="compact-panel-head">
                <Ic.ball size={16} />
                <span>MORE SCORERS</span>
              </div>
              {stats.topScorers.slice(3).map((e, i) => (
                <CompactRow
                  key={`${e.player}|${e.team}`}
                  entry={e} rank={i + 4}
                  statKey="goals" accent={A.gold}
                />
              ))}
            </div>
          )}

          {/* Discipline Card Wall */}
          <div className="compact-panel compact-panel--wide">
            <div className="compact-panel-head">
              <Ic.shield size={16} />
              <span>DISCIPLINE</span>
            </div>
            <CardWall cards={stats.topCards} />
          </div>

          {/* Penalty Kings + Own Goals side by side */}
          <div className="st-side-panels">
            <div className="compact-panel">
              <div className="compact-panel-head">
                <Ic.goalNet size={16} />
                <span>PENALTY KINGS</span>
              </div>
              {stats.penaltyKings.length > 0
                ? stats.penaltyKings.map((e, i) => (
                    <CompactRow
                      key={`${e.player}|${e.team}`}
                      entry={e} rank={i + 1}
                      statKey="penalties" accent={A.purple}
                    />
                  ))
                : <div className="sp-empty">No penalty goals yet</div>}
            </div>
            <div className="compact-panel">
              <div className="compact-panel-head">
                <Ic.ownGoal size={16} />
                <span>OWN GOALS</span>
              </div>
              {stats.ownGoalsList.length > 0
                ? stats.ownGoalsList.map((e, i) => (
                    <CompactRow
                      key={`${e.player}|${e.team}`}
                      entry={e} rank={i + 1}
                      statKey="ownGoals" accent={A.red}
                    />
                  ))
                : <div className="sp-empty">No own goals yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Teams Tab ── */}
      {tab === 'teams' && (
        <div className="st-teams-layout" key="t">
          {/* Category Carousel */}
          <div className="cat-carousel" ref={catScrollRef}>
            {TEAM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill ${teamCat === cat.id ? 'cat-pill--on' : ''}`}
                onClick={() => setTeamCat(cat.id)}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Category Content */}
          <div className="tc-content" key={teamCat}>
            {renderTeamCategory()}
          </div>
        </div>
      )}
    </RevealSection>
  );
}
