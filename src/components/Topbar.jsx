import React from 'react';
import BrandText from './BrandText';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function fmtClock(ms) {
  const d = new Date(ms + 8 * 3600000); // shift to SGT, read as UTC
  const pad = (n) => String(n).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} SGT`;
}

export default function Topbar({ now, mode, feedOk, onToggleMode, demoPlaying, onStepDemo, onTogglePlay }) {
  const isDemo = mode === 'demo';
  const [activeSection, setActiveSection] = React.useState('live');

  React.useEffect(() => {
    const sections = ['live', 'bracket', 'groups', 'statistics', 'venues'];
    const elements = sections.map(id => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      rootMargin: '-30% 0px -50% 0px'
    });

    elements.forEach(el => observer.observe(el));

    // Also listen to hash changes or manual scrolls to be precise
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setActiveSection('live');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      elements.forEach(el => observer.unobserve(el));
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  let badgeText = 'LIVE';
  let badgeTitle = '';

  if (isDemo) {
    badgeText = 'DEMO';
    badgeTitle = 'Tournament simulation. Click for live mode.';
  } else if (feedOk) {
    badgeText = 'LIVE';
    badgeTitle = 'Real scores from the live feed. Click for demo mode.';
  } else {
    badgeText = 'LIVE · SIM';
    badgeTitle = 'Live feed unavailable — simulating at the real clock. Click for demo mode.';
  }

  const goHome = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <nav className="topbar">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <div
          className="brand-home"
          role="button"
          tabIndex={0}
          title="Back to top"
          onClick={goHome}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); } }}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          WC<BrandText text="2026" className="topbar-brand" /> LIVE TRACKER
        </div>
        <small style={{ width: '100%' }}>USA · CANADA · MEXICO</small>
      </div>
      <div className="nav-links">
        <a href="#live" className={activeSection === 'live' ? 'active' : ''}>LIVE</a>
        <a href="#bracket" className={activeSection === 'bracket' ? 'active' : ''}>BRACKET</a>
        <a href="#groups" className={activeSection === 'groups' ? 'active' : ''}>GROUPS</a>
        <a href="#statistics" className={activeSection === 'statistics' ? 'active' : ''}>STATS</a>
        <a href="#venues" className={activeSection === 'venues' ? 'active' : ''}>VENUES</a>
      </div>
      <div className="nav-status">
        <span id="clock">{fmtClock(now)}</span>
        {isDemo && (
          <div className="demo-controls">
            <button
              className="demo-ctrl-btn"
              onClick={onStepDemo}
              title="Skip forward 5 hours"
            >
              +5H
            </button>
            <button
              className={`demo-ctrl-btn ${demoPlaying ? 'active' : ''}`}
              onClick={onTogglePlay}
              title={demoPlaying ? "Pause simulation" : "Resume simulation"}
            >
              {demoPlaying ? 'PAUSE' : 'PLAY'}
            </button>
          </div>
        )}
        <button
          id="modeToggle"
          className={`mode-badge ${isDemo ? 'demo' : ''}`}
          type="button"
          title={badgeTitle}
          onClick={onToggleMode}
        >
          <span className="dot" />
          <span id="modeText">{badgeText}</span>
        </button>
      </div>
    </nav>
  );
}
