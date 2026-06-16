import React from 'react';
import { motion } from 'framer-motion';

/* ============================================================================
   <ThenNowTimeline /> — step 12, "Then vs now."
   Scroll-scrubbed horizontal timeline from 1930 leather to 2026 AI. The parent
   passes a `t` (0→1) derived from this step's scroll window, which slides the
   rail and lights up each era as it reaches centre.
   ============================================================================ */
const ERAS = [
  { year: '1930', name: 'Tiento', note: 'Hand-stitched leather. Heavy when wet.', c: 'var(--rust, #b2402f)' },
  { year: '1970', name: 'Telstar', note: '32 panels — the iconic black & white.', c: 'var(--white)' },
  { year: '2006', name: 'Teamgeist', note: '14 thermally-bonded panels.', c: 'var(--blue)' },
  { year: '2022', name: 'Al Rihla', note: '20 panels + first connected-ball tech.', c: 'var(--green)' },
  { year: '2026', name: 'Trionda', note: '4 panels · 500Hz AI sensor.', c: 'var(--gold)' },
];

export default function ThenNowTimeline({ t = 0 }) {
  // slide the rail so the active era sits under the centre marker
  const active = Math.min(ERAS.length - 1, Math.round(t * (ERAS.length - 1)));
  const shift = -active * 260 + 0; // px per era card

  return (
    <div className="tri-tl">
      <div className="tri-tl__marker" />
      <motion.div className="tri-tl__rail" animate={{ x: shift }} transition={{ type: 'spring', stiffness: 90, damping: 20 }}>
        <div className="tri-tl__line" />
        {ERAS.map((e, i) => (
          <div key={e.year} className={`tri-tl__era ${i === active ? 'is-active' : ''}`} style={{ '--era': e.c }}>
            <span className="tri-tl__dot" />
            <span className="tri-tl__year">{e.year}</span>
            <strong className="tri-tl__name">{e.name}</strong>
            <span className="tri-tl__note">{e.note}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
