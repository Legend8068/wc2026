import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================================
   <TriondaModel /> — the real GLB ball.

   The model is a single welded mesh (no separable panels), so the story uses
   the real textured ball throughout and never tries to split geometry:
     · "explosion"  → a fast spin-up + seam/emissive glow on the hook beat
     · "hidden triangle" → an SVG graphic overlay (in TriondaStory), not geometry
     · "AI inside"  → the shell fades translucent to reveal a chip + wireframe

   Everything is driven by one Framer-Motion `progress` MotionValue (0→1),
   read with `.get()` inside useFrame — no React re-renders on scroll.

   Layout: the ball *docks* to a different x / scale per beat (see BALL_X /
   BALL_S keyframes) so the copy can sit on the opposite side without overlap.
   ========================================================================== */

const MODEL_URL = '/models/trionda.glb';
const GOLD = '#f5c542';

// — maths helpers —
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const pulse = (a, b, c, d, x) => smoothstep(a, b, x) * (1 - smoothstep(c, d, x));
// piecewise smooth interpolation across [p, value] keyframes
function track(p, stops) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [pa, va] = stops[i];
    const [pb, vb] = stops[i + 1];
    if (p <= pb) return va + (vb - va) * smoothstep(pa, pb, p);
  }
  return stops[stops.length - 1][1];
}

/* Ball docking keyframes (kept in lockstep with the captions in TriondaStory):
   b1 hook .00–.10 · b2 waves .10–.22 · b3 evolution .22–.33 · b4 aero .33–.46
   b5 AI .46–.60 · b6 details .60–.71 · b7 made .71–.81 · b8 timeline .81–.92
   b9 finale .92–1 */
const BALL_X = [
  [0.05, 0], [0.16, -1.45], [0.28, 1.45], [0.4, -1.45],
  [0.53, 0], [0.655, 0], [0.76, 1.7], [0.865, 1.95], [0.96, 0],
];
const BALL_S = [
  [0.05, 1.0], [0.16, 0.92], [0.28, 0.92], [0.4, 0.88],
  [0.53, 1.08], [0.655, 1.0], [0.76, 0.72], [0.865, 0.66], [0.96, 1.12],
];

export default function TriondaModel({ progress, compact = false }) {
  const { scene } = useGLTF(MODEL_URL);
  const root = useRef(); // docking (x / scale)
  const spin = useRef(); // continuous rotation
  const chip = useRef();
  const wire = useRef();

  // clone + normalise to unit radius, centred at origin, once
  const { obj, scale, mats } = useMemo(() => {
    const obj = scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    obj.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
    const mats = [];
    obj.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.emissive = new THREE.Color(GOLD);
        o.material.emissiveIntensity = 0;
        mats.push(o.material);
      }
    });
    return { obj, scale: 1 / sphere.radius, mats };
  }, [scene]);

  useFrame((state, delta) => {
    const p = progress ? progress.get() : 0;

    // — docking — (dampened on small screens so the ball stays roughly centred)
    if (root.current) {
      root.current.position.x = track(p, BALL_X) * (compact ? 0.25 : 1);
      root.current.scale.setScalar(track(p, BALL_S) * (compact ? 0.82 : 1));
    }

    // — rotation — continuous & smooth; hook spin-up, slows for the hotspots
    const hook = pulse(0.0, 0.025, 0.07, 0.11, p);
    const slow = pulse(0.6, 0.625, 0.69, 0.71, p);
    if (spin.current) {
      spin.current.rotation.y += delta * (0.32 * (1 - slow * 0.85) + hook * 3.0);
      spin.current.rotation.x = Math.sin(p * Math.PI) * 0.07;
    }

    // — AI reveal (b5): shell turns translucent; chip + wireframe fade in —
    const reveal = pulse(0.47, 0.52, 0.58, 0.62, p);
    for (const m of mats) {
      m.opacity = 1 - 0.82 * reveal;
      m.emissiveIntensity = hook * 0.55; // seam glow on the hook
    }
    if (chip.current) {
      chip.current.material.opacity = reveal;
      chip.current.material.emissiveIntensity = reveal * (1 + Math.sin(state.clock.elapsedTime * 8) * 0.5);
      chip.current.rotation.y += delta * 0.8;
    }
    if (wire.current) wire.current.material.opacity = reveal * 0.4;
  });

  return (
    <group ref={root}>
      <group ref={spin}>
        <group scale={scale}>
          <primitive object={obj} />
        </group>
        {/* wireframe shell, revealed with the chip */}
        <mesh ref={wire}>
          <sphereGeometry args={[1.02, 32, 24]} />
          <meshBasicMaterial color={GOLD} wireframe transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {/* Kinexon sensor chip (stays centred) */}
      <mesh ref={chip}>
        <boxGeometry args={[0.32, 0.32, 0.1]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
