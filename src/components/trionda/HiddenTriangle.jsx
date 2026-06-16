import React from 'react';
import { motion } from 'framer-motion';

/* ============================================================================
   <HiddenTriangle /> — graphic for the "three waves / hidden centre" beat.
   Since the real ball is one welded mesh, we tell the story with an SVG: three
   nation arcs sweep in and meet at a central gold triangle holding 🍁 🦅 ★.
   `active` gates the draw-on animation to its scroll window.
   ============================================================================ */
const NATIONS = [
  { icon: '🍁', label: 'CAN', c: 'var(--red-light)', a: -90 },
  { icon: '🦅', label: 'MEX', c: 'var(--green)', a: 30 },
  { icon: '★', label: 'USA', c: 'color-mix(in srgb, var(--blue) 72%, var(--white))', a: 150 },
];

export default function HiddenTriangle({ active }) {
  const R = 86;
  // triangle vertices (matching the three nation angles)
  const pts = NATIONS.map((n) => {
    const r = (n.a * Math.PI) / 180;
    return [Math.cos(r) * 46, Math.sin(r) * 46];
  });
  const triPath = `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]} L${pts[2][0]},${pts[2][1]} Z`;

  return (
    <div className="tri-triangle" aria-hidden="true">
      <svg viewBox="-110 -110 220 220">
        {/* faint guide ring */}
        <circle cx="0" cy="0" r={R} fill="none" stroke="var(--slate)" strokeOpacity="0.25" strokeDasharray="2 5" />

        {/* nation arcs sweeping inward */}
        {NATIONS.map((n, i) => {
          const r = (n.a * Math.PI) / 180;
          return (
            <motion.line
              key={i}
              x1={Math.cos(r) * R} y1={Math.sin(r) * R}
              x2={pts[i][0]} y2={pts[i][1]}
              stroke={n.c} strokeWidth="2" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={active ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: 'easeOut' }}
            />
          );
        })}

        {/* the hidden triangle */}
        <motion.path
          d={triPath}
          fill="color-mix(in srgb, var(--gold) 18%, transparent)"
          stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: 'easeInOut' }}
        />

        {/* nation marks at the outer ends */}
        {NATIONS.map((n, i) => {
          const r = (n.a * Math.PI) / 180;
          const x = Math.cos(r) * R;
          const y = Math.sin(r) * R;
          return (
            <motion.g
              key={`m${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 0.8 + i * 0.12, type: 'spring', stiffness: 280, damping: 18 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <circle cx={x} cy={y} r="15" fill="var(--bg-deep)" stroke={n.c} strokeWidth="2" />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="14">{n.icon}</text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
