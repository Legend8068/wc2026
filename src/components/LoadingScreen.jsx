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
   penalty & goal boxes, arcs). It then morphs IN PLACE — same
   rectangle — into a front-on GOAL: the stripe lines stay as the
   net's verticals, the gold frame thickens into posts + crossbar,
   the green fades to a dark interior, and the net's sagging
   horizontals + top depth draw in. The ball is struck from below
   into the net at the "0" of 2026 with whiplash, and settles as
   the 0 while the lockup reveals. Built with Framer Motion
   (pathLength draw-on, in-place morph, springs).
   ============================================================ */

const GOLD = '#f5c542';
const NET = 'rgba(255,255,255,0.72)';
const G_LIGHT = '#2c4a36';
const G_DARK = '#213a2c';

/* Stage timeline (ms offsets) — eased & overlapped for smoothness. */
const T = { stripes: 0, marks: 1000, goal: 2050, shoot: 2950, whip: 3330, settle: 3800, out: 4900, end: 5800 };

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

    // The pitch + its markings cover the WHOLE page (centred on the screen), so
    // it reads as one full-bleed field instead of a small framed box sitting
    // inside the green. Markings reference the pitch centre (pcy); the goal and
    // ball still resolve to the "0" (cy).
    const pcy = vh / 2;
    const W = vw, H = vh;
    const L = 0, R = vw, Tp = 0, B = vh;

    // ---- GOAL (front-on net) centred on the screen but WIDE enough to contain
    // the ball's landing "0" (cx, cy); vertically centred on cy so the ball
    // strikes the middle of the net. Proper goal proportions + a sagging mesh.
    // ---- GOAL: one-point-perspective net that funnels back toward the point
    // where the ball strikes (the "0"). A big gold front mouth + a smaller back
    // frame at the vanishing point, so you look INTO the goal and the net
    // drapes away with depth (the ribs run front→back, the rings cross them).
    const fitW = 2 * Math.min(cx, vw - cx) * 0.94;
    const fitH = 2 * Math.min(cy, vh - cy) * 0.82;
    const gW = Math.min(vw * 0.7, fitW, fitH * 2.3);
    const gHh = gW / 2.3;
    const fL = cx - gW / 2, fR = cx + gW / 2, fT = cy - gHh / 2, fB = cy + gHh / 2;
    const vpx = cx, vpy = cy;             // vanishing point = ball impact; the net funnels to it
    const kS = 0.4;                       // back-frame size relative to the mouth
    const kL = vpx + (fL - vpx) * kS, kR = vpx + (fR - vpx) * kS;
    const kT = vpy + (fT - vpy) * kS, kB = vpy + (fB - vpy) * kS;
    const qx = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

    const floor_0 = `M ${L} ${B} L ${L} ${Tp} L ${R} ${Tp} L ${R} ${B} Z`;
    const floor_1 = `M ${fL} ${fB} L ${fL} ${fT} L ${fR} ${fT} L ${fR} ${fB} Z`;
    const frame_0 = `M ${L} ${B} L ${L} ${Tp} L ${R} ${Tp} L ${R} ${B}`;
    const frame_1 = `M ${fL} ${fB} L ${fL} ${fT} L ${fR} ${fT} L ${fR} ${fB}`;
    const backFrame = `M ${kL} ${kB} L ${kL} ${kT} L ${kR} ${kT} L ${kR} ${kB} Z`;
    const connectors = [
      `M ${fL} ${fT} L ${kL} ${kT}`, `M ${fR} ${fT} L ${kR} ${kT}`,
      `M ${fL} ${fB} L ${kL} ${kB}`, `M ${fR} ${fB} L ${kR} ${kB}`,
    ];

    const NS = 18, sw = W / NS;
    const stripeStart = -12;
    const stripeEnd = NS + 12;
    const stripe_Tp = -vh;
    const stripe_B = vh * 2;
    const stripeRects = [];
    for (let i = stripeStart; i < stripeEnd; i++) {
      const x0 = L + i * sw;
      const x1 = L + (i + 1) * sw;
      const d0 = `M ${x0} ${stripe_B} L ${x0} ${stripe_Tp} L ${x1} ${stripe_Tp} L ${x1} ${stripe_B} Z`;
      const f0 = i / NS, f1 = (i + 1) / NS;
      const b0 = fL + f0 * gW, b1 = fL + f1 * gW;
      const d1 = `M ${b0} ${fB} L ${b0} ${fT} L ${b1} ${fT} L ${b1} ${fB} Z`;
      const fill = ((i % 2) + 2) % 2 === 1 ? G_LIGHT : G_DARK;
      stripeRects.push({ d0, d1, fill });
    }

    // ribs: pitch verticals -> net ropes that drape front-bottom → back-top
    const verts = Array.from({ length: NS - 1 }, (_, i) => {
      const f = (i + 1) / NS;
      const x0 = L + f * W;
      const d0 = `M ${x0} ${Tp} Q ${x0} ${pcy} ${x0} ${B}`;
      const fx = fL + f * gW, kx = kL + f * (kR - kL);
      const d1 = `M ${fx} ${fB} Q ${kx} ${kB} ${kx} ${kT}`;
      return { d0, d1 };
    });

    // rings: pitch horizontals -> rows crossing the ribs at increasing depth
    const NH = 11;
    const horizs = Array.from({ length: NH - 1 }, (_, i) => {
      const t = (i + 1) / NH;
      const y0 = B - t * H;
      const d0 = `M ${L} ${y0} Q ${scx} ${y0} ${R} ${y0}`;
      const ly = qx(fB, kB, kT, t), my = qx(fB, kB, kT, t);
      const lx = qx(fL, kL, kL, t), rx = qx(fR, kR, kR, t), mx = qx(scx, vpx, vpx, t);
      const d1 = `M ${lx} ${ly} Q ${mx} ${my} ${rx} ${ly}`;
      return { d0, d1 };
    });

    // top-net ribs: the net draping back over the crossbar (goal-only)
    const topRibs = Array.from({ length: NS - 1 }, (_, i) => {
      const f = (i + 1) / NS;
      const fx = fL + f * gW, kx = kL + f * (kR - kL);
      return `M ${fx} ${fT} L ${kx} ${kT}`;
    });

    // Tie markings strictly to W and H so they never float detached
    const penD = W * 0.16, penW = H * 0.6, gbD = W * 0.058, gbW = H * 0.27;
    const rA = W * 0.09, sxL = L + W * 0.11, dxL = (L + penD) - sxL;
    const hA = dxL < rA ? Math.sqrt(rA * rA - dxL * dxL) : rA * 0.6;
    const ccR = H * 0.135;

    setGeo({
      ok: true, vw, vh, cx, cy, d, scx, L, R, Tp, B, W, H,
      floor_0, floor_1, frame_0, frame_1, stripeRects, verts, horizs,
      backFrame, connectors, topRibs,
      ccR, cc: { x: scx, y: pcy },
      spots: [{ x: scx, y: pcy }, { x: sxL, y: pcy }, { x: R - W * 0.11, y: pcy }],
      leftPen: `M ${L} ${pcy - penW / 2} H ${L + penD} V ${pcy + penW / 2} H ${L}`,
      rightPen: `M ${R} ${pcy - penW / 2} H ${R - penD} V ${pcy + penW / 2} H ${R}`,
      leftGoalB: `M ${L} ${pcy - gbW / 2} H ${L + gbD} V ${pcy + gbW / 2} H ${L}`,
      rightGoalB: `M ${R} ${pcy - gbW / 2} H ${R - gbD} V ${pcy + gbW / 2} H ${R}`,
      leftArc: `M ${L + penD} ${pcy - hA} A ${rA} ${rA} 0 0 1 ${L + penD} ${pcy + hA}`,
      rightArc: `M ${R - penD} ${pcy - hA} A ${rA} ${rA} 0 0 0 ${R - penD} ${pcy + hA}`,
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

  // Absolute safety net: on mount, guarantee the loader hands off within a
  // fixed window no matter what (measurement failure, animation stall, a tab
  // that was backgrounded, etc.) — it can never trap the user on a blank screen.
  useEffect(() => {
    const t = setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      document.body.style.overflow = '';
      onDone?.();
    }, 9000);
    return () => clearTimeout(t);
  }, [onDone]);

  const titleStyle = pos && pos.left != null
    ? { position: 'absolute', left: pos.left, top: pos.top, width: 'max-content', opacity: 0 }
    : { position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', width: 'max-content', alignItems: 'center', opacity: 0 };

  // ---- stage flags ----
  const vertsOn = stage !== 'hidden';
  const greenOn = ['stripes', 'marks'].includes(stage);
  const marksOn = stage === 'marks';
  const inGoal = ['goal', 'shoot', 'whip', 'settle', 'out'].includes(stage);
  const ballShot = ['shoot', 'whip', 'settle', 'out', 'rest'].includes(stage);
  const showTitle = ['settle', 'out', 'rest'].includes(stage);
  const fadeScene = stage === 'settle' || stage === 'out';
  const fadeOut = stage === 'out';

  const netW = geo ? Math.max(1, geo.d * 0.024) : 1.5;
  const markW = geo ? Math.max(1.4, geo.d * 0.03) : 2;
  const frameThin = geo ? Math.max(1.6, geo.d * 0.04) : 2;
  const frameThick = geo ? Math.max(3, geo.d * 0.12) : 4;

  const vertLine = (d0, d1, delay, key) => (
    <motion.path key={key} fill="none" stroke={NET} strokeWidth={netW} strokeLinecap="round" strokeLinejoin="round"
      initial={{ d: d0, opacity: 0, pathLength: 0 }}
      animate={{ d: inGoal ? d1 : d0, opacity: vertsOn ? 1 : 0, pathLength: vertsOn ? 1 : 0 }}
      transition={{ d: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.3, delay }, pathLength: { duration: 0.7, delay, ease: 'easeInOut' } }} />
  );
  
  const horizLine = (d0, d1, delay, key) => (
    <motion.path key={key} fill="none" stroke={NET} strokeWidth={netW} strokeLinecap="round" strokeLinejoin="round"
      initial={{ d: d0, opacity: 0, pathLength: 0 }}
      animate={{ d: inGoal ? d1 : d0, opacity: inGoal ? 1 : 0, pathLength: inGoal ? 1 : 0 }}
      transition={{ d: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.4, delay }, pathLength: { duration: 0.6, delay, ease: 'easeInOut' } }} />
  );

  const markLine = (d, delay, key) => (
    <motion.path key={key} d={d} fill="none" stroke={NET} strokeWidth={markW} strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: marksOn ? 1 : 0, opacity: marksOn && !inGoal ? 1 : 0 }}
      transition={{ pathLength: { duration: 0.7, delay, ease: 'easeInOut' }, opacity: { duration: 0.25, delay } }} />
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

      {/* One shared rectangle morphs in place: pitch → goal. */}
      {geo && geo.ok && (
        <motion.svg className="ls-scene" width={geo.vw} height={geo.vh} viewBox={`0 0 ${geo.vw} ${geo.vh}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 'hidden' ? 0 : fadeScene ? 0 : 1 }}
          transition={{ duration: fadeScene ? 0.7 : 0.4, ease: 'easeInOut' }}>
          <defs>
            <radialGradient id="ls-goal-depth" cx="50%" cy="42%" r="80%">
              <stop offset="0%" stopColor="#0c1626" />
              <stop offset="100%" stopColor="#05080f" />
            </radialGradient>
            <radialGradient id="ls-golden-ripple" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="transparent" />
              <stop offset="90%" stopColor="#f5c542" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* pitch floor morphs from rectangle to trapezoid */}
          <motion.path 
            fill="url(#ls-goal-depth)"
            initial={{ d: geo.floor_0, opacity: 0 }} 
            animate={{ d: inGoal ? geo.floor_1 : geo.floor_0, opacity: inGoal ? 0.95 : 0 }} 
            transition={{ d: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.6, ease: 'easeInOut' } }} />

          {/* green mowing stripes (pitch) — morph to perspective and fade out */}
          <motion.g
            initial={{ opacity: 0 }} animate={{ opacity: greenOn ? 1 : 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            {geo.stripeRects.map((s, i) => (
              <motion.path key={i} fill={s.fill}
                initial={{ d: s.d0 }}
                animate={{ d: inGoal ? s.d1 : s.d0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            ))}
          </motion.g>

          {/* pitch markings — draw on at 'marks', fade as the goal forms */}
          {markLine(geo.leftPen, 0.15, 'lp')}
          {markLine(geo.rightPen, 0.15, 'rp')}
          {markLine(geo.leftGoalB, 0.25, 'lg')}
          {markLine(geo.rightGoalB, 0.25, 'rg')}
          {markLine(geo.leftArc, 0.35, 'la')}
          {markLine(geo.rightArc, 0.35, 'ra')}
          <motion.circle cx={geo.cc.x} cy={geo.cc.y} r={geo.ccR} fill="none" stroke={NET} strokeWidth={markW}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: marksOn ? 1 : 0, opacity: marksOn && !inGoal ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.7, delay: 0.1, ease: 'easeInOut' }, opacity: { duration: 0.25, delay: 0.1 } }} />
          {geo.spots.map((sp, i) => (
            <motion.circle key={i} cx={sp.x} cy={sp.y} r={Math.max(2, geo.d * 0.045)} fill={NET}
              initial={{ opacity: 0 }} animate={{ opacity: marksOn && !inGoal ? 1 : 0 }} transition={{ duration: 0.25, delay: 0.25 }} />
          ))}

          {/* NET group: vertical and horizontal ropes morph into perspective net */}
          <motion.g
            animate={{ scale: stage === 'whip' ? [1, 1.02, 0.992, 1] : 1, y: stage === 'whip' ? [0, geo.d * 0.13, 0] : 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ transformOrigin: `${geo.cx}px ${geo.cy}px` }}>
            {geo.verts.map((v, i) => vertLine(v.d0, v.d1, 0.12 + i * 0.03, `v${i}`))}
            {geo.horizs.map((h, i) => horizLine(h.d0, h.d1, 0.12 + i * 0.03, `h${i}`))}
            {geo.topRibs.map((d, i) => (
              <motion.path key={`tr${i}`} d={d} fill="none" stroke={NET} strokeWidth={netW} strokeLinecap="round" strokeLinejoin="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: inGoal ? 0.55 : 0, pathLength: inGoal ? 1 : 0 }}
                transition={{ opacity: { duration: 0.4, delay: 0.14 + i * 0.02 }, pathLength: { duration: 0.6, delay: 0.14 + i * 0.02, ease: 'easeInOut' } }} />
            ))}
          </motion.g>

          {/* back frame + depth edges — the goal's perspective depth */}
          <motion.path d={geo.backFrame} fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round" strokeWidth={frameThin}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: inGoal ? 0.9 : 0, pathLength: inGoal ? 1 : 0 }}
            transition={{ opacity: { duration: 0.4, delay: 0.15 }, pathLength: { duration: 0.7, delay: 0.15, ease: 'easeInOut' } }} />
          {geo.connectors.map((d, i) => (
            <motion.path key={`c${i}`} d={d} fill="none" stroke={GOLD} strokeLinecap="round" strokeWidth={frameThin}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: inGoal ? 0.75 : 0, pathLength: inGoal ? 1 : 0 }}
              transition={{ opacity: { duration: 0.4, delay: 0.18 }, pathLength: { duration: 0.6, delay: 0.18, ease: 'easeInOut' } }} />
          ))}

          {/* impact golden ripples — centred on the ball where it hits the net */}
          <motion.circle cx={geo.cx} cy={geo.cy} fill="none" stroke={GOLD} strokeWidth={frameThin}
            initial={{ r: 0, opacity: 0 }}
            animate={stage === 'whip' ? { r: [0, geo.d * 3], opacity: [0.8, 0] } : { r: 0, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }} />
          <motion.circle cx={geo.cx} cy={geo.cy} fill="none" stroke={GOLD} strokeWidth={frameThin * 0.5}
            initial={{ r: 0, opacity: 0 }}
            animate={stage === 'whip' ? { r: [0, geo.d * 2.2], opacity: [0.6, 0] } : { r: 0, opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }} />

           {/* gold frame — morphs from pitch border to upright goal frame */}
          <motion.path fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round"
            initial={{ d: geo.frame_0, pathLength: 0, opacity: 0, strokeWidth: frameThin }}
            animate={{ d: inGoal ? geo.frame_1 : geo.frame_0, pathLength: (marksOn || inGoal) ? 1 : 0, opacity: (marksOn || inGoal) ? 1 : 0, strokeWidth: inGoal ? frameThick : frameThin }}
            transition={{ d: { duration: 0.8, ease: 'easeInOut' }, pathLength: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.35 }, strokeWidth: { duration: 0.7, ease: 'easeOut' } }} />

          {/* gold frame bottom touchline — drawn during pitch phase and fades out */}
          <motion.path fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0, strokeWidth: frameThin }}
            animate={{ pathLength: (marksOn && !inGoal) ? 1 : 0, opacity: (marksOn && !inGoal) ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.25 } }}
            d={`M ${geo.L} ${geo.B} L ${geo.R} ${geo.B}`} />
        </motion.svg>
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
