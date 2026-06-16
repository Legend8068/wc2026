import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import './trionda.css';

import TriondaModel from './TriondaModel';
import HiddenTriangle from './HiddenTriangle';
import AeroSlider from './AeroSlider';
import DataPulses from './DataPulses';
import HiddenDetails from './HiddenDetails';
import SialkotMap from './SialkotMap';
import ThenNowTimeline from './ThenNowTimeline';

/* ============================================================================
   <TriondaStory /> — scroll-driven section, rebuilt around the real GLB ball.

   Sticky-stage pattern: one tall <section> pins a full-screen stage; a single
   `scrollYProgress` MotionValue drives the 3D ball (docking + rotation + reveal)
   and cross-fades the copy. The ball docks left / right / centre per beat so the
   text always has its own half — no overlap. Each caption carries a one-sided
   readability scrim (see trionda.css).

   9 beats:
     1 hook .00–.10 · 2 three-waves .10–.22 · 3 evolution .22–.33
     4 aerodynamics .33–.46 · 5 AI inside .46–.60 · 6 hidden details .60–.71
     7 made in Sialkot .71–.81 · 8 then-vs-now .81–.92 · 9 finale .92–1
   ========================================================================== */

const STEPS = 11; // scroll length in viewport-heights (room to breathe per beat)

function CameraRig({ progress }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = progress.get();
    const z = 4.3 - Math.sin(p * Math.PI) * 0.25; // gentle, never jarring
    camera.position.z += (z - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* Copy block: fades + lifts over [start,end]; placement via flexbox class so
   motion's transform only handles the y-nudge (never clobbers centering). */
function Caption({ progress, start, end, className = '', children }) {
  const mid = (start + end) / 2;
  const opacity = useTransform(
    progress,
    [start, start + (mid - start) * 0.45, end - (end - mid) * 0.45, end],
    [0, 1, 1, 0]
  );
  const y = useTransform(progress, [start, mid, end], [34, 0, -34]);
  return (
    <motion.div style={{ opacity }} className={`tri-caption ${className}`}>
      <motion.div style={{ y }} className="tri-caption__inner">{children}</motion.div>
    </motion.div>
  );
}

export default function TriondaStory() {
  const story = useRef(null);
  const { scrollYProgress } = useScroll({ target: story, offset: ['start start', 'end end'] });

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const f = () => setCompact(window.innerWidth < 900);
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  // discrete scene flags for DOM overlays — only setState on threshold change
  const [scene, setScene] = useState({ triangle: false, pulses: false, hotspots: false, map: false });
  const [tlT, setTlT] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = {
      triangle: p > 0.11 && p < 0.225,
      pulses: p > 0.49 && p < 0.6,
      hotspots: p > 0.6 && p < 0.715,
      map: p > 0.71 && p < 0.815,
    };
    setScene((prev) =>
      prev.triangle === next.triangle && prev.pulses === next.pulses &&
      prev.hotspots === next.hotspots && prev.map === next.map ? prev : next
    );
    if (p > 0.8 && p < 0.93) {
      const nt = Math.min(1, Math.max(0, (p - 0.81) / 0.11));
      setTlT((prev) => (Math.abs(prev - nt) > 0.02 ? nt : prev));
    }
  });

  const finaleStats = useTransform(scrollYProgress, [0.92, 0.95, 0.985, 1], [0, 1, 1, 0]);
  const fadeBlack = useTransform(scrollYProgress, [0.97, 1], [0, 1]);

  return (
    <section ref={story} className={`tri ${compact ? 'tri--compact' : ''}`} style={{ height: `${STEPS * 100}vh` }}>
      <div className="tri-stage">
        <div className="tri-aurora" aria-hidden="true" />

        <Canvas
          className="tri-canvas"
          camera={{ position: [0, 0, 4.3], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          {/* manual 3-point lighting (no HDRI fetch → works offline) */}
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 5]} intensity={2.4} />
          <directionalLight position={[-3, 2, 4]} intensity={1.0} color="#cfe0ff" />
          <pointLight position={[-5, 1, 3]} intensity={26} color="#3366ff" />
          <pointLight position={[5, -2, 2]} intensity={22} color="#e2001a" />
          <pointLight position={[0, 4, -4]} intensity={18} color="#ffffff" />
          <Suspense fallback={null}>
            <TriondaModel progress={scrollYProgress} compact={compact} />
          </Suspense>
          <CameraRig progress={scrollYProgress} />
        </Canvas>

        {/* overlays that sit over the (centred) ball */}
        <DataPulses active={scene.pulses} />
        <HiddenDetails active={scene.hotspots} />

        <div className="tri-overlay">
          {/* 1 · hook */}
          <Caption progress={scrollYProgress} start={0.0} end={0.1} className="tri-center">
            <span className="tri-kicker">FIFA WORLD CUP 26™ · OFFICIAL MATCH BALL</span>
            <h2 className="tri-display">How do you redesign the most important football on&nbsp;Earth?</h2>
            <p className="tri-sub">Scroll to find out.</p>
          </Caption>

          {/* 2 · three waves + hidden triangle */}
          <Caption progress={scrollYProgress} start={0.1} end={0.22} className="tri-right">
            <span className="tri-kicker">THE NAME · TRIONDA</span>
            <h3 className="tri-h3"><span className="g-red">Three</span> <span className="g-green">waves</span>, <span className="g-blue">three</span> nations.</h3>
            <p className="tri-body">Red, green and blue for Canada, Mexico and the USA — meeting at a hidden triangle in the very centre of the ball.</p>
            <HiddenTriangle active={scene.triangle} />
          </Caption>

          {/* 3 · engineering evolution */}
          <Caption progress={scrollYProgress} start={0.22} end={0.33} className="tri-left">
            <span className="tri-kicker">ENGINEERING EVOLUTION</span>
            <div className="tri-morph"><PanelMorph progress={scrollYProgress} start={0.235} end={0.315} /></div>
            <p className="tri-body">Every World Cup, fewer seams. Trionda’s <strong className="g-gold">4 thermally-bonded panels</strong> are the fewest ever used.</p>
          </Caption>

          {/* 4 · aerodynamics (interactive) */}
          <Caption progress={scrollYProgress} start={0.33} end={0.46} className="tri-right tri-wide">
            <span className="tri-kicker">WHY ONLY 4 PANELS?</span>
            <h3 className="tri-h3">Deep seams kill the knuckle.</h3>
            <p className="tri-body">Channel-deep seams trip the airflow into a clean, predictable wake. Drag to feel the difference.</p>
            <AeroSlider />
          </Caption>

          {/* 5 · the AI inside */}
          <Caption progress={scrollYProgress} start={0.46} end={0.6} className="tri-right">
            <span className="tri-kicker">THE AI INSIDE</span>
            <h3 className="tri-h3">A ball that talks to VAR.</h3>
            <p className="tri-body">Suspended dead-centre, a Kinexon sensor samples motion <strong className="g-gold">500× a second</strong> — flagging offsides and every touch in real time.</p>
          </Caption>

          {/* 6 · hidden details (hotspots overlay) */}
          <Caption progress={scrollYProgress} start={0.6} end={0.71} className="tri-left tri-top">
            <span className="tri-kicker">HIDDEN DETAILS</span>
            <h3 className="tri-h3">Three nations, in the marks.</h3>
            <p className="tri-body">Hover the markers to read each story.</p>
          </Caption>

          {/* 7 · where it was made */}
          <Caption progress={scrollYProgress} start={0.71} end={0.81} className="tri-left tri-wide">
            <span className="tri-kicker">WHERE IT WAS MADE</span>
            <SialkotMap active={scene.map} />
          </Caption>

          {/* 8 · then vs now */}
          <Caption progress={scrollYProgress} start={0.81} end={0.92} className="tri-center tri-wide">
            <span className="tri-kicker">THEN VS NOW</span>
            <ThenNowTimeline t={tlT} />
          </Caption>

          {/* 9 · finale */}
          <motion.div style={{ opacity: finaleStats }} className="tri-caption tri-center tri-finale">
            <div className="tri-caption__inner">
              <div className="tri-stats">
                <Stat n="4" label="PANELS" />
                <Stat n="3" label="NATIONS" />
                <Stat n="500" label="UPDATES / SEC" />
              </div>
              <h2 className="tri-display">The most advanced football ever created.</h2>
            </div>
          </motion.div>
        </div>

        <motion.div style={{ opacity: fadeBlack }} className="tri-fade-black" aria-hidden="true" />
      </div>
    </section>
  );
}

function PanelMorph({ progress, start, end }) {
  const counts = [20, 14, 8, 6, 4];
  const idx = useTransform(progress, [start, end], [0, counts.length - 1]);
  const display = useTransform(idx, (v) => counts[Math.min(counts.length - 1, Math.round(v))]);
  return (
    <div className="tri-morph-num"><motion.span>{display}</motion.span><small>PANELS</small></div>
  );
}

function Stat({ n, label }) {
  return <div className="tri-stat"><span className="tri-stat__n">{n}</span><span className="tri-stat__l">{label}</span></div>;
}
