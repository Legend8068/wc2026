import React, { useState, useCallback, useRef } from 'react';
import LottieComponent from 'lottie-react';
const Lottie = LottieComponent.default || LottieComponent;
import arrowAnim from '../assets/Scroll_Right_Arrow.json';
import RevealSection from './RevealSection';
import BrandText from './BrandText';
import MapIcon from './MapIcon';
import SingaporeMapIcon from './SingaporeMapIcon';

/* ──────────────────────────────────────────────────────────────
   FIFA World Cup 2026 — HOST VENUES (North America)
   ────────────────────────────────────────────────────────────── */
const COUNTRIES = {
  us: { name: 'United States', color: 'var(--blue)' },
  ca: { name: 'Canada', color: 'var(--red)' },
  mx: { name: 'Mexico', color: 'var(--green)' },
};

const VENUES = [
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
  { id: 'toronto', city: 'Toronto', stadium: 'BMO Field', cc: 'ca', matches: 6, left: 73.5, top: 47.6 },
  { id: 'vancouver', city: 'Vancouver', stadium: 'BC Place', cc: 'ca', matches: 7, left: 37.6, top: 40.3 },
  { id: 'mexico-city', city: 'Mexico City', stadium: 'Estadio Azteca', cc: 'mx', matches: 5, note: 'OPENING MATCH', left: 55.1, top: 77.8 },
  { id: 'guadalajara', city: 'Guadalajara', stadium: 'Estadio Akron', cc: 'mx', matches: 4, left: 51.0, top: 76.1 },
  { id: 'monterrey', city: 'Monterrey', stadium: 'Estadio BBVA', cc: 'mx', matches: 4, left: 53.5, top: 71.5 },
];

const TOTAL_MATCHES = VENUES.reduce((s, v) => s + v.matches, 0);

/* ──────────────────────────────────────────────────────────────
   SINGAPORE screening venues
   Data sourced from WhereAh (whereah.com) — 77 free screening
   venues across Singapore for FIFA World Cup 2026.
   ────────────────────────────────────────────────────────────── */
const SG_TYPES = {
  cc:         { name: 'Community Club',        color: '#2a9d4f' },
  activesg:   { name: 'ActiveSG Sport Centre', color: '#2563eb' },
  safra:      { name: 'SAFRA Club',            color: '#e8505f' },
  special:    { name: 'Special Venue',         color: '#d97706' },
  hometeamns: { name: 'HomeTeamNS',            color: '#0d9488' },
};

const SG_VENUES = [
  { id: 'bishan-cc', name: 'Bishan Community Club', district: 'Central', type: 'cc', left: 50.63, top: 39.75 },
  { id: 'chengsan-cc', name: 'Cheng San Community Club', district: 'Central', type: 'cc', left: 50.46, top: 33.18 },
  { id: 'ciyuan-cc', name: 'Ci Yuan Community Club', district: 'Central', type: 'cc', left: 56.60, top: 32.21 },
  { id: 'fernvale-cc', name: 'Fernvale Community Club', district: 'Central', type: 'cc', left: 55.51, top: 27.31 },
  { id: 'jalanbesar-cc', name: 'Jalan Besar Community Club', district: 'Central', type: 'cc', left: 52.71, top: 51.99 },
  { id: 'lengkee-cc', name: 'Leng Kee Community Club', district: 'Central', type: 'cc', left: 43.98, top: 57.35 },
  { id: 'marymount-cc', name: 'Marymount Community Club', district: 'Central', type: 'cc', finalOnly: true, left: 48.93, top: 36.04 },
  { id: 'pekkio-cc', name: 'Pek Kio Community Club', district: 'Central', type: 'cc', finalOnly: true, left: 50.79, top: 50.48 },
  { id: 'potongpasir-cc', name: 'Potong Pasir Community Club', district: 'Central', type: 'cc', left: 53.67, top: 44.76 },
  { id: 'radinmas-cc', name: 'Radin Mas Community Club', district: 'Central', type: 'cc', left: 44.97, top: 61.45 },
  { id: 'telokblangah-cc', name: 'Telok Blangah Community Club', district: 'Central', type: 'cc', left: 42.78, top: 61.75 },
  { id: 'tpyeast-cc', name: 'Toa Payoh East Community Club', district: 'Central', type: 'cc', finalOnly: true, left: 51.40, top: 43.64 },
  { id: 'tpywest-cc', name: 'Toa Payoh West Community Club', district: 'Central', type: 'cc', left: 49.58, top: 43.91 },
  { id: 'yiochukang-cc', name: 'Yio Chu Kang Community Club', district: 'Central', type: 'cc', left: 48.95, top: 30.32 },
  { id: 'buangkok-cc', name: 'Buangkok Community Club', district: 'North East', type: 'cc', finalOnly: true, left: 58.31, top: 29.76 },
  { id: 'pasirrise-cc', name: 'Pasir Ris East Community Club', district: 'North East', type: 'cc', left: 70.65, top: 34.12 },
  { id: 'pasirriseelias', name: 'Pasir Ris Elias Community Club', district: 'North East', type: 'cc', left: 67.57, top: 31.23 },
  { id: 'onepunggol', name: 'One Punggol', district: 'North East', type: 'cc', left: 60.69, top: 22.33 },
  { id: 'oth', name: 'Our Tampines Hub', district: 'North East', type: 'cc', left: 67.06, top: 38.57 },
  { id: 'rivervale-cc', name: 'Rivervale Community Club', district: 'North East', type: 'cc', finalOnly: true, left: 60.17, top: 29.23 },
  { id: 'sengkang-cc', name: 'Sengkang Community Club', district: 'North East', type: 'cc', left: 58.62, top: 26.99 },
  { id: 'tampinese-cc', name: 'Tampines East Community Club', district: 'North East', type: 'cc', left: 69.80, top: 38.60 },
  { id: 'tampinesn-cc', name: 'Tampines North Community Club', district: 'North East', type: 'cc', left: 68.33, top: 37.42 },
  { id: 'ace-cc', name: 'ACE The Place Community Club', district: 'North West', type: 'cc', left: 39.89, top: 16.76 },
  { id: 'bukitpanjang-cc', name: 'Bukit Panjang Community Club', district: 'North West', type: 'cc', left: 35.91, top: 31.79 },
  { id: 'bukittimah-cc', name: 'Bukit Timah Community Club', district: 'North West', type: 'cc', left: 36.09, top: 42.41 },
  { id: 'neesooneast-cc', name: 'Nee Soon East Community Club', district: 'North West', type: 'cc', left: 48.42, top: 15.73 },
  { id: 'neesoonsouth-cc', name: 'Nee Soon South Community Club', district: 'North West', type: 'cc', left: 47.72, top: 20.38 },
  { id: 'woodlands-cc', name: 'Woodlands Community Club', district: 'North West', type: 'cc', left: 39.15, top: 13.16 },
  { id: 'woodlandsg-cc', name: 'Woodlands Galaxy Community Club', district: 'North West', type: 'cc', left: 41.80, top: 13.37 },
  { id: 'zhenghua-cc', name: 'Zhenghua Community Club', district: 'North West', type: 'cc', left: 36.08, top: 28.76 },
  { id: 'braddell-cc', name: 'Braddell Heights Community Club', district: 'South East', type: 'cc', left: 54.29, top: 39.13 },
  { id: 'changisimei-cc', name: 'Changi Simei Community Club', district: 'South East', type: 'cc', left: 69.90, top: 41.11 },
  { id: 'eunos-cc', name: 'Eunos Community Club', district: 'South East', type: 'cc', left: 62.53, top: 44.74 },
  { id: 'fengshan-cc', name: 'Fengshan Community Club', district: 'South East', type: 'cc', left: 66.49, top: 45.30 },
  { id: 'geylangserai-cc', name: 'Geylang Serai Community Club', district: 'South East', type: 'cc', finalOnly: true, left: 59.12, top: 49.48 },
  { id: 'hougang-cc', name: 'Hougang Community Club', district: 'South East', type: 'cc', left: 58.38, top: 35.24 },
  { id: 'kakibukit-cc', name: 'Kaki Bukit Community Club', district: 'South East', type: 'cc', left: 64.68, top: 44.50 },
  { id: 'kcccc', name: 'Kampong Chai Chee Community Club', district: 'South East', type: 'cc', left: 65.57, top: 46.39 },
  { id: 'macpherson-cc', name: 'MacPherson Community Club', district: 'South East', type: 'cc', left: 56.89, top: 47.42 },
  { id: 'plkovan-cc', name: 'Paya Lebar Kovan Community Club', district: 'South East', type: 'cc', left: 57.19, top: 37.31 },
  { id: 'siglap-cc', name: 'Siglap Community Club', district: 'South East', type: 'cc', finalOnly: true, left: 68.35, top: 49.25 },
  { id: 'serangoon-cc', name: 'The Serangoon Community Club', district: 'South East', type: 'cc', left: 54.94, top: 33.68 },
  { id: 'ayerrajah-cc', name: 'Ayer Rajah Community Club', district: 'South West', type: 'cc', finalOnly: true, left: 31.66, top: 48.21 },
  { id: 'boonlay-cc', name: 'Boon Lay Community Club', district: 'South West', type: 'cc', left: 25.01, top: 40.11 },
  { id: 'bukitbatok-cc', name: 'Bukit Batok Community Club', district: 'South West', type: 'cc', left: 32.04, top: 39.96 },
  { id: 'bukitbatoke-cc', name: 'Bukit Batok East Community Club', district: 'South West', type: 'cc', finalOnly: true, left: 33.63, top: 39.90 },
  { id: 'cck-cc', name: 'Chua Chu Kang Community Club', district: 'South West', type: 'cc', left: 32.47, top: 30.41 },
  { id: 'clementi-cc', name: 'Clementi Community Club', district: 'South West', type: 'cc', left: 35.47, top: 48.80 },
  { id: 'hongkahnorth-cc', name: 'Hong Kah North Community Club', district: 'South West', type: 'cc', left: 32.02, top: 36.92 },
  { id: 'juronggreen-cc', name: 'Jurong Green Community Club', district: 'South West', type: 'cc', left: 27.57, top: 39.43 },
  { id: 'jurongspring-cc', name: 'Jurong Spring Community Club', district: 'South West', type: 'cc', finalOnly: true, left: 26.26, top: 40.11 },
  { id: 'keathong-cc', name: 'Keat Hong Community Club', district: 'South West', type: 'cc', left: 31.18, top: 29.55 },
  { id: 'nanyang-cc', name: 'Nanyang Community Club', district: 'South West', type: 'cc', left: 21.49, top: 41.85 },
  { id: 'tamanjurong-cc', name: 'Taman Jurong Community Club', district: 'South West', type: 'cc', left: 26.88, top: 43.94 },
  { id: 'tengah-cc', name: 'Tengah Community Club', district: 'South West', type: 'cc', left: 29.26, top: 37.60 },
  { id: 'frontier-cc', name: 'The Frontier Community Club', district: 'South West', type: 'cc', left: 23.73, top: 42.41 },
  { id: 'westcoast-cc', name: 'West Coast Community Club', district: 'South West', type: 'cc', left: 34.84, top: 53.58 },
  { id: 'yuhua-cc', name: 'Yuhua Community Club', district: 'South West', type: 'cc', finalOnly: true, left: 29.74, top: 42.55 },
  { id: 'canberra-asg', name: 'Bukit Canberra Sport Centre', district: 'North West', type: 'activesg', left: 45.53, top: 10.63 },
  { id: 'sengkang-asg', name: 'Sengkang Sport Centre', district: 'North East', type: 'activesg', left: 57.13, top: 26.19 },
  { id: 'pasirris-asg', name: 'Pasir Ris Sport Centre', district: 'North East', type: 'activesg', left: 69.29, top: 32.41 },
  { id: 'clementi-asg', name: 'Clementi Sport Centre', district: 'South West', type: 'activesg', left: 34.86, top: 51.10 },
  { id: 'cck-asg', name: 'Choa Chu Kang Sport Centre', district: 'North West', type: 'activesg', left: 31.73, top: 27.61 },
  { id: 'kallang', name: 'Kallang Wave Mall', district: 'Central', type: 'special', finalOnly: true, aircon: true, note: 'SEMI-FINALS & FINAL', left: 55.27, top: 53.82 },
  { id: 'laupasat', name: 'Lau Pa Sat', district: 'Central', type: 'special', note: 'MATCHES 1–24', left: 50.59, top: 60.01 },
  { id: 'changi-t3', name: 'Changi Airport T3 (ST3PS)', district: 'North East', type: 'special', aircon: true, note: 'MATCHES 1–54', left: 76.23, top: 37.13 },
  { id: 'safra-cck', name: 'SAFRA Choa Chu Kang', district: 'North West', type: 'safra', left: 31.62, top: 28.26 },
  { id: 'safra-jurong', name: 'SAFRA Jurong', district: 'South West', type: 'safra', left: 24.07, top: 43.88 },
  { id: 'safra-mtfaber', name: 'SAFRA Mount Faber', district: 'Central', type: 'safra', left: 44.55, top: 60.92 },
  { id: 'safra-punggol', name: 'SAFRA Punggol', district: 'North East', type: 'safra', left: 60.87, top: 21.86 },
  { id: 'safra-tampines', name: 'SAFRA Tampines', district: 'North East', type: 'safra', left: 67.45, top: 41.20 },
  { id: 'safra-tpy', name: 'SAFRA Toa Payoh', district: 'Central', type: 'safra', left: 51.35, top: 45.41 },
  { id: 'safra-yishun', name: 'SAFRA Yishun', district: 'North West', type: 'safra', left: 48.91, top: 17.73 },
  { id: 'htns-khatib', name: 'HomeTeamNS Khatib', district: 'North West', type: 'hometeamns', note: '52 MATCHES', left: 47.09, top: 20.62 },
  { id: 'htns-bedok', name: 'HomeTeamNS Bedok Reservoir', district: 'North East', type: 'hometeamns', note: '10 MATCHES', left: 63.34, top: 42.11 },
  { id: 'htns-bb', name: 'HomeTeamNS Bukit Batok', district: 'South West', type: 'hometeamns', note: '3 MATCHES', left: 32.19, top: 34.95 }
];

const SG_TOTAL = SG_VENUES.length;

/* ── Shared Marker (host venues) ── */
function Marker({ v, active, isLive, onEnter, onLeave }) {
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

/* ── Singapore venue Marker ── */
function SgMarker({ v, active, isLive, onEnter, onLeave }) {
  const vSide = v.top < 24 ? 'below' : 'above';
  const hSide = v.left > 82 ? 'left' : v.left < 18 ? 'right' : 'center';

  return (
    <div
      className={`hm-marker hm-sg-${v.type} ${active ? 'is-active' : ''} ${v.finalOnly ? 'is-dim' : ''} ${isLive ? 'is-live' : ''}`}
      style={{ left: `${v.left}%`, top: `${v.top}%` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className="hm-dot hm-dot--sg"
        aria-label={`${v.name}, ${v.district}`}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        <span className="hm-ring" />
        <span className="hm-ring hm-ring2" />
        <span className="hm-core" />
      </button>

      <div className={`hm-card hm-card--${vSide} hm-card--${hSide}`} role="tooltip">
        {isLive && <span className="hm-live-tag">LIVE</span>}
        {v.finalOnly && !isLive && <span className="hm-note">FINAL ONLY</span>}
        {v.note && !isLive && <span className="hm-note">{v.note}</span>}
        <span className="hm-stadium">{v.name}</span>
        <span className="hm-city">{v.district}</span>
        <span className="hm-meta">
          <span className="hm-flagdot" />
          {SG_TYPES[v.type].name}
          {v.aircon && <><span className="hm-sep">·</span>❄ Air-Con</>}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ── */
const HostMap = React.memo(function HostMap({ snapshot }) {
  const [active, setActive] = useState(null);
  const [hoverCC, setHoverCC] = useState(null);
  const [mapView, setMapView] = useState('host');        // 'host' | 'sg'

  const enter  = useCallback((id) => () => setActive(id), []);
  const leave  = useCallback(() => setActive(null), []);
  const ccEnter = useCallback((cc) => () => setHoverCC(cc), []);
  const ccLeave = useCallback(() => setHoverCC(null), []);

  const toggleMap = useCallback(() => {
    setActive(null);
    setHoverCC(null);
    setMapView(prev => (prev === 'host' ? 'sg' : 'host'));
  }, []);

  const isHost = mapView === 'host';

  return (
    <RevealSection id="venues" className="host-map-section">
      {/* ── Section header ── */}
      <div className="rule-head">
        <div className="rule l" />
        <div style={{ textAlign: 'center' }}>
          <BrandText text="VENUES" className="section-brand-header" />
          <div className="section-brand-sub">
            {isHost
              ? '16 CITIES · 3 NATIONS · 104 MATCHES'
              : `${SG_TOTAL} VENUES · FREE SCREENINGS · SINGAPORE`}
          </div>
        </div>
        <div className="rule r" />
      </div>

      <p className="hm-intro">
        {isHost
          ? 'The first 48 team World Cup is also the first one to span an entire continent and 3 countries. Hover a city to see its stadium and matchday load.'
          : 'Free live screenings across Singapore — from Community Clubs and Sport Centres to Kallang Wave Mall and Lau Pa Sat. Hover a venue to see details.'}
      </p>

      {/* Always-available gradient def */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="hm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a2f48" />
            <stop offset="100%" stopColor="#0c1520" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Map container ── */}
      <div className={`hm-wrap ${isHost ? '' : 'hm-wrap--sg'} ${active ? 'has-active' : ''} ${hoverCC ? 'hm-hover-' + hoverCC : ''}`}>
        
        {/* Navigation Arrows on sides */}
        {!isHost && (
          <AnimatedArrow
            direction="left"
            onClick={toggleMap}
            ariaLabel="Back to Host Venues"
          />
        )}
        {isHost && (
          <AnimatedArrow
            direction="right"
            onClick={toggleMap}
            ariaLabel="View Singapore Screenings"
          />
        )}

        <div className={`hm-view-side ${isHost ? 'is-active' : ''}`}>
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
                  if (['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status) && st.venue) {
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

        <div className={`hm-view-side ${!isHost ? 'is-active' : ''}`}>
          <div className="hm-geo" aria-hidden="true">
            <SingaporeMapIcon className="hm-map hm-map--sg" />
          </div>
          <div className="hm-markers">
            {(() => {
              let anyLive = false;
              let isFinalOrSemiLive = false;
              if (snapshot && snapshot.states) {
                Object.entries(snapshot.states).forEach(([k, st]) => {
                  if (['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status)) {
                    anyLive = true;
                    if (['M101', 'M102', 'M103', 'M104'].includes(k)) {
                      isFinalOrSemiLive = true;
                    }
                  }
                });
              }
              
              return SG_VENUES.map((v) => {
                const isSgLive = anyLive && (!v.finalOnly || isFinalOrSemiLive);
                return (
                  <SgMarker
                    key={v.id}
                    v={v}
                    active={active === v.id}
                    isLive={isSgLive}
                    onEnter={enter(v.id)}
                    onLeave={leave}
                  />
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ── Navigation label & dots ── */}
      <div className="hm-nav">
        <div className="hm-nav-label">{isHost ? 'Host Venues' : 'Singapore Screenings'}</div>
        <div className="hm-nav-dots">
          <span className={`hm-nav-dot ${isHost ? 'active' : ''}`} onClick={() => !isHost && toggleMap()} style={{cursor:'pointer'}} />
          <span className={`hm-nav-dot ${!isHost ? 'active' : ''}`} onClick={() => isHost && toggleMap()} style={{cursor:'pointer'}} />
        </div>
      </div>

      {/* ── Legend ── */}
      {isHost ? (
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
      ) : (
        <div className="hm-legend">
          {Object.entries(SG_TYPES).map(([type, t]) => {
            const count = SG_VENUES.filter((v) => v.type === type).length;
            return (
              <div key={type} className={`hm-leg hm-sg-${type}`}>
                <span className="hm-leg-dot" />
                <span className="hm-leg-name">{t.name}</span>
                <span className="hm-leg-count">{count}</span>
              </div>
            );
          })}
          <div className="hm-leg hm-leg--total">
            <span className="hm-leg-name">Total</span>
            <span className="hm-leg-count">{SG_TOTAL} venues</span>
          </div>
        </div>
      )}
    </RevealSection>
  );
});

const AnimatedArrow = ({ direction, onClick, ariaLabel }) => {
  const lottieRef = useRef(null);
  const [isClicked, setIsClicked] = useState(false);

  // Loop the arrow animation continuously while hovered; reset when the
  // pointer leaves.
  const handleEnter = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
    }
  };

  const handleLeave = () => {
    if (lottieRef.current) {
      lottieRef.current.stop();
    }
  };

  const handleClick = (e) => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 250);
    onClick(e);
  };

  const rotation = direction === 'left' ? 'rotate(90deg)' : 'rotate(-90deg)';

  return (
    <button
      className={`hm-side-arrow hm-side-arrow--${direction} ${isClicked ? 'is-clicked' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-label={ariaLabel}
    >
      <span className="hm-side-arrow-icon" style={{ transform: rotation }}>
        <Lottie lottieRef={lottieRef} animationData={arrowAnim} loop autoplay={false} />
      </span>
    </button>
  );
};

export default HostMap;
