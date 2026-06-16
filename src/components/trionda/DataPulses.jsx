import React from 'react';
import { motion } from 'framer-motion';

/* ============================================================================
   <DataPulses /> — step 8, "The ball that talks."
   Concentric rings + spokes radiating from the chip at centre out to the screen
   edges, evoking the 500Hz Kinexon feed streaming to the VAR system.
   `active` gates the looping animation so it only runs in its scroll window.
   ============================================================================ */
export default function DataPulses({ active }) {
  const rings = [0, 1, 2];
  const spokes = Array.from({ length: 12 });
  return (
    <div className={`tri-pulses ${active ? 'is-on' : ''}`} aria-hidden="true">
      <svg viewBox="-200 -200 400 400" preserveAspectRatio="xMidYMid slice">
        {/* radiating spokes */}
        {spokes.map((_, i) => {
          const a = (i / spokes.length) * Math.PI * 2;
          const x = Math.cos(a) * 260;
          const y = Math.sin(a) * 260;
          return (
            <motion.line
              key={`s${i}`}
              x1="0" y1="0" x2={x} y2={y}
              stroke="var(--gold)"
              strokeWidth="0.6"
              strokeOpacity="0.25"
              animate={active ? { strokeOpacity: [0, 0.4, 0], pathLength: [0, 1, 1] } : { strokeOpacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: (i % 4) * 0.18 }}
            />
          );
        })}
        {/* expanding rings */}
        {rings.map((r) => (
          <motion.circle
            key={`r${r}`}
            cx="0" cy="0" r="20"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.2"
            animate={active ? { r: [12, 280], opacity: [0.9, 0] } : { opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: r * 0.8, ease: 'easeOut' }}
          />
        ))}
        {/* the chip heartbeat */}
        <motion.rect
          x="-9" y="-9" width="18" height="18" rx="3"
          fill="var(--gold)"
          animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
    </div>
  );
}
