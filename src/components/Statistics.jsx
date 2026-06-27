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
    <svg viewBox="0 0 415.506 415.506" width={p.size || 20} height={p.size || 20} fill="currentColor" {...p}>
      <path d="M383.272,110.52l0.002-0.646l-3.484-0.011l-0.086,27.448c-8.281-6.856-17.703-12.51-26.766-17.017
	c-23.309-11.592-48.772-18.684-74.508-23.022l0.041-13.047c12.619-10.885,23.938,5.021,32.303-10.692
	c-19.652,0.258-15.338-11.771-32.234-10.734l0.002-0.646l-3.484-0.011l-0.109,34.548c-6.285-0.999-12.58-1.838-18.861-2.541
	c-35.063-3.924-70.861-3.619-105.82,1.212c-3.229,0.446-6.465,0.94-9.705,1.463l-0.109-34.682l-3.484,0.011l0.002,0.646
	c-16.897-1.037-12.582,10.993-32.234,10.734c8.363,15.713,19.684-0.193,32.301,10.692l0.043,13.168
	c-29.039,4.941-58.164,13.233-83.584,28.047c-5.867,3.419-11.984,7.537-17.688,12.285l-0.088-27.863l-3.484,0.011l0.002,0.646
	C15.338,109.481,19.654,121.512,0,121.254c8.367,15.712,19.685-0.192,32.303,10.693l0.029,8.801
	c-12.324,11.22-21.863,25.568-21.074,42.402c0.912,19.49,12.287,34.646,26.885,46.248v27.828c-5.445-4.65-9.631-9.446-12.393-13.967
	c-1.525-2.488-2.686-4.849-3.545-6.978c-0.828-2.137-1.412-4.026-1.752-5.592c-0.346-1.563-0.578-2.787-0.672-3.617
	c-0.111-0.833-0.168-1.263-0.168-1.263s-0.033,0.433-0.096,1.271c-0.072,0.841-0.129,2.098-0.059,3.742
	c0.156,3.262,0.719,8.221,3.197,14.016c1.211,2.896,2.832,6.002,4.924,9.176c2.078,3.184,4.682,6.381,7.674,9.584
	c0.918,0.976,1.891,1.945,2.889,2.91v25.319c-5.445-4.65-9.631-9.445-12.393-13.966c-1.525-2.488-2.686-4.849-3.545-6.978
	c-0.828-2.136-1.412-4.026-1.752-5.592c-0.346-1.563-0.578-2.788-0.672-3.617c-0.111-0.833-0.168-1.263-0.168-1.263
	s-0.033,0.433-0.096,1.271c-0.072,0.841-0.129,2.098-0.059,3.742c0.156,3.262,0.719,8.22,3.199,14.016
	c1.211,2.895,2.832,6.001,4.924,9.176c2.078,3.184,4.682,6.38,7.674,9.583c0.918,0.975,1.889,1.943,2.887,2.908l0.74,0.701
	c5.4,5.107,11.889,10.04,19.26,14.613c4.549,2.825,9.438,5.5,14.594,8.053c5.16,2.543,10.615,4.894,16.285,7.137
	c11.363,4.416,23.65,8.211,36.555,11.218c6.445,1.538,13.053,2.835,19.764,3.979c0.332,0.057,0.666,0.107,0.998,0.163l1.918,6.39
	l4.053-1.216l4.051-1.216l-14.377-47.884c44.209-11.229,87.334-11.229,131.541,0l-14.377,47.883l4.053,1.217l4.051,1.217
	l1.918-6.389c0.332-0.056,0.668-0.107,0.998-0.164c6.713-1.144,13.32-2.442,19.766-3.979c12.902-3.007,25.191-6.802,36.555-11.218
	c5.668-2.243,11.125-4.594,16.285-7.137c5.154-2.553,10.045-5.228,14.592-8.053c7.371-4.573,13.859-9.506,19.262-14.613l0.74-0.701
	c0.998-0.964,1.969-1.933,2.885-2.908c6.031-6.369,10.244-12.928,12.615-18.751c2.439-5.813,3.068-10.751,3.188-14.023
	c0.063-1.648,0.012-2.912-0.063-3.743c-0.063-0.838-0.096-1.271-0.096-1.271s-0.059,0.43-0.17,1.263
	c-0.096,0.84-0.322,2.057-0.676,3.616c-0.348,1.564-0.939,3.451-1.758,5.59c-0.846,2.132-2.012,4.492-3.551,6.972
	c-1.555,2.471-3.467,5.074-5.824,7.667c-1.926,2.099-4.109,4.223-6.551,6.309v-25.321c0.998-0.965,1.971-1.934,2.887-2.91
	c6.029-6.369,10.244-12.929,12.613-18.752c2.439-5.813,3.068-10.751,3.188-14.023c0.063-1.648,0.012-2.913-0.063-3.743
	c-0.063-0.838-0.096-1.271-0.096-1.271s-0.059,0.43-0.17,1.263c-0.096,0.84-0.322,2.057-0.676,3.616
	c-0.348,1.565-0.939,3.451-1.756,5.59c-0.846,2.132-2.012,4.492-3.551,6.972c-1.557,2.471-3.467,5.074-5.824,7.667
	c-1.926,2.1-4.111,4.224-6.553,6.31V229.77c14.756-11.677,26.125-26.96,27.268-46.711c-0.061-17.35-9.113-31.51-21.455-42.729
	l0.025-8.384c12.619-10.885,23.938,5.019,32.303-10.693C395.852,121.512,400.168,109.481,383.272,110.52z M280.027,114.548
	c16.605,3.143,32.943,7.585,48.641,13.701c14,5.455,31.211,13.355,43.342,24.885l-66.66,41.398
	c-13.203-10.172-34.381-18.08-59.785-22.076L280.027,114.548z M229.93,108.653c13.213,0.727,26.494,2.042,39.658,4.104
	l-34.686,58.282c-8.693-0.95-17.787-1.458-27.148-1.458c-9.363,0-18.455,0.507-27.15,1.458l-34.693-58.297
	C173.648,108.351,201.9,107.111,229.93,108.653z M55.637,143.732c23.703-15.661,52.072-24.007,79.842-29.186l34.463,57.909
	c-25.404,3.997-46.582,11.904-59.785,22.076l-66.695-41.421C47.25,149.625,51.412,146.522,55.637,143.732z M85.145,316.543
	c-7.936-2.711-15.35-5.71-22.109-8.982c-4.535-2.154-8.732-4.49-12.617-6.872c-0.814-0.498-1.605-1.004-2.389-1.513v-24.268
	c3.15,2.375,6.525,4.688,10.111,6.914c4.549,2.825,9.439,5.5,14.594,8.053c3.973,1.958,8.123,3.801,12.41,5.569V316.543z
	 M85.145,281.943c-7.936-2.711-15.352-5.711-22.111-8.983c-4.535-2.154-8.73-4.49-12.615-6.872
	c-0.816-0.497-1.605-1.004-2.389-1.513v-28.113c3.461,2.231,7,4.297,10.545,6.205c8.537,4.595,17.439,8.505,26.57,11.873V281.943z
	 M76.422,232.545c-13.803-6.317-27.742-14.164-37.881-25.706c-4.895-5.57-11.996-16.036-10.539-24.222
	c0.709-3.98,1.832-10.702,4.355-15.745c1.236-2.247,2.668-4.369,4.242-6.385l66.076,41.036c-4.676,5.438-7.244,11.331-7.244,17.49
	c0,9.679,6.328,18.706,17.252,26.33C100.236,242.043,88.055,237.868,76.422,232.545z M128.746,327.655
	c-11.809-2.156-23.133-4.828-33.715-7.97v-20.436c9.649,3.467,19.881,6.496,30.543,8.981c3.219,0.768,6.479,1.476,9.771,2.135
	l5.803,19.328C136.967,329.063,132.828,328.379,128.746,327.655z M320.477,319.685c-10.582,3.143-21.906,5.814-33.717,7.97
	c-4.08,0.724-8.221,1.408-12.402,2.039l5.803-19.328c3.293-0.659,6.553-1.367,9.772-2.135c10.664-2.485,20.896-5.515,30.545-8.981
	V319.685z M320.477,285.085c-10.582,3.142-21.906,5.814-33.715,7.97c-3.631,0.644-7.309,1.256-11.021,1.828
	c-45.701-11.633-90.273-11.633-135.975,0c-3.711-0.572-7.389-1.184-11.02-1.828c-11.811-2.155-23.133-4.828-33.715-7.97v-27.131
	c20.076,6.438,41.053,10.423,61.723,12.957c34.283,4.202,69.221,4.148,103.496-0.104c20.242-2.512,40.645-6.456,60.227-12.713
	V285.085z M367.478,299.177c-0.783,0.509-1.574,1.015-2.391,1.513c-3.885,2.382-8.08,4.717-12.615,6.872
	c-6.76,3.271-14.176,6.27-22.109,8.982v-21.099c4.285-1.769,8.438-3.611,12.41-5.569c5.154-2.552,10.045-5.228,14.592-8.053
	c3.588-2.226,6.963-4.54,10.113-6.914V299.177z M367.478,264.575c-0.783,0.509-1.574,1.016-2.389,1.513
	c-3.885,2.382-8.08,4.717-12.615,6.872c-6.76,3.272-14.176,6.272-22.111,8.983V254.69c8.365-3.068,16.555-6.584,24.469-10.653
	c4.268-2.193,8.52-4.607,12.646-7.247V264.575z M387.141,182.557c-0.145,15.047-13.639,29.256-26.842,38.099
	c-17.16,11.493-36.879,19.13-57.113,24.43c10.701-7.569,16.889-16.503,16.889-26.074c0-6.158-2.566-12.052-7.242-17.49
	l65.863-40.903C383.428,166.971,386.568,174.235,387.141,182.557z"/>
    </svg>
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

    if (['ft', 'live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status)) {
      teamAgg[a].played++;
      teamAgg[b].played++;
      teamAgg[a].goals += st.sa || 0;
      teamAgg[b].goals += st.sb || 0;
      teamAgg[a].conceded += st.sb || 0;
      teamAgg[b].conceded += st.sa || 0;

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

    if (['ft', 'live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status)) {
      teamAgg[fxA].played++;
      teamAgg[fxB].played++;
      teamAgg[fxA].goals += st.sa || 0;
      teamAgg[fxB].goals += st.sb || 0;
      teamAgg[fxA].conceded += st.sb || 0;
      teamAgg[fxB].conceded += st.sa || 0;

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

  const totalGoals = teamList.reduce((s, t) => s + t.goals, 0);
  const totalMatches = [...Object.values(states)].filter(s => s && ['ft', 'live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(s.status)).length;

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
              {e.yellows > 0 && <div className="cw-card-shape cw-yellow" />}
              {e.reds > 0 && <div className="cw-card-shape cw-red" />}
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
    <div className="tr-card" style={{ '--tr-color': color }}>
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
const Statistics = React.memo(function Statistics({ snapshot }) {
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
                ? <div className="scroll-list">
                    {stats.penaltyKings.map((e, i) => (
                      <CompactRow
                        key={`${e.player}|${e.team}`}
                        entry={e} rank={i + 1}
                        statKey="penalties" accent={A.purple}
                      />
                    ))}
                  </div>
                : <div className="sp-empty">No penalty goals yet</div>}
            </div>
            <div className="compact-panel">
              <div className="compact-panel-head">
                <Ic.ownGoal size={16} />
                <span>OWN GOALS</span>
              </div>
              {stats.ownGoalsList.length > 0
                ? <div className="scroll-list">
                    {stats.ownGoalsList.map((e, i) => (
                      <CompactRow
                        key={`${e.player}|${e.team}`}
                        entry={e} rank={i + 1}
                        statKey="ownGoals" accent={A.red}
                      />
                    ))}
                  </div>
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
});

export default Statistics;
