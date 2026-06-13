import React, { useEffect, useLayoutEffect, useRef, useState, memo } from 'react';
import { animate } from 'framer-motion';
import BrandText from './BrandText';

/* ============================================================
   WC2026 — Loading Screen
   Mirrors the hero exactly (same FIFA WORLD CUP / 2026 /
   USA · CANADA · MEXICO lockup, same angular BrandText font,
   same dark gradient ground) so the hand-off into the hero is
   seamless — the text and background don't move or change.

   A soccer ball rolls in slowly from the right and settles into
   the "0" of 2026, then the overlay fades to reveal the hero.
   ============================================================ */

const EXPO_OUT = [0.16, 1, 0.3, 1];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function LoadingScreen({ onDone }) {
  const overlay = useRef(null);
  const title = useRef(null);
  const ball = useRef(null);
  const pulse = useRef(null);
  const [pos, setPos] = useState(null);

  // Measure the real hero title so our clone sits exactly on top of it.
  useLayoutEffect(() => {
    const ht = document.querySelector('.hero .hero-title');
    if (ht) {
      const r = ht.getBoundingClientRect();
      setPos({ left: r.left, top: r.top });
    } else {
      setPos({ left: null, top: null }); // fallback → centre
    }
  }, []);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    let done = false;
    const controls = [];
    const a = (el, kf, o) => { const c = animate(el, kf, o); controls.push(c); return c; };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.style.overflow = 'hidden';

    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('staticLoader')) {
      setTimeout(() => {
        const year = title.current?.querySelector('.hero-brand-year');
        const chars = year?.querySelectorAll('.brand-char');
        if (title.current) title.current.style.opacity = '1';
        if (chars && chars.length >= 2 && ball.current) {
          const zr = chars[1].getBoundingClientRect();
          const d = zr.height * 1.04, cx = zr.left + zr.width / 2, cy = zr.top + zr.height / 2;
          const b = ball.current;
          b.style.width = b.style.height = `${d}px`;
          b.style.left = `${cx - d / 2}px`; b.style.top = `${cy - d / 2}px`;
          b.style.opacity = '1'; b.style.transform = 'translateX(0)';
        }
      }, 50);
      return () => { document.body.style.overflow = ''; };
    }
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(failsafe);
      document.body.style.overflow = '';
      onDone?.();
    };
    // Never strand the user if animations stall (e.g. backgrounded tab).
    const failsafe = setTimeout(finish, 8000);

    // Size & position the ball (and its pulse) onto the "0" glyph of 2026.
    const placeOnZero = () => {
      const year = title.current?.querySelector('.hero-brand-year');
      const chars = year?.querySelectorAll('.brand-char');
      if (!chars || chars.length < 2) return null;
      const zr = chars[1].getBoundingClientRect(); // "2026"[1] === "0"
      const d = zr.height * 1.04;
      const cx = zr.left + zr.width / 2;
      const cy = zr.top + zr.height / 2;
      const b = ball.current, p = pulse.current;
      b.style.width = p.style.width = `${d}px`;
      b.style.height = p.style.height = `${d}px`;
      b.style.left = p.style.left = `${cx - d / 2}px`;
      b.style.top = p.style.top = `${cy - d / 2}px`;
      return { d, restLeft: cx - d / 2 };
    };

    const run = async () => {
      // Nothing is shown yet — only the ball will roll in. The title stays
      // hidden (we still measure the "0" slot, since it's laid out at opacity 0).
      const info = placeOnZero();
      if (!info) { a(title.current, { opacity: 1 }, { duration: 0 }); await wait(700); if (!cancelled) finish(); return; }

      const startX = window.innerWidth - info.restLeft + info.d + 80; // just off the right edge
      const startRot = (startX / (Math.PI * info.d)) * 360;           // matched rolling spin
      const arc = info.d * 0.1;                                       // settles up into the 0

      a(ball.current, { x: startX, y: arc, rotate: startRot, opacity: 1 }, { duration: 0 });

      if (reduced) {
        a(ball.current, { x: 0, y: 0, rotate: 0 }, { duration: 0 });
        a(title.current, { opacity: 1 }, { duration: 0 });
        await wait(900); if (cancelled) return;
        await a(overlay.current, { opacity: 0 }, { duration: 0.5 });
        if (!cancelled) finish();
        return;
      }

      await wait(450); if (cancelled) return;

      // 1) Roll in from the right — slow — easing to a stop in the "0" slot.
      await a(ball.current,
        { x: [startX, 0], y: [arc, 0], rotate: [startRot, 0] },
        { duration: 2.6, ease: EXPO_OUT });
      if (cancelled) return;

      // Lock: a small settle + an expanding pulse.
      a(ball.current, { scale: [1, 0.9, 1] }, { duration: 0.34, ease: 'easeOut' });
      a(pulse.current, { scale: [0.5, 2.3], opacity: [0.55, 0] }, { duration: 0.7, ease: 'easeOut' });
      await wait(420); if (cancelled) return;

      // 2) The "0" has landed — now reveal the rest of the text around it.
      // Used a softer ease and longer duration so it fades elegantly instead of snapping.
      await a(title.current, { opacity: [0, 1] }, { duration: 1.2, ease: 'easeInOut' });
      if (cancelled) return;
      await wait(650); if (cancelled) return;

      // 3) Seamless hand-off into the page: the hero underneath has the identical
      // lockup in the same place on the same background, so fading the overlay
      // reads as the rest of the hero simply arriving around the text.
      await a(overlay.current, { opacity: [1, 0] }, { duration: 0.9, ease: 'easeInOut' });
      if (!cancelled) finish();
    };

    run();
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      controls.forEach((c) => c.stop?.());
      document.body.style.overflow = '';
    };
  }, [pos, onDone]);

  const titleStyle = pos && pos.left != null
    ? { position: 'absolute', left: pos.left, top: pos.top, width: 'max-content', opacity: 0 }
    : { position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', width: 'max-content', alignItems: 'center', opacity: 0 };

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[200] overflow-hidden"
      aria-hidden="true"
      style={{ background: 'linear-gradient(175deg, var(--bg-light) 0%, var(--bg) 30%, var(--bg-deep) 100%)' }}
    >
      {/* exact hero lockup, white angular BrandText */}
      <div ref={title} className="hero-title" style={titleStyle}>
        <div className="hero-kicker">FIFA WORLD CUP</div>
        <BrandText text="2026" className="hero-brand-year" useBallForZero={true} />
        <BrandText text="USA · CANADA · MEXICO" className="hero-brand-hosts" />
      </div>

      {/* lock pulse (under the ball) — matches the "0" rounded-square shape */}
      <div
        ref={pulse}
        style={{ position: 'absolute', borderRadius: '20%', border: '3px solid #f5c542', opacity: 0, pointerEvents: 'none' }}
      />

      {/* the rolling ball — shaped like the "0" glyph, lands in its slot */}
      <div ref={ball} style={{ position: 'absolute', opacity: 0, willChange: 'transform', pointerEvents: 'none' }}>
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
            <g strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 1.5px 1.5px rgba(0,0,0,0.15))">
              {/* Top fountain */}
              <path d="M48,30 C45,24 40,20 35,22" stroke="#a31f47" />
              <path d="M52,30 C55,24 60,20 65,22" stroke="#298888" />
              <path d="M50,28 C50,20 55,14 62,12" stroke="#4a256a" />
              <path d="M46,26 C40,20 42,10 48,10" stroke="#d1a74d" />
              
              <polygon points="38,12 43,8 44,16" fill="none" stroke="#a31f47" />
              <polygon points="62,14 68,18 58,18" fill="none" stroke="#298888" />
              <circle cx="56" cy="8" r="2.5" fill="none" stroke="#4a256a" />
              <circle cx="38" cy="6" r="2" fill="none" stroke="#d1a74d" />

              {/* Left */}
              <path d="M38,40 C32,40 28,35 30,30" stroke="#a31f47" />
              <polygon points="26,42 32,48 22,48" fill="none" stroke="#298888" />
              <polygon points="35,52 30,56 38,56" fill="none" stroke="#4a256a" />
              <path d="M26,54 C32,58 36,54 38,60" stroke="#e06b26" />
              <circle cx="24" cy="34" r="2" fill="none" stroke="#d1a74d" />

              {/* Right */}
              <path d="M62,40 C68,40 72,35 70,30" stroke="#4a256a" />
              <polygon points="74,42 68,48 78,48" fill="none" stroke="#a31f47" />
              <polygon points="65,52 70,56 62,56" fill="none" stroke="#298888" />
              <path d="M74,54 C68,58 64,54 62,60" stroke="#8db544" />
              <circle cx="76" cy="34" r="2.5" fill="none" stroke="#d1a74d" />

              {/* Bottom */}
              <path d="M45,72 C45,78 40,82 35,78" stroke="#298888" />
              <path d="M55,72 C55,78 60,82 65,78" stroke="#a31f47" />
              <polygon points="50,76 55,82 45,82" fill="none" stroke="#4a256a" />
              <circle cx="40" cy="84" r="2" fill="none" stroke="#d1a74d" />
              <circle cx="60" cy="84" r="2" fill="none" stroke="#298888" />
              <polygon points="32,74 36,70 34,78" fill="none" stroke="#a31f47" />
              <polygon points="68,74 64,70 66,78" fill="none" stroke="#d1a74d" />
            </g>

            {/* World Cup Trophy */}
            <g fill="#c49a3f" transform="translate(50, 50) scale(1.4) translate(-50, -50)" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.2))">
              {/* Base */}
              <path d="M46.5 64 h7 l1 3 h-9 z" />
              <path d="M46 60 h8 l.5 3 h-9 z" />
              {/* Figures holding globe */}
              <path d="M46 60 c-1.5-6 -4-10 -4-15 c0-5 3-4 4-2 c0 0 2-4 6-2 c1-1 4-2 4 2 c0 5 -2.5 9 -4 15 z" />
              {/* Globe */}
              <circle cx="50" cy="40" r="4.5" />
            </g>
            
            <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="none" stroke="#d5d0c5" strokeWidth="2.5" />
          </g>
          {/* subtle gold frame echoing the rounded shape */}
          <rect x="1.5" y="1.5" width="97" height="97" rx="18.5" fill="none" stroke="#f5c542" strokeWidth="1.4" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

export default memo(LoadingScreen);
