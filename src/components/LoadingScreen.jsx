import React, { useEffect, useLayoutEffect, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import BrandText from './BrandText';
import './LoadingScreen.css';

/* ============================================================
   WC2026 — Loading Screen ("Top bins")
   Mirrors the hero exactly (same FIFA WORLD CUP / 2026 /
   USA · CANADA · MEXICO lockup, same angular BrandText font,
   same dark gradient ground) so the hand-off is seamless.

   A bold flat-graphic top-down pitch (gold frame, white grid,
   starfield cells) draws in centred & large, then its grid
   gains one-point-perspective depth and becomes a GOAL with a
   net. The ball is struck from below, snaps into the net at the
   "0" of 2026 with whiplash, and settles as the 0 while the
   lockup reveals. Built with Framer Motion (pathLength draw-on,
   crossfade morph, springs).
   ============================================================ */

const GOLD = '#f5c542';
const NET = 'rgba(255,255,255,0.8)';
const NET_DIM = 'rgba(255,255,255,0.4)';

/* Stage timeline (ms offsets from start). */
const T = { draw: 0, goal: 1280, shoot: 2160, whip: 2520, settle: 3000, out: 4150, end: 5050 };

/* Starfield (fractions of the pitch rect) — generated once at module load. */
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  fx: Math.random(),
  fy: Math.random(),
  s: 0.8 + Math.random() * 1.6,
  min: 0.1 + Math.random() * 0.12,
  max: 0.45 + Math.random() * 0.4,
}));

function LoadingScreen({ onDone }) {
  const overlay = useRef(null);
  const title = useRef(null);
  const ball = useRef(null);
  const shock = useRef(null);
  const [pos, setPos] = useState(null);
  const [geo, setGeo] = useState(null);
  const [stage, setStage] = useState('hidden');
  const finished = useRef(false);

  // Measure the real hero title so our clone sits exactly on top of it.
  useLayoutEffect(() => {
    const ht = document.querySelector('.hero .hero-title');
    setPos(ht ? (() => { const r = ht.getBoundingClientRect(); return { left: r.left, top: r.top }; })() : { left: null, top: null });
  }, []);

  // Once the clone is positioned, measure its "0" glyph and derive the goal.
  useLayoutEffect(() => {
    if (!pos) return;
    const year = title.current?.querySelector('.hero-brand-year');
    const chars = year?.querySelectorAll('.brand-char');
    if (!chars || chars.length < 2) { setGeo({ ok: false }); return; }
    const zr = chars[1].getBoundingClientRect(); // "2026"[1] === "0"
    const d = zr.height * 1.04;
    const cx = zr.left + zr.width / 2;
    const cy = zr.top + zr.height / 2;

    // size & place the ball + shockwave onto the "0" slot
    const b = ball.current, s = shock.current;
    if (b) { b.style.width = b.style.height = `${d}px`; b.style.left = `${cx - d / 2}px`; b.style.top = `${cy - d / 2}px`; }
    if (s) { s.style.width = s.style.height = `${d}px`; s.style.left = `${cx - d / 2}px`; s.style.top = `${cy - d / 2}px`; }

    const vw = window.innerWidth, vh = window.innerHeight;
    const scx = vw / 2;

    // Big goal mouth, centred horizontally; the "0" sits on the back-net plane,
    // 34% down inside the mouth, so the back plane is centred on the 0's height.
    let pitchW = Math.min(vw * 0.86, 1250);
    let pitchH = pitchW / 1.78;
    pitchH = Math.min(pitchH, (cy - 18) / 0.34, (vh - cy - 18) / 0.78, vh * 0.7);
    pitchW = Math.min(pitchH * 1.78, vw * 0.86);
    pitchH = pitchW / 1.78;

    const left = scx - pitchW / 2, right = scx + pitchW / 2;
    const top = cy - pitchH * 0.34, bot = top + pitchH;

    const vFr = [1, 2, 3, 4, 5, 6, 7].map((i) => i / 8);
    const hFr = [1, 2, 3].map((i) => i / 4);
    const arcR = pitchH * 0.2;

    // one-point-perspective back-net plane (recedes up & in, centred on the 0)
    const bS = 0.6;
    const bW = pitchW * bS, bH = pitchH * bS;
    const iL = scx - bW / 2, iR = scx + bW / 2, iT = cy - bH / 2, iB = cy + bH / 2;
    const vx = (f) => left + pitchW * f, ivx = (f) => iL + bW * f;
    const hy = (f) => top + pitchH * f, ihy = (f) => iT + bH * f;

    setGeo({
      ok: true, vw, vh, cx, cy, d, scx,
      left, right, top, bot, pitchW, pitchH, bcx: scx, bcy: cy,
      boundary: `M ${left} ${top} H ${right} V ${bot} H ${left} Z`,
      verticals: vFr.map((f) => `M ${vx(f)} ${top} L ${vx(f)} ${bot}`),
      horizontals: hFr.map((f) => `M ${left} ${hy(f)} L ${right} ${hy(f)}`),
      leftArc: `M ${left} ${cy - arcR} A ${arcR} ${arcR} 0 0 1 ${left} ${cy + arcR}`,
      rightArc: `M ${right} ${cy - arcR} A ${arcR} ${arcR} 0 0 0 ${right} ${cy + arcR}`,
      // perspective goal
      backRect: `M ${iL} ${iT} H ${iR} V ${iB} H ${iL} Z`,
      connectors: [
        `M ${left} ${top} L ${iL} ${iT}`, `M ${right} ${top} L ${iR} ${iT}`,
        `M ${left} ${bot} L ${iL} ${iB}`, `M ${right} ${bot} L ${iR} ${iB}`,
      ],
      backV: vFr.map((f) => `M ${ivx(f)} ${iT} L ${ivx(f)} ${iB}`),
      backH: hFr.map((f) => `M ${iL} ${ihy(f)} L ${iR} ${ihy(f)}`),
      panels: [
        ...vFr.map((f) => `M ${vx(f)} ${top} L ${ivx(f)} ${iT}`),
        ...vFr.map((f) => `M ${vx(f)} ${bot} L ${ivx(f)} ${iB}`),
        ...hFr.map((f) => `M ${left} ${hy(f)} L ${iL} ${ihy(f)}`),
        ...hFr.map((f) => `M ${right} ${hy(f)} L ${iR} ${ihy(f)}`),
      ],
      belowOffset: (vh - cy) + d * 2.5,
    });
  }, [pos]);

  // Drive the stage timeline once geometry is ready.
  useEffect(() => {
    if (!geo) return;
    document.body.style.overflow = 'hidden';

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      document.body.style.overflow = '';
      onDone?.();
    };
    const failsafe = setTimeout(finish, 9500);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStatic = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('staticLoader');

    let cancelled = false;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));

    if (!geo.ok || reduced || isStatic) {
      setStage('rest');
      at(700, () => setStage('out'));
      at(1500, finish);
      return () => { cancelled = true; clearTimeout(failsafe); timers.forEach(clearTimeout); document.body.style.overflow = ''; };
    }

    setStage('draw');
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
  const isGoal = ['goal', 'shoot', 'whip', 'settle', 'out'].includes(stage);
  const showStars = stage === 'draw';
  const ballShot = ['shoot', 'whip', 'settle', 'out', 'rest'].includes(stage);
  const showTitle = ['settle', 'out', 'rest'].includes(stage);
  const fadeGoal = stage === 'settle' || stage === 'out';
  const fadeOut = stage === 'out';

  const frameW = geo ? (isGoal ? geo.d * 0.13 : geo.d * 0.045) : 3;
  const netW = geo ? Math.max(1.3, geo.d * 0.028) : 2;

  // a line that draws on (staggered) during 'draw'
  const drawLine = (d, stroke, w, delay, key) => (
    <motion.path key={key} d={d} fill="none" stroke={stroke} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={stage === 'hidden' ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration: 0.8, delay, ease: 'easeInOut' }, opacity: { duration: 0.3, delay } }} />
  );
  // a static line (used for the perspective net that fades in on the morph)
  const netLine = (d, stroke, w, key) => (
    <path key={key} d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
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

      {/* the pitch → goal */}
      {geo && geo.ok && (
        <motion.svg width={geo.vw} height={geo.vh} viewBox={`0 0 ${geo.vw} ${geo.vh}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          animate={{ opacity: stage === 'hidden' ? 0 : fadeGoal ? 0 : 1 }}
          transition={{ duration: fadeGoal ? 0.7 : 0.4, ease: 'easeInOut' }}>
          <defs>
            <clipPath id="ls-pitch-clip"><rect x={geo.left} y={geo.top} width={geo.pitchW} height={geo.pitchH} /></clipPath>
          </defs>

          {/* dark cells + starfield (interior darkness stays as the goal's depth) */}
          <g clipPath="url(#ls-pitch-clip)">
            <rect x={geo.left} y={geo.top} width={geo.pitchW} height={geo.pitchH} fill="#080f1c" />
            {STARS.map((st) => (
              <motion.circle key={st.id} r={st.s} fill="#fff"
                cx={geo.left + geo.pitchW * st.fx} cy={geo.top + geo.pitchH * st.fy}
                initial={{ opacity: 0 }}
                animate={{ opacity: showStars ? [st.min, st.max, st.min] : 0 }}
                transition={showStars ? { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: st.id * 0.03 } : { duration: 0.5 }} />
            ))}
          </g>

          {/* flat pitch grid (white) — fades out as the net gains depth */}
          <motion.g animate={{ opacity: isGoal ? 0 : 1 }} transition={{ duration: 0.5 }}>
            {geo.verticals.map((d, i) => drawLine(d, NET, netW, 0.2 + i * 0.05, `v${i}`))}
            {geo.horizontals.map((d, i) => drawLine(d, NET, netW, 0.45 + i * 0.08, `h${i}`))}
          </motion.g>

          {/* penalty arcs (gold) — fade out as it becomes a goal */}
          <motion.g animate={{ opacity: isGoal ? 0 : 1 }} transition={{ duration: 0.4 }}>
            {drawLine(geo.leftArc, GOLD, Math.max(2, geo.d * 0.05), 0.6, 'la')}
            {drawLine(geo.rightArc, GOLD, Math.max(2, geo.d * 0.05), 0.6, 'ra')}
          </motion.g>

          {/* perspective net (the goal depth) — fades in on the morph, whiplash on impact */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: isGoal ? 1 : 0, scale: stage === 'whip' ? [1, 1.035, 0.99, 1] : 1 }}
            transition={{ opacity: { duration: 0.55, delay: isGoal ? 0.15 : 0 }, scale: { duration: 0.5, ease: 'easeOut' } }}
            style={{ transformOrigin: `${geo.bcx}px ${geo.bcy}px` }}>
            {geo.panels.map((d, i) => netLine(d, NET_DIM, netW * 0.85, `p${i}`))}
            {geo.backV.map((d, i) => netLine(d, NET, netW, `bv${i}`))}
            {geo.backH.map((d, i) => netLine(d, NET, netW, `bh${i}`))}
            {netLine(geo.backRect, GOLD, Math.max(2, geo.d * 0.04), 'br')}
            {geo.connectors.map((d, i) => netLine(d, GOLD, Math.max(2, geo.d * 0.05), `c${i}`))}
          </motion.g>

          {/* frame → goal posts + crossbar (gold; thickens on the morph) */}
          <motion.path d={geo.boundary} fill="none" stroke={GOLD}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0, strokeWidth: geo.d * 0.045 }}
            animate={{ pathLength: 1, opacity: 1, strokeWidth: frameW }}
            transition={{ pathLength: { duration: 0.9, ease: 'easeInOut' }, opacity: { duration: 0.3 }, strokeWidth: { duration: 0.7, ease: 'easeOut' } }} />
        </motion.svg>
      )}

      <div className="ls-vignette" />

      {/* exact hero lockup, white angular BrandText (revealed around the ball) */}
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
