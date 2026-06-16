import React, { useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Wind } from 'lucide-react';

/* ============================================================================
   <AeroSlider /> — step 5, "Why only 4 panels?"

   A draggable handle that morphs a field of CFD-style airflow lines from
   TURBULENT (many panels, chaotic knuckle) → SMOOTH (4 panels, clean wake).
   Self-contained SVG so it works whether or not the R3F ball is on screen.

   `value` 0 = many-panel turbulence, 1 = 4-panel laminar flow.
   You can also lift `value` up to drive the 3D ball's airflow shader later.
   ========================================================================== */

const LINES = 11; // streamlines top→bottom across the ball

// turbulent line: noisy, breaks up behind the ball. smooth line: clean arc.
function streamPath(i, t) {
  const y = 18 + (i / (LINES - 1)) * 164; // 18 → 182 within a 200-tall box
  const dist = Math.abs(y - 100) / 100; // 0 at equator, 1 at poles
  const wake = 40 + t * 40; // smoother flow hugs the ball longer
  const wobble = (1 - t) * (10 + 26 * (1 - dist)); // turbulence amplitude
  // upstream straight, then bends around the ball, then a wake that either
  // shears apart (turbulent) or re-converges (smooth)
  const cp1x = 150 + wobble * Math.sin(i * 1.7);
  const cp1y = y - wobble * Math.cos(i * 2.1);
  const cp2x = 250 - wake + wobble * Math.cos(i * 1.3);
  const cp2y = y + wobble * Math.sin(i * 1.9);
  const endY = 100 + (y - 100) * (0.4 + t * 0.6); // smooth = re-converge
  return `M0,${y} C90,${y} ${cp1x},${cp1y} 200,${y} S${cp2x},${cp2y} 360,${endY}`;
}

export default function AeroSlider() {
  const trackRef = useRef(null);
  const x = useMotionValue(0); // handle pixel offset
  const [t, setT] = useState(0); // smoothness 0..1; handle starts left = turbulent

  // map handle position → smoothness, recompute paths on drag
  const onDrag = () => {
    const track = trackRef.current;
    if (!track) return;
    const w = track.offsetWidth - 28; // minus handle width
    setT(Math.min(1, Math.max(0, x.get() / w)));
  };

  const turbulent = t < 0.5;

  return (
    <div className="aero">
      <div className="aero__viz">
        <svg viewBox="0 0 360 200" className="aero__svg" aria-hidden="true">
          <defs>
            <radialGradient id="aeroBall" cx="42%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#2a4a7a" />
              <stop offset="100%" stopColor="#0c1520" />
            </radialGradient>
          </defs>

          {/* streamlines */}
          {Array.from({ length: LINES }).map((_, i) => (
            <motion.path
              key={i}
              d={streamPath(i, t)}
              fill="none"
              stroke={turbulent ? '#e2001a' : '#00c853'}
              strokeOpacity={0.55}
              strokeWidth={1.4}
              animate={{ d: streamPath(i, t) }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            >
              {/* particles riding the flow */}
            </motion.path>
          ))}

          {/* the ball */}
          <circle cx="200" cy="100" r="46" fill="url(#aeroBall)" stroke="#f5c542" strokeOpacity="0.5" />
          {/* knuckle marker — jitters when turbulent */}
          <motion.circle
            cx="246"
            cy="100"
            r="4"
            fill={turbulent ? '#e2001a' : '#00c853'}
            animate={turbulent ? { cy: [96, 104, 98, 102, 100], cx: [246, 250, 244, 248, 246] } : { cy: 100, cx: 246 }}
            transition={turbulent ? { duration: 0.4, repeat: Infinity } : { duration: 0.3 }}
          />
        </svg>

        <div className="aero__readout">
          <Wind size={16} strokeWidth={2.5} />
          <span className="aero__readout-label">{turbulent ? 'TURBULENT WAKE' : 'LAMINAR FLOW'}</span>
          <span className="aero__readout-panels">{turbulent ? '20-panel era' : '4-panel Trionda'}</span>
        </div>
      </div>

      {/* draggable slider */}
      <div className="aero__track" ref={trackRef}>
        <div className="aero__track-fill" style={{ width: `${t * 100}%` }} />
        <motion.button
          type="button"
          className="aero__handle"
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDrag={onDrag}
          aria-label="Drag to change panel count and airflow"
          whileTap={{ scale: 1.15 }}
        />
      </div>
      <div className="aero__legend">
        <span>← More panels · chaotic</span>
        <span>Fewer panels · stable →</span>
      </div>
    </div>
  );
}
