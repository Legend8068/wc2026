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
      </div>
    </div>
  );
}

export default memo(LoadingScreen);
