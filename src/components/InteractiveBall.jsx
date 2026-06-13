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

export default function InteractiveBall() {
  const svgRef = useRef(null);
  
  // Arrays of refs to hold the actual DOM elements for lightning-fast direct mutation
  const edgesRef = useRef([]);
  const nodesRef = useRef([]);
  const glowsRef = useRef([]);
  
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId;
    let baseRx = 0;
    let baseRy = 0;

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

    const animate = () => {
      baseRy += 0.003;
      baseRx += 0.0015;

      targetRotation.current.y = baseRy + mousePos.current.x * 0.8;
      targetRotation.current.x = baseRx - mousePos.current.y * 0.8;

      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.08;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.08;

      const projectedVertices = VERTICES.map(v => {
        const rotated = rotate3D(v, currentRotation.current.x, currentRotation.current.y);
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
        const opacity = Math.max(0.05, ((v1.z + v2.z) / 2 + 6) / 12) * 0.6;
        
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
        const opacity = Math.max(0.1, (pv.z + 6) / 12);
        const r = 0.15 * pv.scale;

        const xStr = pv.x.toFixed(3);
        const yStr = pv.y.toFixed(3);
        
        node.setAttribute('cx', xStr);
        node.setAttribute('cy', yStr);
        node.setAttribute('r', r.toFixed(3));
        node.setAttribute('opacity', opacity.toFixed(3));

        glow.setAttribute('cx', xStr);
        glow.setAttribute('cy', yStr);
        glow.setAttribute('r', (r * 3).toFixed(3));
        glow.setAttribute('opacity', (opacity * 0.25).toFixed(3));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mousePos.current = { x, y };
  };

  const handleMouseEnter = () => {
    window.dispatchEvent(new CustomEvent('start-world-cup-music'));
  };

  const handleMouseLeave = () => {
    mousePos.current = { x: 0, y: 0 };
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
              stroke="#00f3ff" 
              strokeWidth="0.04" 
            />
          ))}
        </g>

        {/* Render Fake Glows behind nodes */}
        <g className="ball-glows">
          {VERTICES.map((v, i) => (
            <circle 
              key={`glow-${i}`}
              ref={el => glowsRef.current[i] = el}
              fill={v[1] > 0 ? "var(--cyan, #00f3ff)" : "var(--blue, #3366ff)"}
            />
          ))}
        </g>

        {/* Render Core Nodes */}
        <g className="ball-nodes">
          {VERTICES.map((v, i) => (
            <circle 
              key={`node-${i}`}
              ref={el => nodesRef.current[i] = el}
              fill={v[1] > 0 ? "var(--cyan, #00f3ff)" : "var(--blue, #3366ff)"}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
