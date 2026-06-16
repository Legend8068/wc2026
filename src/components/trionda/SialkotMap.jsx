import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

/* ============================================================================
   <SialkotMap /> — step 11, "Where it was made."
   Stylised globe with an arc sweeping to Sialkot, Pakistan — the city that
   hand-builds the majority of the world's match balls. `active` triggers the
   draw-on animation. (Schematic, token-coloured; swap for a real projection
   later if you want pixel-accurate borders.)
   ============================================================================ */
export default function SialkotMap({ active }) {
  return (
    <div className="tri-map" aria-hidden="true">
      <svg viewBox="0 0 600 360">
        <defs>
          <radialGradient id="triGlobe" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#1d3a5f" />
            <stop offset="100%" stopColor="#0a1018" />
          </radialGradient>
        </defs>

        {/* globe */}
        <circle cx="300" cy="180" r="150" fill="url(#triGlobe)" stroke="var(--gold)" strokeOpacity="0.25" />
        {/* latitude / longitude grid */}
        {[-60, -30, 0, 30, 60].map((lat, i) => (
          <ellipse key={`la${i}`} cx="300" cy="180" rx="150" ry={Math.abs(lat) ? 150 * Math.cos((lat * Math.PI) / 180) : 150}
            transform={`translate(0 ${lat * 1.6})`} fill="none" stroke="var(--slate)" strokeOpacity="0.25" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line key={`lo${i}`} x1="300" y1="30" x2="300" y2="330"
            transform={`rotate(${i * 45} 300 180)`} stroke="var(--slate)" strokeOpacity="0.18" />
        ))}

        {/* arc from "the world" to Sialkot */}
        <motion.path
          d="M150,150 Q300,40 392,168"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          animate={active ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {/* Sialkot pin (approx position on the schematic globe) */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 300, damping: 18 }}
          style={{ transformOrigin: '392px 168px' }}
        >
          <circle cx="392" cy="168" r="5" fill="var(--red-light)" />
          <motion.circle cx="392" cy="168" r="5" fill="none" stroke="var(--red-light)" strokeWidth="2"
            animate={active ? { r: [5, 22], opacity: [0.8, 0] } : {}}
            transition={{ duration: 1.6, repeat: Infinity }} />
        </motion.g>
      </svg>

      <div className="tri-map__label">
        <MapPin size={18} strokeWidth={2.5} />
        <div>
          <strong>Sialkot, Pakistan</strong>
          <span>Hand-built where the world’s footballs are made</span>
        </div>
      </div>
    </div>
  );
}
