import React, { useState, useCallback } from 'react';
import RevealSection from './RevealSection';
import BrandText from './BrandText';
import MapIcon from './MapIcon';

/* ──────────────────────────────────────────────────────────────
   FIFA World Cup 2026 host venues.
   Positions are percentages of the MapIcon viewBox (2816×1536),
   calibrated visually against the North-America silhouette so each
   dot lands on its real city. Match counts are the official FIFA
   allocation (sums to 104 across the 16 venues).
   ────────────────────────────────────────────────────────────── */
const COUNTRIES = {
  us: { name: 'United States', color: 'var(--blue)' },
  ca: { name: 'Canada', color: 'var(--red)' },
  mx: { name: 'Mexico', color: 'var(--green)' },
};

const VENUES = [
  // ── United States ──
  { id: 'atlanta', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', cc: 'us', matches: 8, note: 'SEMI-FINAL', left: 69.0, top: 59.7 },
  { id: 'boston', city: 'Boston', stadium: 'Gillette Stadium', cc: 'us', matches: 7, left: 81.4, top: 49.4 },
  { id: 'dallas', city: 'Dallas', stadium: 'AT&T Stadium', cc: 'us', matches: 9, note: 'SEMI-FINAL', left: 57.0, top: 61.0 },
  { id: 'houston', city: 'Houston', stadium: 'NRG Stadium', cc: 'us', matches: 7, left: 58.6, top: 64.8 },
  { id: 'kansas', city: 'Kansas City', stadium: 'Arrowhead Stadium', cc: 'us', matches: 6, left: 59.5, top: 53.1 },
  { id: 'la', city: 'Los Angeles', stadium: 'SoFi Stadium', cc: 'us', matches: 8, left: 40.9, top: 59.5 },
  { id: 'miami', city: 'Miami', stadium: 'Hard Rock Stadium', cc: 'us', matches: 7, note: 'THIRD PLACE', left: 70.4, top: 72.3 },
  { id: 'nynj', city: 'New York / New Jersey', stadium: 'MetLife Stadium', cc: 'us', matches: 8, note: 'FINAL', left: 78.8, top: 50.9 },
  { id: 'philadelphia', city: 'Philadelphia', stadium: 'Lincoln Financial Field', cc: 'us', matches: 6, left: 77.8, top: 52.0 },
  { id: 'sf', city: 'San Francisco Bay Area', stadium: "Levi's Stadium", cc: 'us', matches: 6, left: 40.2, top: 55.4 },
  { id: 'seattle', city: 'Seattle', stadium: 'Lumen Field', cc: 'us', matches: 6, left: 40.0, top: 42.6 },
  // ── Canada ──
  { id: 'toronto', city: 'Toronto', stadium: 'BMO Field', cc: 'ca', matches: 6, left: 73.5, top: 47.6 },
  { id: 'vancouver', city: 'Vancouver', stadium: 'BC Place', cc: 'ca', matches: 7, left: 37.6, top: 40.3 },
  // ── Mexico ──
  { id: 'mexico-city', city: 'Mexico City', stadium: 'Estadio Azteca', cc: 'mx', matches: 5, note: 'OPENING MATCH', left: 55.1, top: 77.8 },
  { id: 'guadalajara', city: 'Guadalajara', stadium: 'Estadio Akron', cc: 'mx', matches: 4, left: 51.0, top: 76.1 },
  { id: 'monterrey', city: 'Monterrey', stadium: 'Estadio BBVA', cc: 'mx', matches: 4, left: 53.5, top: 71.5 },
];

const TOTAL_MATCHES = VENUES.reduce((s, v) => s + v.matches, 0);

function Marker({ v, active, isLive, onEnter, onLeave }) {
  // Flip the info card to the opposite side near the map edges so it stays on-screen.
  const vSide = v.top < 24 ? 'below' : 'above';
  const hSide = v.left > 78 ? 'left' : v.left < 22 ? 'right' : 'center';

  return (
    <div
      className={`hm-marker hm-${v.cc} ${active ? 'is-active' : ''} ${isLive ? 'is-live' : ''}`}
      style={{ left: `${v.left}%`, top: `${v.top}%` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className="hm-dot"
        aria-label={`${v.stadium}, ${v.city} — ${v.matches} matches`}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        <span className="hm-ring" />
        <span className="hm-ring hm-ring2" />
        <span className="hm-core" />
      </button>

      <div className={`hm-card hm-card--${vSide} hm-card--${hSide}`} role="tooltip">
        {isLive && <span className="hm-live-tag">LIVE</span>}
        {v.note && !isLive && <span className="hm-note">{v.note}</span>}
        <span className="hm-stadium">{v.stadium}</span>
        <span className="hm-city">{v.city}</span>
        <span className="hm-meta">
          <span className="hm-flagdot" />
          {COUNTRIES[v.cc].name}
          <span className="hm-sep">·</span>
          <strong>{v.matches}</strong>&nbsp;{v.matches === 1 ? 'match' : 'matches'}
        </span>
      </div>
    </div>
  );
}

export default function HostMap({ snapshot }) {
  const [active, setActive] = useState(null);
  const [hoverCC, setHoverCC] = useState(null);
  const enter = useCallback((id) => () => setActive(id), []);
  const leave = useCallback(() => setActive(null), []);
  const ccEnter = useCallback((cc) => () => setHoverCC(cc), []);
  const ccLeave = useCallback(() => setHoverCC(null), []);

  return (
    <RevealSection id="venues" className="host-map-section">
      <div className="rule-head">
        <div className="rule l" />
        <div style={{ textAlign: 'center' }}>
          <BrandText text="HOST VENUES" className="section-brand-header" />
          <div className="section-brand-sub">16 CITIES · 3 NATIONS · 104 MATCHES</div>
        </div>
        <div className="rule r" />
      </div>

      <p className="hm-intro">
        The first 48 team World Cup is also the first one to span an entire continent and 3 countries.
        Hover a city to see its stadium and matchday load.
      </p>

      <div className={`hm-wrap ${active ? 'has-active' : ''} ${hoverCC ? 'hm-hover-' + hoverCC : ''}`}>
        {/* Three countries as separate, individually-coloured clip layers
            (the source SVG is one merged silhouette, so each country is a
            clipped copy tinted via currentColor). Alaska is a 4th US layer. */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="hm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a2f48" />
              <stop offset="100%" stopColor="#0c1520" />
            </linearGradient>
          </defs>
        </svg>

        <div className="hm-geo" aria-hidden="true">
          <MapIcon className="hm-map" />
        </div>

        <div className="hm-markers">
          {VENUES.map((v) => {
            let isLive = false;
            if (snapshot && snapshot.states) {
              const vName = v.stadium.toLowerCase();
              const cName = v.city.toLowerCase();
              Object.values(snapshot.states).forEach(st => {
                if ((st.status === 'live' || st.status === 'ht') && st.venue) {
                  const lv = st.venue.toLowerCase().trim();
                  if (lv.length > 2 && (lv.includes(vName) || lv.includes(cName) || vName.includes(lv) || cName.includes(lv))) {
                    isLive = true;
                  }
                }
              });
            }
            return (
              <Marker
                key={v.id}
                v={v}
                active={active === v.id}
                isLive={isLive}
                onEnter={enter(v.id)}
                onLeave={leave}
              />
            );
          })}
        </div>
      </div>

      <div className="hm-legend">
        {Object.entries(COUNTRIES).map(([cc, c]) => {
          const count = VENUES.filter((v) => v.cc === cc).length;
          return (
            <div key={cc} className={`hm-leg hm-${cc}`}>
              <span className="hm-leg-dot" />
              <span className="hm-leg-name">{c.name}</span>
              <span className="hm-leg-count">{count} {count === 1 ? 'city' : 'cities'}</span>
            </div>
          );
        })}
        <div className="hm-leg hm-leg--total">
          <span className="hm-leg-name">Total</span>
          <span className="hm-leg-count">{TOTAL_MATCHES} matches</span>
        </div>
      </div>
    </RevealSection>
  );
}
