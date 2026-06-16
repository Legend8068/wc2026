import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================================================
   <HiddenDetails /> — step 9, "Hidden details."
   Three hotspots laid over the (slowed) ball. Hover/focus lights up the host
   icon and reveals a mini story card. Positioned as % of the stage so they sit
   over the ball regardless of viewport.
   ============================================================================ */
const SPOTS = [
  { id: 'ca', icon: '🍁', label: 'Maple Leaf', nation: 'Canada', color: 'var(--red-light)', x: 34, y: 30,
    text: 'A maple leaf for Canada, hosting World Cup matches for the very first time.' },
  { id: 'mx', icon: '🦅', label: 'Eagle', nation: 'Mexico', color: 'var(--green)', x: 68, y: 46,
    text: 'An eagle for Mexico — the first nation ever to host three men’s World Cups.' },
  { id: 'us', icon: '★', label: 'Star', nation: 'USA', color: 'color-mix(in srgb, var(--blue) 70%, var(--white))', x: 46, y: 68,
    text: 'A star for the USA, anchoring the largest World Cup in history at 48 teams.' },
];

export default function HiddenDetails({ active }) {
  const [open, setOpen] = useState(null);
  return (
    <div className={`tri-spots ${active ? 'is-on' : ''}`}>
      {SPOTS.map((s) => (
        <div
          key={s.id}
          className="tri-spot"
          style={{ left: `${s.x}%`, top: `${s.y}%`, '--spot': s.color }}
          onMouseEnter={() => setOpen(s.id)}
          onMouseLeave={() => setOpen((o) => (o === s.id ? null : o))}
        >
          <button
            type="button"
            className="tri-spot__dot"
            aria-label={`${s.label} — ${s.nation}`}
            onFocus={() => setOpen(s.id)}
            onBlur={() => setOpen((o) => (o === s.id ? null : o))}
          >
            <span className="tri-spot__icon">{s.icon}</span>
          </button>
          <AnimatePresence>
            {open === s.id && (
              <motion.div
                className="tri-spot__card"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <span className="tri-spot__nation">{s.nation}</span>
                <strong>{s.label}</strong>
                <p>{s.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
