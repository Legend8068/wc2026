import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

const HOVER_SELECTOR =
  'a, button, [role="button"], input, select, textarea, .clickable, .tab-btn, .mode-badge';
const MAX_LOCK_WIDTH = 340; // don't frame huge elements — fall back to free reticle

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const ringInnerRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const lockEl = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Skip on touch devices
    if ('ontouchstart' in window) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const ringInner = ringInnerRef.current;
    if (!dot || !ring || !ringInner) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };

    const onLeave = () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onDown = () => {
      dot.classList.add('cursor-click');
      ring.classList.add('cursor-click');
    };

    const onUp = () => {
      dot.classList.remove('cursor-click');
      ring.classList.remove('cursor-click');
    };

    // Target lock-on: remember the hovered interactive element so the
    // reticle can detach from the pointer and frame it.
    const onOver = (e) => {
      const el = e.target.closest(HOVER_SELECTOR);
      if (el) {
        lockEl.current = el;
        ring.classList.add('cursor-lock');
        dot.classList.add('cursor-hover');
      }
    };

    const onOut = (e) => {
      const el = e.target.closest(HOVER_SELECTOR);
      if (el && el === lockEl.current) {
        lockEl.current = null;
        ring.classList.remove('cursor-lock');
        dot.classList.remove('cursor-hover');
      }
    };

    const animate = () => {
      const target = lockEl.current;
      let tx = pos.current.x;
      let ty = pos.current.y;
      let ease = 0.15;

      if (target && document.contains(target)) {
        const r = target.getBoundingClientRect();
        if (r.width > 0 && r.width <= MAX_LOCK_WIDTH) {
          // snap the reticle onto the element and size the frame to it
          tx = r.left + r.width / 2;
          ty = r.top + r.height / 2;
          ease = 0.3;
          ringInner.style.width = `${r.width + 18}px`;
          ringInner.style.height = `${r.height + 14}px`;
        } else {
          ringInner.style.width = '';
          ringInner.style.height = '';
        }
      } else {
        ringInner.style.width = '';
        ringInner.style.height = '';
      }

      ringPos.current.x += (tx - ringPos.current.x) * ease;
      ringPos.current.y += (ty - ringPos.current.y) * ease;
      ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.body.classList.add('custom-cursor-active');
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.body.classList.remove('custom-cursor-active');
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Football core — crosshair hairlines come from .cursor-dot's
          pseudo-elements so they don't spin with the ball */}
      <div ref={dotRef} className="cursor-dot" aria-hidden="true">
        <div className="cursor-dot-inner">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="cur-ball-shade" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#fff8ec" />
                <stop offset="62%" stopColor="#f4ead6" />
                <stop offset="100%" stopColor="#d9cbab" />
              </radialGradient>
              <clipPath id="cur-ball-clip">
                <circle cx="50" cy="50" r="45.5" />
              </clipPath>
              {/* one edge pentagon + its seam; rotated copies make the rest */}
              <g id="cur-ball-seg">
                <polygon points="63.9,31 59.3,17 71.2,8.4 83.1,17 78.5,31" />
                <line x1="50" y1="36" x2="50" y2="19" stroke="#11244a" strokeWidth="3.4" strokeLinecap="round" />
              </g>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#cur-ball-shade)" stroke="#11244a" strokeWidth="5" />
            <g clipPath="url(#cur-ball-clip)" fill="#11244a">
              {/* centre pentagon, point-up */}
              <polygon points="50,36 63.3,45.7 58.2,61.3 41.8,61.3 36.7,45.7" />
              <use href="#cur-ball-seg" />
              <use href="#cur-ball-seg" transform="rotate(72 50 50)" />
              <use href="#cur-ball-seg" transform="rotate(144 50 50)" />
              <use href="#cur-ball-seg" transform="rotate(216 50 50)" />
              <use href="#cur-ball-seg" transform="rotate(288 50 50)" />
            </g>
            {/* gold equator glint — ties the ball to the chart's gold ink */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#e8b84b" strokeWidth="1.6" opacity="0.55" />
          </svg>
        </div>
      </div>

      {/* Trailing reticle: circle + ticks when free, gold corner brackets
          when locked onto a target */}
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <div ref={ringInnerRef} className="cursor-ring-inner">
          <span className="cur-bracket cur-b-tl" />
          <span className="cur-bracket cur-b-tr" />
          <span className="cur-bracket cur-b-bl" />
          <span className="cur-bracket cur-b-br" />
        </div>
      </div>
    </>
  );
}
