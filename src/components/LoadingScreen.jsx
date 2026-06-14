import React, { useEffect, useLayoutEffect, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import BrandText from './BrandText';
import './LoadingScreen.css';

/* ============================================================
   WC2026 — Loading Screen ("Kickoff")
   Mirrors the hero exactly (same FIFA WORLD CUP / 2026 /
   USA · CANADA · MEXICO lockup, same angular BrandText font,
   same dark gradient ground) so the hand-off is seamless.

   Inspired by a bold flat-graphic sports loop, in the site's
   navy + gold language: gold top-down pitch markings draw
   themselves onto the navy ground, the ball drops onto the
   centre spot with a springy bounce, then the centre circle
   tightens into the rounded "0" of 2026 as the lockup reveals.
   Built with Framer Motion (pathLength draw-on + springs).
   ============================================================ */

const GOLD = '#f5c542';

/* Stage timeline (ms offsets from start). */
const T = { draw: 0, drop: 1320, land: 2280, morph: 2560, out: 3480, end: 4380 };

/* Faint starfield — generated once at module load (kept out of render). */
const STARS = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: 1 + Math.random() * 1.8,
  min: 0.06 + Math.random() * 0.1,
  max: 0.3 + Math.random() * 0.35,
  delay: -Math.random() * 3.2,
}));

function LoadingScreen({ onDone }) {
  const overlay = useRef(null);
  const title = useRef(null);
  const ball = useRef(null);
  const pulse = useRef(null);
  const [pos, setPos] = useState(null);
  const [geo, setGeo] = useState(null);
  const [stage, setStage] = useState('hidden'); // hidden → draw → drop → land → morph → out
  const finished = useRef(false);

  // Measure the real hero title so our clone sits exactly on top of it.
  useLayoutEffect(() => {
    const ht = document.querySelector('.hero .hero-title');
    setPos(ht ? (() => { const r = ht.getBoundingClientRect(); return { left: r.left, top: r.top }; })() : { left: null, top: null });
  }, []);

  // Once the clone is positioned, measure its "0" glyph and derive the pitch.
  useLayoutEffect(() => {
    if (!pos) return;
    const year = title.current?.querySelector('.hero-brand-year');
    const chars = year?.querySelectorAll('.brand-char');
    if (!chars || chars.length < 2) { setGeo({ ok: false }); return; }
    const zr = chars[1].getBoundingClientRect(); // "2026"[1] === "0"
    const d = zr.height * 1.04;
    const cx = zr.left + zr.width / 2;
    const cy = zr.top + zr.height / 2;

    // size & place the ball + pulse onto the "0" slot
    const b = ball.current, p = pulse.current;
    if (b) { b.style.width = b.style.height = `${d}px`; b.style.left = `${cx - d / 2}px`; b.style.top = `${cy - d / 2}px`; }
    if (p) { p.style.width = p.style.height = `${d}px`; p.style.left = `${cx - d / 2}px`; p.style.top = `${cy - d / 2}px`; }

    const vw = window.innerWidth, vh = window.innerHeight;
    const pitchW = Math.min(vw * 0.92, 1180);
    const pitchH = Math.min(pitchW * 0.6, vh * 0.78);
    const R0 = d * 2.35;                 // centre-circle radius while it's a pitch
    const rEnd = d * 0.62;               // ring hugging the ball once it's the "0"
    const boxW = pitchW * 0.15;
    const boxH = Math.min(pitchH * 0.55, R0 * 2.6);
    const left = cx - pitchW / 2, right = cx + pitchW / 2;
    const top = cy - pitchH / 2, bot = cy + pitchH / 2;
    const arcR = boxH * 0.32;

    setGeo({
      ok: true, vw, vh, cx, cy, d, R0, rEnd,
      boundary: `M ${left} ${top} H ${right} V ${bot} H ${left} Z`,
      halfway: `M ${cx} ${top} L ${cx} ${bot}`,
      leftBox: `M ${left} ${cy - boxH / 2} H ${left + boxW} V ${cy + boxH / 2} H ${left}`,
      rightBox: `M ${right} ${cy - boxH / 2} H ${right - boxW} V ${cy + boxH / 2} H ${right}`,
      leftArc: `M ${left + boxW} ${cy - arcR} A ${arcR} ${arcR} 0 0 1 ${left + boxW} ${cy + arcR}`,
      rightArc: `M ${right - boxW} ${cy - arcR} A ${arcR} ${arcR} 0 0 0 ${right - boxW} ${cy + arcR}`,
      spotR: Math.max(2.5, d * 0.06),
      dropFrom: -(cy + d * 1.5),
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
    const failsafe = setTimeout(finish, 9000);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStatic = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('staticLoader');

    let cancelled = false;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));

    if (!geo.ok || reduced || isStatic) {
      // No pitch — just present the lockup with the ball already in the "0".
      setStage('rest');
      at(reduced || isStatic ? 700 : 700, () => setStage('out'));
      at(reduced || isStatic ? 1500 : 1500, finish);
      return () => { cancelled = true; clearTimeout(failsafe); timers.forEach(clearTimeout); document.body.style.overflow = ''; };
    }

    setStage('draw');
    at(T.drop, () => setStage('drop'));
    at(T.land, () => setStage('land'));
    at(T.morph, () => setStage('morph'));
    at(T.out, () => setStage('out'));
    at(T.end, finish);

    return () => { cancelled = true; clearTimeout(failsafe); timers.forEach(clearTimeout); document.body.style.overflow = ''; };
  }, [geo, onDone]);

  const titleStyle = pos && pos.left != null
    ? { position: 'absolute', left: pos.left, top: pos.top, width: 'max-content', opacity: 0 }
    : { position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', width: 'max-content', alignItems: 'center', opacity: 0 };

  // ---- stage-driven animation targets ----
  const drawn = stage === 'draw' || stage === 'drop' || stage === 'land';
  const gone = stage === 'morph' || stage === 'out';
  const dropped = stage === 'drop' || stage === 'land' || stage === 'morph' || stage === 'out';
  const showTitle = stage === 'morph' || stage === 'out' || stage === 'rest';
  const fadeOut = stage === 'out';

  // A pitch line: draws on (pathLength 0→1) staggered, retracts on morph.
  const line = (d, delay, key, extra = {}) => (
    <motion.path
      key={key}
      d={d}
      fill="none"
      stroke={GOLD}
      strokeWidth={geo ? Math.max(2, geo.d * 0.045) : 3}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={drawn ? { pathLength: 1, opacity: 1 } : gone ? { pathLength: 0, opacity: 0 } : { pathLength: 0, opacity: 0 }}
      transition={drawn
        ? { pathLength: { duration: 0.85, delay, ease: 'easeInOut' }, opacity: { duration: 0.3, delay } }
        : { pathLength: { duration: 0.45, delay: delay * 0.25, ease: 'easeIn' }, opacity: { duration: 0.4, delay: delay * 0.25 } }}
      style={extra.style}
    />
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
      {/* texture: starfield + grain + vignette (vignette focuses on the "0") */}
      <motion.div className="ls-stars" initial={{ opacity: 0 }} animate={{ opacity: stage === 'hidden' ? 0 : fadeOut ? 0 : 1 }} transition={{ duration: 0.8 }}>
        {STARS.map((st) => (
          <span key={st.id} className="ls-star" style={{
            left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s,
            '--tw-min': st.min, '--tw-max': st.max, animationDelay: `${st.delay}s`,
          }} />
        ))}
      </motion.div>
      <div className="ls-grain" />
      {geo && geo.ok && (
        <div className="ls-vignette" style={{ '--vx': `${(geo.cx / geo.vw) * 100}%`, '--vy': `${(geo.cy / geo.vh) * 100}%` }} />
      )}

      {/* the top-down pitch, drawn in gold around the "0" slot */}
      {geo && geo.ok && (
        <svg className="ls-pitch" width={geo.vw} height={geo.vh} viewBox={`0 0 ${geo.vw} ${geo.vh}`}
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible',
            WebkitMaskImage: `radial-gradient(circle at ${geo.cx}px ${geo.cy}px, #000 0, #000 ${geo.R0 * 1.1}px, transparent ${geo.R0 * 2.25}px)`,
            maskImage: `radial-gradient(circle at ${geo.cx}px ${geo.cy}px, #000 0, #000 ${geo.R0 * 1.1}px, transparent ${geo.R0 * 2.25}px)`,
          }}>
          {line(geo.boundary, 0, 'b')}
          {line(geo.halfway, 0.2, 'h')}
          {line(geo.leftBox, 0.38, 'lb')}
          {line(geo.rightBox, 0.38, 'rb')}
          {line(geo.leftArc, 0.52, 'la')}
          {line(geo.rightArc, 0.52, 'ra')}

          {/* centre spot — fades as the ball covers it */}
          <motion.circle cx={geo.cx} cy={geo.cy} r={geo.spotR} fill={GOLD}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0.4 }}
            transition={{ duration: 0.4, delay: drawn ? 0.45 : 0 }}
            style={{ transformOrigin: `${geo.cx}px ${geo.cy}px` }} />

          {/* centre circle — becomes the gold ring of the "0" */}
          <motion.circle cx={geo.cx} cy={geo.cy} fill="none" stroke={GOLD}
            strokeWidth={Math.max(2, geo.d * 0.05)} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0, r: geo.R0 }}
            animate={
              stage === 'hidden' || stage === 'rest' ? { pathLength: 0, opacity: 0, r: geo.R0 }
              : stage === 'land' ? { pathLength: 1, opacity: 1, r: [geo.R0, geo.R0 * 0.94, geo.R0] }
              : gone ? { pathLength: 1, opacity: fadeOut ? 0 : 0.85, r: geo.rEnd }
              : { pathLength: 1, opacity: 1, r: geo.R0 }
            }
            transition={
              stage === 'land' ? { r: { duration: 0.32, ease: 'easeOut' } }
              : gone ? { r: { duration: 0.62, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: fadeOut ? 0.5 : 0.4 } }
              : { pathLength: { duration: 0.95, delay: 0.4, ease: 'easeInOut' }, opacity: { duration: 0.3, delay: 0.4 } }
            } />
        </svg>
      )}

      {/* exact hero lockup, white angular BrandText (revealed around the ball) */}
      <motion.div ref={title} className="hero-title" style={titleStyle}
        animate={{ opacity: showTitle ? 1 : 0 }}
        transition={{ duration: 1.0, delay: stage === 'morph' ? 0.18 : 0, ease: 'easeInOut' }}>
        <div className="hero-kicker">FIFA WORLD CUP</div>
        <BrandText text="2026" className="hero-brand-year" useBallForZero={true} />
        <BrandText text="USA · CANADA · MEXICO" className="hero-brand-hosts" />
      </motion.div>

      {/* landing pulse (under the ball) — matches the "0" rounded-square shape */}
      <motion.div ref={pulse}
        style={{ position: 'absolute', borderRadius: '20%', border: `3px solid ${GOLD}`, opacity: 0, pointerEvents: 'none' }}
        animate={stage === 'land' ? { scale: [0.5, 2.3], opacity: [0.55, 0] } : { opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }} />

      {/* the ball — drops onto the centre spot, then rests as the "0" */}
      <motion.div ref={ball}
        style={{ position: 'absolute', willChange: 'transform', pointerEvents: 'none' }}
        initial={{ y: geo ? geo.dropFrom : -600, opacity: 0, rotate: -180, scale: 1 }}
        animate={
          stage === 'rest' ? { y: 0, opacity: 1, rotate: 0, scale: 1 }
          : dropped ? { y: 0, opacity: 1, rotate: 0, scale: stage === 'land' ? [1, 0.9, 1.05, 1] : 1 }
          : { y: geo ? geo.dropFrom : -600, opacity: 0, rotate: -180, scale: 1 }
        }
        transition={{
          y: { type: 'spring', stiffness: 260, damping: 14, mass: 1.1 },
          rotate: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.2 },
          scale: { duration: 0.4, ease: 'easeOut' },
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
