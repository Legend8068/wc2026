import React, { useState, useEffect, useRef, useCallback } from 'react';
import D from './data';
import * as engine from './engine';
import * as live from './live';

import Noise from './components/Noise';
import LoadingScreen from './components/LoadingScreen';
import CustomCursor from './components/CustomCursor';
import Topbar from './components/Topbar';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import MatchCentre from './components/MatchCentre';
import Bracket from './components/Bracket';
import Groups from './components/Groups';
import MusicPlayer from './components/MusicPlayer';
import Statistics from './components/Statistics';
import HostMap from './components/HostMap';

const TICK_MS = 500;
const MATCH_DURATION_MS = 3 * 3600000; // 3 hours (including potential extra time)
const UPCOMING_WINDOW_MS = 3600000; // 1 hour buffer

function isAnyMatchLiveOrSoon(time, liveStates) {
  // Check group stage fixtures
  const groupActive = D.GROUP_FIXTURES.some(f =>
    (time >= f.ts && time < f.ts + MATCH_DURATION_MS) || // currently live
    (f.ts >= time && f.ts < time + UPCOMING_WINDOW_MS)   // starting within next hour
  );
  if (groupActive) return true;

  // Check knockout fixtures
  const knockoutActive = D.KO.some(f =>
    (time >= f.ts && time < f.ts + MATCH_DURATION_MS) || // currently live
    (f.ts >= time && f.ts < time + UPCOMING_WINDOW_MS)   // starting within next hour
  );
  if (knockoutActive) return true;

  // Check feed status
  if (liveStates) {
    return Object.values(liveStates).some(s => s.status === 'live' || s.status === 'ht');
  }

  return false;
}

function triggerConfetti() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const colors = ['#f5c542', '#00c853', '#3366ff', '#e2001a', '#ffffff'];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const size = 6 + Math.random() * 8;
    c.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${size}px;height:${size * (0.5 + Math.random())}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${2.4 + Math.random() * 2.6}s;
      animation-delay:${Math.random() * 1.4}s;`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 7000);
  }
}

export default function App() {
  const [mode, setMode] = useState('live');
  const [liveStates, setLiveStates] = useState(null);
  const [feedOk, setFeedOk] = useState(false);
  const [demoTime, setDemoTime] = useState(null);
  const [demoPlaying, setDemoPlaying] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const hasCrowned = useRef(false);
  const handleLoaderDone = useCallback(() => setLoading(false), []);

  // Dynamic polling scheduler in live mode
  useEffect(() => {
    if (mode !== 'live') return;

    let timeoutId = null;

    const poll = async () => {
      let currentStates = null;
      try {
        const states = await live.fetchStates();
        setLiveStates(states);
        setFeedOk(true);
        currentStates = states;
      } catch (err) {
        setLiveStates(null);
        setFeedOk(false);
      }

      // Determine next poll interval
      const nowTime = Date.now();
      const isLive = isAnyMatchLiveOrSoon(nowTime, currentStates);
      const intervalMs = isLive ? 60000 : 3600000; // 60s if live or soon, 1 hour if not

      timeoutId = setTimeout(poll, intervalMs);
    };

    // Initial poll
    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode]);

  // Live mode ticker
  useEffect(() => {
    if (mode === 'live') {
      const tick = () => setNow(Date.now());
      tick();
      const interval = setInterval(tick, TICK_MS);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Demo mode autoplay ticker (increments by 5 hours simulated every 1 second)
  useEffect(() => {
    if (mode === 'demo' && demoPlaying) {
      const tick = () => {
        setDemoTime(prev => {
          const next = prev + 5 * 3600000;
          setNow(next);
          return next;
        });
      };
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, demoPlaying]);

  // Handle Mode Toggle
  const handleToggleMode = () => {
    if (mode === 'live') {
      const startTime = D.TOURNAMENT_START - 2 * 3600000;
      setDemoTime(startTime);
      setNow(startTime);
      setMode('demo');
      setDemoPlaying(true);
    } else {
      setMode('live');
      setNow(Date.now());
    }
  };

  const handleStepDemo = () => {
    setDemoTime(prev => {
      const next = prev + 5 * 3600000;
      setNow(next);
      return next;
    });
  };

  const handleTogglePlay = () => {
    setDemoPlaying(p => !p);
  };

  // Compute snapshot based on virtual time 'now'
  const useLive = mode === 'live' && feedOk && liveStates;
  const snapshot = engine.snapshot(now, useLive ? 'live' : 'sim', liveStates);

  // Confetti trigger trigger
  useEffect(() => {
    if (snapshot?.champion) {
      if (!hasCrowned.current) {
        hasCrowned.current = true;
        triggerConfetti();
      }
    } else {
      hasCrowned.current = false;
    }
  }, [snapshot?.champion]);

  return (
    <>
      {loading && <LoadingScreen onDone={handleLoaderDone} />}
      <CustomCursor />
      <Noise />
      <Topbar
        now={now}
        mode={mode}
        feedOk={feedOk}
        onToggleMode={handleToggleMode}
        demoPlaying={demoPlaying}
        onStepDemo={handleStepDemo}
        onTogglePlay={handleTogglePlay}
      />
      <Ticker snapshot={snapshot} />
      <Hero />
      <MatchCentre snapshot={snapshot} />
      <Bracket snapshot={snapshot} />
      <Groups snapshot={snapshot} />
      <Statistics snapshot={snapshot} />
      <HostMap snapshot={snapshot} />
      <MusicPlayer />

      <footer>
        <div className="f-brand">WORLD CUP 2026 <span>LIVE TRACKER</span></div>
        <div className="f-note">
          ALL KICK-OFF TIMES IN SGT (UTC+8) · CLICK THE LIVE BUTTON TO SWITCH TO DEMO MODE AND SIMULATE THE TOURNAMENT
        </div>
      </footer>
    </>
  );
}
