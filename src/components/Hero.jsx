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
        <svg className="wave wave-front" viewBox="0 0 2800 90" preserveAspectRatio="none">
          <path fill="rgba(0,200,83,0.25)" d="M0,50 c120,-28 240,-28 360,-8 c120,20 240,-12 360,-4 c120,8 240,-20 360,-4 c100,14 220,16 320,16 c120,-28 240,-28 360,-8 c120,20 240,-12 360,-4 c120,8 240,-20 360,-4 c100,14 220,16 320,16 L2800,90 L0,90 Z" />
        </svg>
      </div>
    </header>
  );
});

export default Hero;
