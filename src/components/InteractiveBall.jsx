import React, { useRef, useEffect } from 'react';

const PHI = (1 + Math.sqrt(5)) / 2;

function generateVertices() {
  const vertices = [];
  const addEvenPermutations = (x, y, z) => {
    vertices.push([x, y, z]);
    vertices.push([y, z, x]);
    vertices.push([z, x, y]);
  };

  const signs = [-1, 1];
  for (const sy of signs) {
    for (const sz of signs) {
      addEvenPermutations(0, 1 * sy, 3 * PHI * sz);
    }
  }

  for (const sx of signs) {
    for (const sy of signs) {
      for (const sz of signs) {
        addEvenPermutations(1 * sx, (2 + PHI) * sy, 2 * PHI * sz);
      }
    }
  }

  for (const sx of signs) {
    for (const sy of signs) {
      for (const sz of signs) {
        addEvenPermutations(PHI * sx, 2 * sy, (2 * PHI + 1) * sz);
      }
    }
  }
  return vertices;
}

const VERTICES = generateVertices();

function generateEdges(vertices) {
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const v1 = vertices[i];
      const v2 = vertices[j];
      const distSq = Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2) + Math.pow(v1[2] - v2[2], 2);
      if (Math.abs(distSq - 4) < 0.001) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

const EDGES = generateEdges(VERTICES);

// Paint the mesh in the host-nation palette: three longitudinal sectors of
// red / green / blue (Canada · Mexico · USA) so the ball reads as ours at a
// glance, with gold reserved for the highlight glow.
const HOST_COLORS = ['#e2001a', '#00c853', '#3366ff'];
const VERTEX_COLORS = VERTICES.map((v) => {
  const lon = Math.atan2(v[2], v[0]); // -PI..PI around the vertical axis
  const sector = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * 3) % 3;
  return HOST_COLORS[sector];
});
// Each edge takes the colour of one endpoint — a faint nation-tinted wireframe.
const EDGE_COLORS = EDGES.map((e) => VERTEX_COLORS[e[0]]);

export default function InteractiveBall() {
  const svgRef = useRef(null);

  // Arrays of refs to hold the actual DOM elements for lightning-fast direct mutation
  const edgesRef = useRef([]);
  const nodesRef = useRef([]);
  const glowsRef = useRef([]);

  // Pointer state: normalised position (−1..1) and whether we're hovering.
  const mousePos = useRef({ x: 0, y: 0, active: false });
  const prevMouse = useRef({ x: 0, y: 0, has: false });
  // Flick impulses accumulated between frames (consumed by the loop).
  const impulse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId;
    let last = performance.now();

    // Physics state: orientation + angular velocity (rad · s⁻¹).
    const rot = { x: 0, y: 0 };
    const angVel = { x: 0, y: 0 };

    // Idle drift so the ball is always gently turning; friction pulls any
    // spin back down to it. Reduced-motion users get a near-still ball.
    const idle = reduced ? { x: 0.0, y: 0.04 } : { x: 0.05, y: 0.18 };
    const FRICTION_BASE = 0.06; // per-second decay factor (lower = more drag)
    const HOLD_TORQUE = reduced ? 0 : 2.4; // pull toward an off-centre pointer
    const MAX_SPIN = 9; // clamp so a fast flick can't go wild

    const rotate3D = (point, rx, ry) => {
      let [x, y, z] = point;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      let y1 = y * cosX - z * sinX;
      let z1 = y * sinX + z * cosX;

      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      let x2 = x * cosY + z1 * sinY;
      let z2 = -x * sinY + z1 * cosY;
      return [x2, y1, z2];
    };

    const animate = (now) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp big gaps (tab was backgrounded)

      // 1 · flick impulses (mouse velocity) → instant change in angular vel.
      angVel.y += impulse.current.x;
      angVel.x += impulse.current.y;
      impulse.current.x = 0;
      impulse.current.y = 0;

      // 2 · holding the pointer off-centre keeps nudging the ball round.
      if (mousePos.current.active && HOLD_TORQUE) {
        angVel.y += mousePos.current.x * HOLD_TORQUE * dt;
        angVel.x -= mousePos.current.y * HOLD_TORQUE * dt;
      }

      // 3 · friction (frame-rate independent) bleeds spin away.
      const damp = Math.pow(FRICTION_BASE, dt);
      angVel.x *= damp;
      angVel.y *= damp;
      angVel.x = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, angVel.x));
      angVel.y = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, angVel.y));

      // 4 · integrate: idle drift + carried momentum.
      rot.x += (idle.x + angVel.x) * dt;
      rot.y += (idle.y + angVel.y) * dt;

      const projectedVertices = VERTICES.map(v => {
        const rotated = rotate3D(v, rot.x, rot.y);
        const perspective = 20;
        const scale = perspective / (perspective + rotated[2]);
        return {
          x: rotated[0] * scale,
          y: rotated[1] * scale,
          z: rotated[2],
          scale: scale
        };
      });

      // Update edges natively
      for (let i = 0; i < EDGES.length; i++) {
        const line = edgesRef.current[i];
        if (!line) continue;
        const v1 = projectedVertices[EDGES[i][0]];
        const v2 = projectedVertices[EDGES[i][1]];
        const opacity = Math.max(0.05, ((v1.z + v2.z) / 2 + 6) / 12) * 0.55;

        line.setAttribute('x1', v1.x.toFixed(3));
        line.setAttribute('y1', v1.y.toFixed(3));
        line.setAttribute('x2', v2.x.toFixed(3));
        line.setAttribute('y2', v2.y.toFixed(3));
        line.setAttribute('opacity', opacity.toFixed(3));
      }

      // Update nodes and fake glows natively
      for (let i = 0; i < VERTICES.length; i++) {
        const node = nodesRef.current[i];
        const glow = glowsRef.current[i];
        if (!node || !glow) continue;

        const pv = projectedVertices[i];
        // Front-facing nodes pop brighter; back ones recede.
        const depth = (pv.z + 6) / 12; // 0 (far) .. 1 (near)
        const opacity = Math.max(0.12, depth);
        const r = 0.15 * pv.scale;

        const xStr = pv.x.toFixed(3);
        const yStr = pv.y.toFixed(3);

        node.setAttribute('cx', xStr);
        node.setAttribute('cy', yStr);
        node.setAttribute('r', r.toFixed(3));
        node.setAttribute('opacity', opacity.toFixed(3));

        glow.setAttribute('cx', xStr);
        glow.setAttribute('cy', yStr);
        glow.setAttribute('r', (r * 3.2).toFixed(3));
        glow.setAttribute('opacity', (depth * depth * 0.4).toFixed(3));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Pointer velocity → flick impulse (gives the spin real momentum).
    if (prevMouse.current.has) {
      const FLICK = 7;
      impulse.current.x += (x - prevMouse.current.x) * FLICK;
      impulse.current.y -= (y - prevMouse.current.y) * FLICK;
    }
    prevMouse.current = { x, y, has: true };
    mousePos.current = { x, y, active: true };
  };

  const handleMouseEnter = () => {
    window.dispatchEvent(new CustomEvent('start-world-cup-music'));
  };

  const handleMouseLeave = () => {
    mousePos.current = { x: 0, y: 0, active: false };
    prevMouse.current = { x: 0, y: 0, has: false };
  };

  return (
    <div
      className="interactive-ball-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="ball-glow-bg"></div>
      <svg ref={svgRef} viewBox="-7 -7 14 14" className="interactive-ball-svg">
        <g className="ball-edges">
          {EDGES.map((_, i) => (
            <line
              key={i}
              ref={el => edgesRef.current[i] = el}
              stroke={EDGE_COLORS[i]}
              strokeWidth="0.045"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Render Fake Glows behind nodes */}
        <g className="ball-glows">
          {VERTICES.map((_, i) => (
            <circle
              key={`glow-${i}`}
              ref={el => glowsRef.current[i] = el}
              fill={VERTEX_COLORS[i]}
            />
          ))}
        </g>

        {/* Render Core Nodes */}
        <g className="ball-nodes">
          {VERTICES.map((_, i) => (
            <circle
              key={`node-${i}`}
              ref={el => nodesRef.current[i] = el}
              fill={VERTEX_COLORS[i]}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
