import React, { useEffect, useLayoutEffect, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import BrandText from './BrandText';
import './LoadingScreen.css';

/* ============================================================
   WC2026 — Loading Screen ("Kickoff → Goal")
   Mirrors the hero exactly (same FIFA WORLD CUP / 2026 /
   USA · CANADA · MEXICO lockup, same angular BrandText font,
   same dark gradient ground) so the hand-off is seamless.

   A proper muted-green football pitch reveals first as vertical
   mowing stripes, then its white markings draw on (centre circle,
   halfway line, penalty & goal boxes, arcs). It then morphs into
   a front-on GOAL with a sagging net. The ball is struck from
   below into the net at the "0" of 2026 with whiplash, and
   settles as the 0 while the lockup reveals. Built with Framer
   Motion (pathLength draw-on, crossfade morph, springs).
   ============================================================ */

const GOLD = '#f5c542';
const LINE = 'rgba(255,255,255,0.78)';
const NETC = 'rgba(255,255,255,0.62)';
const G_LIGHT = '#33543c';
const G_DARK = '#274132';

/* Stage timeline (ms offsets) — eased & overlapped for smoothness. */
const T = { stripes: 0, marks: 1050, goal: 2150, shoot: 3120, whip: 3520, settle: 4000, out: 5100, end: 6000 };

function LoadingScreen({ onDone }) {
  const overlay = useRef(null);
  const title = useRef(null);
  const ball = useRef(null);
  const shock = useRef(null);
  const [pos, setPos] = useState(null);
  const [geo, setGeo] = useState(null);
  const [stage, setStage] = useState('hidden');
  const finished = useRef(false);

  useLayoutEffect(() => {
    const ht = document.querySelector('.hero .hero-title');
    setPos(ht ? (() => { const r = ht.getBoundingClientRect(); return { left: r.left, top: r.top }; })() : { left: null, top: null });
  }, []);

  useLayoutEffect(() => {
    if (!pos) return;
    const year = title.current?.querySelector('.hero-brand-year');
    const chars = year?.querySelectorAll('.brand-char');
    if (!chars || chars.length < 2) { setGeo({ ok: false }); return; }
    const zr = chars[1].getBoundingClientRect(); // "2026"[1] === "0"
    const d = zr.height * 1.04;
    const cx = zr.left + zr.width / 2;
    const cy = zr.top + zr.height / 2;

    const b = ball.current, s = shock.current;
    if (b) { b.style.width = b.style.height = `${d}px`; b.style.left = `${cx - d / 2}px`; b.style.top = `${cy - d / 2}px`; }
    if (s) { s.style.width = s.style.height = `${d}px`; s.style.left = `${cx - d / 2}px`; s.style.top = `${cy - d / 2}px`; }

    const vw = window.innerWidth, vh = window.innerHeight, scx = vw / 2;

    // ---- PITCH (top-down, proper proportions ≈ 105:68), centred on (scx, cy)
    let pW = Math.min(vw * 0.84, 1180);
    let pH = pW / 1.55;
    pH = Math.min(pH, (cy - 16) / 0.5, (vh - cy - 16) / 0.5, vh * 0.62);
    pW = Math.min(pH * 1.55, vw * 0.84);
    pH = pW / 1.55;
    const pL = scx - pW / 2, pR = scx + pW / 2, pT = cy - pH / 2, pB = cy + pH / 2;

    const NS = 14, sw = pW / NS;
    const stripeRects = Array.from({ length: NS }, (_, i) => ({ x: pL + i * sw, w: sw, fill: i % 2 ? G_LIGHT : G_DARK }));
    const stripeLines = Array.from({ length: NS - 1 }, (_, i) => `M ${pL + (i + 1) * sw} ${pT} L ${pL + (i + 1) * sw} ${pB}`);

    const penD = pW * 0.155, penW = pH * 0.6, gbD = pW * 0.055, gbW = pH * 0.27;
    const rA = pW * 0.087, sxL = pL + pW * 0.105, dxL = (pL + penD) - sxL;
    const hA = dxL < rA ? Math.sqrt(rA * rA - dxL * dxL) : rA * 0.6;
    const ccR = pH * 0.135;

    // ---- GOAL (front-on with gentle depth), centred on (scx); "0" 36% down the mouth
    let Hg = Math.min((cy - 14) / 0.36, (vh - cy - 30) / 0.64, (vw * 0.78) / 2.3, vh * 0.46);
    let Wg = Math.min(Hg * 2.3, vw * 0.78);
    Hg = Wg / 2.3;
    const gL = scx - Wg / 2, gR = scx + Wg / 2, gT = cy - Hg * 0.36, gB = cy + Hg * 0.64;
    const NV = 16, NH = 8;
    const bIn = Wg * 0.05, bUp = Hg * 0.16; // top-net depth (gentle)

    setGeo({
      ok: true, vw, vh, cx, cy, d, scx,
      // pitch
      pL, pR, pT, pB, pW, pH, stripeRects, stripeLines,
      boundary: `M ${pL} ${pT} H ${pR} V ${pB} H ${pL} Z`,
      halfway: `M ${scx} ${pT} L ${scx} ${pB}`,
      ccR, cc: { x: scx, y: cy },
      spots: [{ x: scx, y: cy }, { x: sxL, y: cy }, { x: pR - pW * 0.105, y: cy }],
      leftPen: `M ${pL} ${cy - penW / 2} H ${pL + penD} V ${cy + penW / 2} H ${pL}`,
      rightPen: `M ${pR} ${cy - penW / 2} H ${pR - penD} V ${cy + penW / 2} H ${pR}`,
      leftGoalB: `M ${pL} ${cy - gbW / 2} H ${pL + gbD} V ${cy + gbW / 2} H ${pL}`,
      rightGoalB: `M ${pR} ${cy - gbW / 2} H ${pR - gbD} V ${cy + gbW / 2} H ${pR}`,
      leftArc: `M ${pL + penD} ${cy - hA} A ${rA} ${rA} 0 0 1 ${pL + penD} ${cy + hA}`,
      rightArc: `M ${pR - penD} ${cy - hA} A ${rA} ${rA} 0 0 0 ${pR - penD} ${cy + hA}`,
      // goal
      gL, gR, gT, gB, Wg, Hg, gcx: scx, gcy: cy,
      posts: [`M ${gL} ${gB} L ${gL} ${gT}`, `M ${gR} ${gB} L ${gR} ${gT}`],
      crossbar: `M ${gL} ${gT} L ${gR} ${gT}`,
      goalLine: `M ${gL} ${gB} L ${gR} ${gB}`,
      netV: Array.from({ length: NV - 1 }, (_, i) => { const x = gL + Wg * (i + 1) / NV; return `M ${x} ${gT} L ${x} ${gB}`; }),
      netH: Array.from({ length: NH - 1 }, (_, i) => {
        const f = (i + 1) / NH, y = gT + Hg * f, sag = Hg * 0.05 * (0.4 + 0.6 * f);
        return `M ${gL} ${y} Q ${scx} ${y + sag} ${gR} ${y}`;
      }),
      // gentle top-net depth
      topNet: [
        `M ${gL} ${gT} L ${gL + bIn} ${gT - bUp}`,
        `M ${gR} ${gT} L ${gR - bIn} ${gT - bUp}`,
        `M ${gL + bIn} ${gT - bUp} L ${gR - bIn} ${gT - bUp}`,
        ...Array.from({ length: 5 }, (_, i) => { const x = gL + Wg * (i + 1) / 6; const xb = gL + bIn + (Wg - 2 * bIn) * (i + 1) / 6; return `M ${x} ${gT} L ${xb} ${gT - bUp}`; }),
      ],
      belowOffset: (vh - cy) + d * 2.5,
    });
  }, [pos]);

  useEffect(() => {
    if (!geo) return;
    document.body.style.overflow = 'hidden';
    const finish = () => { if (finished.current) return; finished.current = true; document.body.style.overflow = ''; onDone?.(); };
    const failsafe = setTimeout(finish, 10500);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStatic = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('staticLoader');
    let cancelled = false;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));

    if (!geo.ok || reduced || isStatic) {
      setStage('rest'); at(700, () => setStage('out')); at(1500, finish);
      return () => { cancelled = true; clearTimeout(failsafe); timers.forEach(clearTimeout); document.body.style.overflow = ''; };
    }

    setStage('stripes');
    at(T.marks, () => setStage('marks'));
    at(T.goal, () => setStage('goal'));
    at(T.shoot, () => setStage('shoot'));
    at(T.whip, () => setStage('whip'));
    at(T.settle, () => setStage('settle'));
    at(T.out, () => setStage('out'));
    at(T.end, finish);
    return () => { cancelled = true; clearTimeout(failsafe); timers.forEach(clearTimeout); document.body.style.overflow = ''; };
  }, [geo, onDone]);

  const titleStyle = pos && pos.left != null
    ? { position: 'absolute', left: pos.left, top: pos.top, width: 'max-content', opacity: 0 }
    : { position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', width: 'max-content', alignItems: 'center', opacity: 0 };

  // ---- stage flags ----
  const stripesOn = ['stripes', 'marks'].includes(stage);
  const marksOn = stage === 'marks';
  const inGoal = ['goal', 'shoot', 'whip', 'settle', 'out'].includes(stage);
  const ballShot = ['shoot', 'whip', 'settle', 'out', 'rest'].includes(stage);
  const showTitle = ['settle', 'out', 'rest'].includes(stage);
  const fadeGoal = stage === 'settle' || stage === 'out';
  const fadeOut = stage === 'out';

  const netW = geo ? Math.max(1, geo.d * 0.022) : 1.5;
  const markW = geo ? Math.max(1.4, geo.d * 0.03) : 2;

  // pitch line that draws on when `on` is true
  const pLine = (d, on, stroke, w, delay, key) => (
    <motion.path key={key} d={d} fill="none" stroke={stroke} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
      transition={{ pathLength: { duration: 0.7, delay, ease: 'easeInOut' }, opacity: { duration: 0.3, delay } }} />
  );
  // goal line that draws on when in goal
  const gLine = (d, stroke, w, delay, key) => (
    <motion.path key={key} d={d} fill="none" stroke={stroke} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: inGoal ? 1 : 0, opacity: inGoal ? 1 : 0 }}
      transition={{ pathLength: { duration: 0.6, delay, ease: 'easeInOut' }, opacity: { duration: 0.35, delay } }} />
  );

  return (
    <motion.div
      ref={overlay}
      className="fixed inset-0 z-[200] overflow-hidden"
      aria-hidden="true"
      style={{ background: 'linear-gradient(175deg, var(--bg-light) 0%, var(--bg) 30%, var(--bg-deep) 100%)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.85, ease: 'easeInOut' }}
    >
      <div className="ls-grain" />

      {geo && geo.ok && (
        <svg className="ls-scene" width={geo.vw} height={geo.vh} viewBox={`0 0 ${geo.vw} ${geo.vh}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
          <defs>
            <clipPath id="ls-pitch-clip"><rect x={geo.pL} y={geo.pT} width={geo.pW} height={geo.pH} rx={Math.min(14, geo.d * 0.18)} /></clipPath>
            <radialGradient id="ls-goal-depth" cx="50%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#0a1322" />
              <stop offset="100%" stopColor="#05080f" />
            </radialGradient>
          </defs>

          {/* ---------- PITCH (top-down) ---------- */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 'hidden' ? 0 : inGoal ? 0 : 1, scale: inGoal ? 1.04 : 1 }}
            transition={{ opacity: { duration: inGoal ? 0.6 : 0.5, ease: 'easeInOut' }, scale: { duration: 0.7, ease: 'easeIn' } }}
            style={{ transformOrigin: `${geo.scx}px ${geo.cy}px` }}>
            {/* green mowing stripes */}
            <motion.g clipPath="url(#ls-pitch-clip)"
              initial={{ opacity: 0 }} animate={{ opacity: stripesOn ? 1 : 0 }} transition={{ duration: 0.6 }}>
              {geo.stripeRects.map((s, i) => (
                <rect key={i} x={s.x} y={geo.pT} width={s.w + 0.5} height={geo.pH} fill={s.fill} />
              ))}
            </motion.g>

            {/* vertical stripe lines first */}
            {geo.stripeLines.map((d, i) => pLine(d, stripesOn, LINE, Math.max(1, geo.d * 0.02), 0.15 + i * 0.04, `sl${i}`))}

            {/* remaining markings (draw on at 'marks') */}
            {pLine(geo.boundary, marksOn, LINE, markW, 0, 'bd')}
            {pLine(geo.halfway, marksOn, LINE, markW, 0.1, 'hw')}
            {pLine(geo.leftPen, marksOn, LINE, markW, 0.2, 'lp')}
            {pLine(geo.rightPen, marksOn, LINE, markW, 0.2, 'rp')}
            {pLine(geo.leftGoalB, marksOn, LINE, markW, 0.3, 'lg')}
            {pLine(geo.rightGoalB, marksOn, LINE, markW, 0.3, 'rg')}
            {pLine(geo.leftArc, marksOn, LINE, markW, 0.4, 'la')}
            {pLine(geo.rightArc, marksOn, LINE, markW, 0.4, 'ra')}
            <motion.circle cx={geo.cc.x} cy={geo.cc.y} r={geo.ccR} fill="none" stroke={LINE} strokeWidth={markW}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: marksOn ? 1 : 0, opacity: marksOn ? 1 : 0 }}
              transition={{ pathLength: { duration: 0.7, delay: 0.15, ease: 'easeInOut' }, opacity: { duration: 0.3, delay: 0.15 } }} />
            {geo.spots.map((sp, i) => (
              <motion.circle key={i} cx={sp.x} cy={sp.y} r={Math.max(2, geo.d * 0.05)} fill={LINE}
                initial={{ opacity: 0 }} animate={{ opacity: marksOn ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.3 }} />
            ))}
          </motion.g>

          {/* ---------- GOAL (front-on, gentle depth + sagging net) ---------- */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: inGoal ? (fadeGoal ? 0 : 1) : 0 }}
            transition={{ duration: fadeGoal ? 0.7 : 0.5, ease: 'easeInOut' }}>
            {/* dark interior for depth */}
            <motion.rect x={geo.gL} y={geo.gT} width={geo.Wg} height={geo.gB - geo.gT} fill="url(#ls-goal-depth)"
              initial={{ opacity: 0 }} animate={{ opacity: inGoal ? 0.9 : 0 }} transition={{ duration: 0.5 }} />

            {/* net (whip-flexes on impact) */}
            <motion.g
              animate={{ scale: stage === 'whip' ? [1, 1.025, 0.992, 1] : 1, y: stage === 'whip' ? [0, geo.d * 0.12, 0] : 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{ transformOrigin: `${geo.cx}px ${geo.cy}px` }}>
              {geo.topNet.map((d, i) => gLine(d, NETC, netW * 0.85, 0.2 + i * 0.02, `tn${i}`))}
              {geo.netV.map((d, i) => gLine(d, NETC, netW, 0.1 + i * 0.015, `nv${i}`))}
              {geo.netH.map((d, i) => gLine(d, NETC, netW, 0.18 + i * 0.03, `nh${i}`))}
            </motion.g>

            {/* gold frame: posts + crossbar (thick), goal line (thin) */}
            {gLine(geo.goalLine, GOLD, Math.max(2, geo.d * 0.05), 0, 'gln')}
            {geo.posts.map((d, i) => gLine(d, GOLD, Math.max(3, geo.d * 0.11), 0.05, `po${i}`))}
            {gLine(geo.crossbar, GOLD, Math.max(3, geo.d * 0.11), 0.1, 'cb')}
          </motion.g>
        </svg>
      )}

      <div className="ls-vignette" />

      {/* exact hero lockup (revealed around the ball) */}
      <motion.div ref={title} className="hero-title" style={titleStyle}
        animate={{ opacity: showTitle ? 1 : 0 }}
        transition={{ duration: 1.0, delay: stage === 'settle' ? 0.15 : 0, ease: 'easeInOut' }}>
        <div className="hero-kicker">FIFA WORLD CUP</div>
        <BrandText text="2026" className="hero-brand-year" useBallForZero={true} />
        <BrandText text="USA · CANADA · MEXICO" className="hero-brand-hosts" />
      </motion.div>

      {/* impact shockwave at the "0" */}
      <motion.div ref={shock}
        style={{ position: 'absolute', borderRadius: '50%', border: `3px solid ${GOLD}`, opacity: 0, pointerEvents: 'none' }}
        animate={stage === 'whip' ? { scale: [0.4, 2.6], opacity: [0.6, 0] } : { opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }} />

      {/* the ball — struck from below into the net, then rests as the "0" */}
      <motion.div ref={ball}
        style={{ position: 'absolute', willChange: 'transform', pointerEvents: 'none' }}
        initial={{ y: geo ? geo.belowOffset : 800, opacity: 0, rotate: 220, scale: 1 }}
        animate={
          ballShot ? { y: 0, opacity: 1, rotate: 0, scale: stage === 'whip' ? [1, 1.08, 0.96, 1] : 1 }
          : { y: geo ? geo.belowOffset : 800, opacity: 0, rotate: 220, scale: 1 }
        }
        transition={{
          y: { type: 'spring', stiffness: 540, damping: 15, mass: 0.8 },
          rotate: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.12 },
          scale: { duration: 0.45, ease: 'easeOut' },
        }}>
        <svg viewBox="0 0 100 100" style={{ display: 'block', width: '100%', height: '100%', filter: 'drop-shadow(0 8px 18px rgba(8,18,40,0.55))' }}>
          <defs>
            <clipPath id="wc-ball-clip"><rect x="0" y="0" width="100" height="100" rx="20" ry="20" /></clipPath>
            <radialGradient id="wc-ball-shade" cx="36%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="62%" stopColor="#f5f7fa" />
              <stop offset="100%" stopColor="#dfe5ee" />
            </radialGradient>
          </defs>
          {/* rounded-square body (same shape as the 0) */}
          <g clipPath="url(#wc-ball-clip)">
            <rect x="0" y="0" width="100" height="100" fill="url(#wc-ball-shade)" />
            <ellipse cx="33" cy="28" rx="24" ry="17" fill="#ffffff" opacity="0.5" />

            {/* Seam Lines */}
            <g stroke="#d5d0c5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Central Hexagon */}
              <polygon points="34,14 66,14 80,50 66,86 34,86 20,50" />
              {/* Radiating Seams */}
              <path d="M 34,14 L 15,-2" />
              <path d="M 66,14 L 85,-2" />
              <path d="M 20,50 L -2,40" />
              <path d="M 20,50 L -2,60" />
              <path d="M 80,50 L 102,40" />
              <path d="M 80,50 L 102,60" />
              <path d="M 34,86 L 15,102" />
              <path d="M 66,86 L 85,102" />
            </g>

            {/* Confetti & Branding Patterns */}
            <g strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 1.5px 1.5px rgba(0,0,0,0.15))">
              {/* Top Left */}
              <path d="M30,30 L20,20 M25,15 L15,25" stroke="#a31f47" className="confetti-shoot-tl" />
              <polygon points="25,35 30,40 20,40" fill="#298888" stroke="none" className="confetti-shoot-tl" />
              <circle cx="35" cy="25" r="3" fill="#d1a74d" stroke="none" className="confetti-shoot-tl" style={{animationDelay: '0.2s'}} />

              {/* Top Right */}
              <path d="M70,30 L80,20 M75,15 L85,25" stroke="#298888" className="confetti-shoot-tr" />
              <polygon points="75,35 70,40 80,40" fill="#a31f47" stroke="none" className="confetti-shoot-tr" />
              <circle cx="65" cy="25" r="3" fill="#4a256a" stroke="none" className="confetti-shoot-tr" style={{animationDelay: '0.1s'}} />

              {/* Bottom Left */}
              <path d="M30,70 L20,80 M25,85 L15,75" stroke="#4a256a" className="confetti-shoot-bl" />
              <polygon points="25,65 30,60 20,60" fill="#e06b26" stroke="none" className="confetti-shoot-bl" style={{animationDelay: '0.3s'}} />
              <circle cx="35" cy="75" r="3" fill="#d1a74d" stroke="none" className="confetti-shoot-bl" />

              {/* Bottom Right */}
              <path d="M70,70 L80,80 M75,85 L85,75" stroke="#e06b26" className="confetti-shoot-br" />
              <polygon points="75,65 70,60 80,60" fill="#298888" stroke="none" className="confetti-shoot-br" style={{animationDelay: '0.15s'}} />
              <circle cx="65" cy="75" r="3" fill="#a31f47" stroke="none" className="confetti-shoot-br" />

              {/* Popping center accents */}
              <circle cx="50" cy="15" r="2.5" fill="#d1a74d" stroke="none" className="confetti-pop" />
              <circle cx="50" cy="85" r="2.5" fill="#d1a74d" stroke="none" className="confetti-pop" style={{animationDelay: '0.2s'}} />
              <circle cx="15" cy="50" r="2.5" fill="#4a256a" stroke="none" className="confetti-pop" style={{animationDelay: '0.4s'}} />
              <circle cx="85" cy="50" r="2.5" fill="#298888" stroke="none" className="confetti-pop" style={{animationDelay: '0.1s'}} />
            </g>

            {/* World Cup Trophy */}
            <g transform="translate(50, 48) scale(1.6) translate(-50, -50)" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.3))">
              {/* Base Layers */}
              <path d="M44.5 68 L43 72 H57 L55.5 68 Z" fill="#c29b38" />
              <path d="M45 66 H55 L55.5 68 H44.5 Z" fill="#184a28" />
              <path d="M45.5 62 H54.5 L55 66 H45 Z" fill="#e8c253" />
              <path d="M46 60 H54 L54.5 62 H45.5 Z" fill="#184a28" />
              <path d="M46.5 56 H53.5 L54 60 H46 Z" fill="#e8c253" />

              {/* Left Figure */}
              <path d="M46.5 56 C 44 48, 41 40, 45 31 C 48 29, 49 32, 48 35 C 47 39, 49 46, 50 50 C 49 53, 47 55, 46.5 56 Z" fill="#d9b141" />

              {/* Right Figure */}
              <path d="M53.5 56 C 56 48, 59 40, 55 31 C 52 29, 51 32, 52 35 C 53 39, 51 46, 50 50 C 51 53, 53 55, 53.5 56 Z" fill="#ebd170" />

              {/* Globe */}
              <circle cx="50" cy="28" r="6" fill="#fce588" />
              <path d="M45.5 25 Q 48 22 51 26 T 55 24 M 46 30 Q 50 28 53 32" stroke="#d9b141" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </g>

            <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="none" stroke="#d5d0c5" strokeWidth="2.5" />
          </g>
          {/* subtle gold frame echoing the rounded shape */}
          <rect x="1.5" y="1.5" width="97" height="97" rx="18.5" fill="none" stroke="#f5c542" strokeWidth="1.4" opacity="0.5" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default memo(LoadingScreen);
