import React, { useState, useEffect, useRef } from 'react';
import BrandText from './BrandText';
import InteractiveBall from './InteractiveBall';
import MapIcon from './MapIcon';

function scrollToVenues() {
  const el = document.getElementById('venues');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function InteractiveHeroMap() {
  const mapRef = useRef(null);
  const boundsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);
  
  const handlePointerEnter = () => {
    if (!mapRef.current) return;
    boundsRef.current = mapRef.current.getBoundingClientRect();
  };

  const handlePointerMove = (e) => {
    if (!mapRef.current) return;
    if (!boundsRef.current) boundsRef.current = mapRef.current.getBoundingClientRect();

    const { left, top, width, height } = boundsRef.current;
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const rotateX = (0.5 - y) * 30;
    const rotateY = (x - 0.5) * 30;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!mapRef.current) return;
      mapRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
  };
  
  const handlePointerLeave = () => {
    boundsRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!mapRef.current) return;
    mapRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div 
      ref={mapRef}
      className="hero-map-wrapper"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <MapIcon
        className="hero-map"
        role="button"
        tabIndex={0}
        aria-label="Jump to host venues"
        title="View host venues"
        onClick={scrollToVenues}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToVenues(); } }}
        style={{ margin: 0 }}
      />
    </div>
  );
}

function StatNumber({ value, isDate, animate }) {
  const [count, setCount] = useState(isDate ? value : 0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isDate) return;
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = parseInt(value, 10);
    if (reduced || isNaN(target)) {
      const raf = requestAnimationFrame(() => setCount(value));
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();
    const duration = 1400;
    let raf = 0;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // cubic ease out: 1 - (1 - p)^3
      const currentVal = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      setCount(currentVal);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, isDate, animate]);

  if (isDate) {
    return <div className="stat-num small">{value}</div>;
  }

  return <div className="stat-num">{count}</div>;
}

const Hero = React.memo(function Hero() {
  const statsLabelRef = useRef(null);
  const [statsRevealed, setStatsRevealed] = useState(false);

  useEffect(() => {
    if (statsRevealed) return;

    let raf = 0;
    const revealWhenReady = () => {
      if (document.querySelector('.loading-screen')) {
        raf = requestAnimationFrame(revealWhenReady);
        return;
      }
      setStatsRevealed(true);
    };

    revealWhenReady();

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [statsRevealed]);

  return (
    <header className="hero">
      <div className="hero-title">
        <div className="hero-kicker">FIFA WORLD CUP</div>
        <BrandText text="2026" className="hero-brand-year" useBallForZero={true} />
        <BrandText text="USA · CANADA · MEXICO" className="hero-brand-hosts" />
        <InteractiveHeroMap />
      </div>

      <InteractiveBall />

      <div className="hero-stats">
        <div ref={statsLabelRef} className="hero-stats-label">THE TOURNAMENT AT A GLANCE</div>
        <div className="stats-grid">
          <div className="stat">
            <StatNumber value={48} animate={statsRevealed} />
            <div className="stat-label">NATIONS</div>
          </div>
          <div className="stat">
            <StatNumber value={104} animate={statsRevealed} />
            <div className="stat-label">MATCHES</div>
          </div>
          <div className="stat">
            <StatNumber value={16} animate={statsRevealed} />
            <div className="stat-label">HOST CITIES</div>
          </div>
          <div className="stat">
            <StatNumber value="JUN 12 - JUL 20" isDate />
            <div className="stat-label">2026 · 3 HOST NATIONS</div>
          </div>
        </div>
      </div>

      <div className="waves">
        <svg className="wave wave-back" viewBox="0 0 2800 90" preserveAspectRatio="none">
          <path fill="rgba(51,102,255,0.3)" d="M0,66 c160,-12 300,-6 460,2 c160,8 300,-12 460,-2 c160,10 320,4 480,0 c160,-12 300,-6 460,2 c160,8 300,-12 460,-2 c160,10 320,4 480,0 L2800,90 L0,90 Z" />
        </svg>

        <div className="floating-footballs">
          {/* Football 1 */}
          <div className="wave-football-wrapper fb-1">
            <svg className="wave-football spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 7.38 3.32" />
              <path d="M12 22a10 10 0 0 0 7.38-3.32" />
              <polygon points="12 7 8 10 9.5 15 14.5 15 16 10" />
              <path d="M12 7V2" />
              <path d="M16 10l4.5-2" />
              <path d="M8 10L3.5 8" />
              <path d="M14.5 15l2.5 5" />
              <path d="M9.5 15l-2.5 5" />
            </svg>
          </div>
          {/* Corner Flag */}
          <div className="wave-football-wrapper fb-2">
            <svg className="wave-football" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="22" x2="6" y2="2" />
              <path d="M6 2 C 10 2 14 5 18 7 C 14 9 10 12 6 12 Z" fill="currentColor" fillOpacity="0.3" />
              <path d="M6 2 C 10 2 14 5 18 7 C 14 9 10 12 6 12 Z" />
            </svg>
          </div>
          {/* Trophy */}
          <div className="wave-football-wrapper fb-3">
            <svg className="wave-football" xmlns="http://www.w3.org/2000/svg" viewBox="20 10 60 75" fill="currentColor">
              <path d="M47.4,56.7c0.3,0.3,0.5,0.5,0.7,0.7c1.9,2.8,4.1,5.5,5.8,8.5c3.2,5.6,4.7,11.7,4.1,18.2c-0.3,3.2-1.8,5.7-4.9,7.1  c-0.2,0.1-0.4,0.2-0.8,0.4c3,0.2,5.6-0.2,8.1-1.4c2.3-1.1,3.4-2.9,3.4-5.4c0-1,0-2-0.2-3C62.4,74.9,60,68.4,56,62.7  c-1.7-2.5-3.8-4.7-5.7-7.1c-2.4-3.1-4.2-6.4-4.7-10.3c-0.2-1.6,0-3.2,0-4.7c-2.5,2.7-5.5,3-8.6,1.8c0.8,2.1,1.8,4.3,2.3,6.5  c0.5,2.3,0.6,4.7-0.9,6.9c1-0.2,2-0.5,2.7-1c0.8-0.5,1.3-1.3,2-2c0.7,2.6,0.3,5.2-1.5,7.8C44.2,60.1,46.3,59.2,47.4,56.7z"/>
              <path d="M54.6,54.5c0.1-0.1,0.1-0.1,0.2-0.2c-0.1-0.3-0.3-0.6-0.3-1c-0.1-0.7-0.3-1.4-0.1-2c0.1-0.9,0.9-1.4,1.8-1.2  c0.9,0.1,1.3,0.7,1.3,1.5c0,0.6-0.1,1.1,0,1.7c0,0.3,0.2,0.7,0.4,0.8c0.2,0.1,0.6,0,0.8-0.2c0.2-0.1,0.4-0.4,0.6-0.6  c1.4-1.8,2.8-3.5,4-5.4c1.7-2.5,3.3-5.1,4-8.1c0.8-3.4-0.7-5.9-4-6.6c-0.9-0.2-1.8-0.3-2.6-0.2c-5.3,0.6-9.3,3.2-11.7,8  c-2.5,5.1-0.3,10.9,4.7,13.2C53.9,54.3,54.3,54.4,54.6,54.5z"/>
              <path d="M45.8,29.4c0-0.5-0.1-1.3-0.2-2.2c-0.4-2.6-1.2-4.9-3.2-6.7c-2-1.8-4.6-1.9-6.5,0c-0.9,0.9-1.6,1.9-2.1,3  c-1.3,2.8-1.5,5.7-1.1,8.7c0.4,2.4,1.1,4.6,2.8,6.3c2.2,2.3,5.1,2.3,7.2-0.1c0.6-0.6,1-1.4,1.4-2.1C45.4,34.3,45.7,32,45.8,29.4z"/>
              <path d="M61,27.4c0.8-0.1,1.3-0.1,1.8-0.2c4-0.7,5.6-3.8,3.9-7.5c-2.1-4.6-8.3-8.4-13.5-8.1c-4.8,0.3-6.8,3.8-4.6,8.1  c0,0.1,0.1,0.2,0.1,0.2C51.7,24.6,56,26.9,61,27.4z"/>
              <path d="M48.5,76c0.8,0.3,1.4,0,2-0.4c1.6-1.1,2.5-2.7,3.2-4.5c0.3-0.8,0.3-1.5-0.1-2.2c-1.8-2.8-3.6-5.6-5.5-8.4  c-0.2-0.3-0.4-0.4-0.6-0.7c-0.5,0.4-0.9,0.8-1.4,1c-0.7,0.3-1,0.8-1,1.6c-0.1,2.8-0.4,5.6-0.4,8.3c0,1.1,0.4,2.2,0.7,3.3  c0.1,0.3,0.4,0.6,0.6,0.9c0.1,0,0.2,0,0.3,0c0.2-0.6,0.3-1.2,0.5-1.8c0.4-1.3,1.3-1.7,2.3-1.3c1.1,0.4,1.4,1.4,0.7,2.6  C49.3,74.9,48.9,75.4,48.5,76z"/>
              <path d="M55.6,74.5c-0.1,4.1-1.7,7.4-4.7,10.2c-3,2.8-6.5,4.1-10.8,3.6c1.8,1.5,3.7,2.2,5.8,2.5c5.2,0.8,9.1-1.9,10.1-7  C56.8,80.7,56.4,77.6,55.6,74.5z"/>
              <path d="M54.5,73.9c-0.1,0-0.2-0.1-0.3-0.1c-0.1,0.1-0.2,0.2-0.2,0.3c-3,5.3-7.4,8.6-13.5,9.6c-0.2,0-0.5,0.3-0.6,0.6  c-0.2,0.9,0.3,1.8,1.2,2.1c0.7,0.2,1.5,0.3,2.1,0.1c5.2-1.1,8.7-4.2,10.5-9.2C54.1,76.1,54.2,75,54.5,73.9z"/>
              <path d="M48.4,24.6c1,3.5,1.1,6.9,0.3,10.5c2.6-2.6,5.6-4.2,9.1-5.1C54.2,29,51.2,27.2,48.4,24.6z"/>
              <path d="M69,23.4c-0.3,3.4-2.3,5.6-5.6,6.7c3.2,1,5.2,2.9,5.8,6.2C70.6,31.9,70.6,27.6,69,23.4z"/>
              <path d="M37.4,17.8c3-1.1,5.6-0.3,8.1,1.9c-0.6-3.5,0.3-6.1,3-8.1C44,12.3,40.3,14.4,37.4,17.8z"/>
              <path d="M42.7,71c-0.8,3.7-1.6,7.1-2.4,10.8C43.6,78.6,42.9,74.9,42.7,71z"/>
              <path d="M46.3,20.6c-0.2,0.4-0.5,0.6-0.4,0.8c0.1,0.2,0.4,0.4,0.6,0.4c0.1,0,0.4-0.3,0.4-0.5C46.9,21.1,46.6,21,46.3,20.6z"/>
              <path d="M61.8,29.3c-0.2,0.4-0.5,0.6-0.4,0.8c0.1,0.2,0.4,0.4,0.6,0.4c0.1,0,0.4-0.3,0.4-0.5C62.3,29.9,62,29.7,61.8,29.3z"/>
              <path d="M46.7,39.5c0.2-0.4,0.5-0.6,0.5-0.8c0-0.2-0.3-0.4-0.5-0.5c-0.1,0-0.4,0.3-0.4,0.5C46.2,38.9,46.4,39.1,46.7,39.5z"/>
            </svg>
          </div>
          {/* Goal Post */}
          <div className="wave-football-wrapper fb-4">
            <svg className="wave-football" xmlns="http://www.w3.org/2000/svg" viewBox="5 20 90 55" fill="currentColor">
              <path d="M92.1132812,25.3334961H8.5703125c-1.3808594,0-2.5,1.1191406-2.5,2.5v43.2700195c0,1.3808594,1.1191406,2.5,2.5,2.5  s2.5-1.1191406,2.5-2.5v-0.654541l9.8193359-11.7624512h58.9042969l9.8193359,11.7624512v0.654541  c0,1.3808594,1.1191406,2.5,2.5,2.5s2.5-1.1191406,2.5-2.5V27.8334961  C94.6132812,26.4526367,93.4941406,25.3334961,92.1132812,25.3334961z M89.6132812,32.7493896l-0.7843628-0.9408569  l0.7843628-0.5196533V32.7493896z M88.1005859,32.2910156l0.5189819-0.343811l0.9937134,1.1919556v8.249939l-3.5407104-4.2471924  l0.5299683-2.6257935C86.7841797,33.6118164,87.3310547,32.8007812,88.1005859,32.2910156z M14.9370117,54.3899536  l-3.8666992,4.6381226v-8.6090698l3.8666992-4.6381226V54.3899536z M11.0703125,50.0280762v-8.2492065l3.6045532-4.3236694  l0.262146,1.2988281v6.6359253L11.0703125,50.0280762z M17.4549561,36.0668945h3.9620361v6.9501953h-2.559082L17.4549561,36.0668945  z M16.0154419,44.0963745l-0.8284302,0.9937134v-5.0975952L16.0154419,44.0963745z M15.1870117,45.4810181l0.8919678-1.0698853  l1.3990479,6.9308472l-2.2910156,2.7481079V45.4810181z M18.9083862,43.2670898h2.508606v6.949707h-1.1057739L18.9083862,43.2670898  z M72.0664062,43.0170898v-6.9501953h6.9501953v6.9501953H72.0664062z M79.0166016,43.2670898v6.949707h-6.9501953v-6.949707  H79.0166016z M64.8671875,43.0170898v-6.9501953h6.9492188v6.9501953H64.8671875z M71.8164062,43.2670898v6.949707h-6.9492188  v-6.949707H71.8164062z M64.8671875,35.8168945v-5.4833984h6.9492188v5.4833984H64.8671875z M57.6669922,43.0170898v-6.9501953  h6.9501953v6.9501953H57.6669922z M64.6171875,43.2670898v6.949707h-6.9501953v-6.949707H64.6171875z M57.6669922,35.8168945  v-5.4833984h6.9501953v5.4833984H57.6669922z M50.4667969,43.0170898v-6.9501953h6.9501953v6.9501953H50.4667969z   M57.4169922,43.2670898v6.949707h-6.9501953v-6.949707H57.4169922z M50.4667969,35.8168945v-5.4833984h6.9501953v5.4833984  H50.4667969z M43.2666016,43.0170898v-6.9501953h6.9501953v6.9501953H43.2666016z M50.2167969,43.2670898v6.949707h-6.9501953  v-6.949707H50.2167969z M43.2666016,35.8168945v-5.4833984h6.9501953v5.4833984H43.2666016z M36.0668945,43.0170898v-6.9501953  h6.949707v6.9501953H36.0668945z M43.0166016,43.2670898v6.949707h-6.949707v-6.949707H43.0166016z M36.0668945,35.8168945  v-5.4833984h6.949707v5.4833984H36.0668945z M28.8666992,43.0170898v-6.9501953h6.9501953v6.9501953H28.8666992z   M35.8168945,43.2670898v6.949707h-6.9501953v-6.949707H35.8168945z M28.8666992,35.8168945v-5.4833984h6.9501953v5.4833984  H28.8666992z M21.6669922,43.0170898v-6.9501953h6.949707v6.9501953H21.6669922z M28.6166992,43.2670898v6.949707h-6.949707  v-6.949707H28.6166992z M21.6669922,35.8168945v-5.4833984h6.949707v5.4833984H21.6669922z M28.6166992,50.4667969v5.2197266  h-6.949707v-5.2197266H28.6166992z M28.8666992,50.4667969h6.9501953v5.2197266h-6.9501953V50.4667969z M36.0668945,50.4667969  h6.949707v5.2197266h-6.949707V50.4667969z M43.2666016,50.4667969h6.9501953v5.2197266h-6.9501953V50.4667969z   M50.4667969,50.4667969h6.9501953v5.2197266h-6.9501953V50.4667969z M57.6669922,50.4667969h6.9501953v5.2197266h-6.9501953  V50.4667969z M64.8671875,50.4667969h6.9492188v5.2197266h-6.9492188V50.4667969z M72.0664062,50.4667969h6.9501953v5.2197266  h-6.9501953V50.4667969z M72.0664062,35.8168945v-5.4833984h6.9501953v5.4833984H72.0664062z M81.8254395,43.0170898h-2.5588379  v-6.9501953h3.9616699L81.8254395,43.0170898z M79.2666016,43.2670898h2.5083618l-1.40271,6.949707h-1.1056519V43.2670898z   M84.6052246,44.4116211l0.8918457,1.0698242v8.6102905l-2.2910156-2.7481079L84.6052246,44.4116211z M84.6685181,44.0979004  l0.8285522-4.1048584v5.0986938L84.6685181,44.0979004z M85.7470703,45.7813721l3.8662109,4.6376343v8.6102295l-3.8662109-4.6376343  V45.7813721z M85.7470703,45.3916016v-6.637146l0.262146-1.2987671l3.6040649,4.3231812v8.2503662L85.7470703,45.3916016z   M83.6611328,33.9223633l-0.3823853,1.8945312h-4.012146v-5.4833984h6.4777222  C84.6790771,31.2667236,83.9466553,32.5109863,83.6611328,33.9223633z M21.4169922,30.3334961v5.4833984H17.40448  l-0.3825073-1.8950195c-0.2854614-1.4116821-1.0174561-2.6555786-2.0819092-3.5883789H21.4169922z M14.6113281,37.1405029  l-3.5410156,4.2474365v-8.2487183l0.9938354-1.1921997l0.5193481,0.3439941  c0.7802734,0.5170898,1.3125,1.3071289,1.4980469,2.2250977L14.6113281,37.1405029z M11.854187,31.8079834l-0.7838745,0.9403076  v-1.4595337L11.854187,31.8079834z M11.0703125,59.4190063l3.8666992-4.6381226v6.3554688l-3.8666992,4.6320801V59.4190063z   M15.1870117,60.836853v-6.355835l2.3545532-2.8243408l1.0337524,5.1211548L15.1870117,60.836853z M20.3616943,50.4667969h1.0552979  v5.2197266h-0.0016479L20.3616943,50.4667969z M79.2682495,55.6865234h-0.0016479v-5.2197266h1.0551758L79.2682495,55.6865234z   M83.1427002,51.6573486l2.3543701,2.8240967v6.3552246l-3.3878784-4.0587769L83.1427002,51.6573486z M85.7470703,61.1362305  v-6.3548584l3.8662109,4.6376343v6.3490601L85.7470703,61.1362305z"/>
            </svg>
          </div>
          {/* Football 2 */}
          <div className="wave-football-wrapper fb-5">
            <svg className="wave-football spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 7.38 3.32" />
              <path d="M12 22a10 10 0 0 0 7.38-3.32" />
              <polygon points="12 7 8 10 9.5 15 14.5 15 16 10" />
              <path d="M12 7V2" />
              <path d="M16 10l4.5-2" />
              <path d="M8 10L3.5 8" />
              <path d="M14.5 15l2.5 5" />
              <path d="M9.5 15l-2.5 5" />
            </svg>
          </div>
        </div>

        <svg className="wave wave-front" viewBox="0 0 2800 90" preserveAspectRatio="none">
          <path fill="rgba(0,200,83,0.25)" d="M0,50 c120,-28 240,-28 360,-8 c120,20 240,-12 360,-4 c120,8 240,-20 360,-4 c100,14 220,16 320,16 c120,-28 240,-28 360,-8 c120,20 240,-12 360,-4 c120,8 240,-20 360,-4 c100,14 220,16 320,16 L2800,90 L0,90 Z" />
        </svg>
      </div>
    </header>
  );
});

export default Hero;
