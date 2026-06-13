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
  
  const handleMouseMove = (e) => {
    if (!mapRef.current) return;
    const { left, top, width, height } = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    const rotateX = (0.5 - y) * 30;
    const rotateY = (x - 0.5) * 30;
    
    mapRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    mapRef.current.style.filter = `drop-shadow(${rotateY * -0.5}px ${rotateX * 0.5 + 10}px 24px rgba(51, 102, 255, 0.4))`;
  };
  
  const handleMouseLeave = () => {
    if (!mapRef.current) return;
    mapRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    mapRef.current.style.filter = '';
  };

  return (
    <div 
      ref={mapRef}
      className="hero-map-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.1s ease-out, filter 0.1s ease-out', display: 'flex', justifyContent: 'center', width: '100%', marginTop: '40px' }}
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

function StatNumber({ value, isDate }) {
  const [count, setCount] = useState(isDate ? value : 0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isDate) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = parseInt(value, 10);
    if (reduced || isNaN(target)) {
      setCount(value);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.unobserve(entry.target);

          const start = performance.now();
          const duration = 1400;

          const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // cubic ease out: 1 - (1 - p)^3
            const currentVal = Math.round(target * (1 - Math.pow(1 - progress, 3)));
            setCount(currentVal);
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.2 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [value, isDate]);

  if (isDate) {
    return <div className="stat-num small">{value}</div>;
  }

  return <div ref={elementRef} className="stat-num">{count}</div>;
}

export default function Hero() {
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
        <div className="hero-stats-label">THE TOURNAMENT AT A GLANCE</div>
        <div className="stats-grid">
          <div className="stat">
            <StatNumber value={48} />
            <div className="stat-label">NATIONS</div>
          </div>
          <div className="stat">
            <StatNumber value={104} />
            <div className="stat-label">MATCHES</div>
          </div>
          <div className="stat">
            <StatNumber value={16} />
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
}
