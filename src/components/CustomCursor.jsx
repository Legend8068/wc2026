import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

const CustomCursor = React.memo(function CustomCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Skip on touch devices
    if ('ontouchstart' in window) return;

    const dot = dotRef.current;
    if (!dot) return;

    const body = document.body;
    let lastX = 0;
    let lastY = 0;
    let lastWheel = 0;

    const onMove = (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      // A move over content always reclaims control from the native cursor.
      body.classList.add('custom-cursor-active');
      dot.style.opacity = '1';
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };

    const onLeave = () => {
      dot.style.opacity = '0';
    };

    const onDown = () => {
      dot.classList.add('cursor-click');
    };

    const onUp = () => {
      dot.classList.remove('cursor-click');
    };

    const onWheel = () => {
      lastWheel = performance.now();
    };

    // A native scrollbar drag scrolls the page but fires NO mousemove events,
    // so the custom cursor would freeze at the grab point while the real cursor
    // (which the OS keeps glued to the scrollbar thumb) stays hidden. Detect
    // that case — a scroll that isn't from the wheel, with the pointer last seen
    // in the scrollbar gutter — and hand control back to the real cursor. The
    // next mouse move over content (onMove) restores the custom cursor.
    const onScroll = () => {
      if (performance.now() - lastWheel < 150) return; // wheel scroll: keep custom cursor
      // Distance from the viewport's right/bottom edge — where a scrollbar lives,
      // whether it reserves layout width (Windows / "always show") or overlays it
      // (macOS auto-hide). GUTTER is the slack so a quick grab still registers.
      const GUTTER = 26;
      const nearRightEdge = lastX >= window.innerWidth - GUTTER;
      const nearBottomEdge = lastY >= window.innerHeight - GUTTER;
      if (nearRightEdge || nearBottomEdge) {
        body.classList.remove('custom-cursor-active'); // reveal the real cursor
        dot.style.opacity = '0';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    body.classList.add('custom-cursor-active');

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll, { capture: true });
      body.classList.remove('custom-cursor-active');
    };
  }, []);

  return (
    /* Football core — crosshair hairlines come from .cursor-dot's
       pseudo-elements so they don't spin with the ball */
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
  );
});

export default CustomCursor;
