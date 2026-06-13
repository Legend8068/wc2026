import React from 'react';
import './BrandText.css';

const GLYPHS = {
  'A': { w: 100, d: "M 0,100 V 20 A 20,20 0 0,1 20,0 H 80 A 20,20 0 0,1 100,20 V 100 H 66 V 70 A 16,16 0 0,0 34,70 V 100 Z" },
  'B': { w: 90, d: "M 0,0 H 70 A 20,20 0 0,1 90,20 V 30 A 20,20 0 0,1 70,50 A 20,20 0 0,1 90,70 V 80 A 20,20 0 0,1 70,100 H 0 Z" },
  'C': { w: 90, d: "M 20,0 H 90 V 100 H 20 A 20,20 0 0,1 0,80 V 20 A 20,20 0 0,1 20,0 Z M 35,40 A 10,10 0 0,0 35,60 H 90 V 40 H 35 Z" },
  'D': { w: 100, d: "M 0,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 0 Z" },
  'E': { w: 85, d: "M 50,0 H 85 V 100 H 50 A 50,50 0 0,1 50,0 Z M 50,34 A 16,16 0 0,0 50,66 H 85 V 34 Z M 34,42 H 70 V 58 H 34 Z" },
  'F': { w: 85, d: "M 0,0 H 85 V 34 H 34 V 42 H 70 V 58 H 34 V 100 H 0 Z" },
  'G': { w: 100, d: "M 100,34 H 50 A 16,16 0 0,0 50,66 H 66 V 50 H 100 V 100 H 50 A 50,50 0 0,1 50,0 H 100 Z" },
  'H': { w: 100, d: "M 0,0 H 34 V 34 H 66 V 0 H 100 V 100 H 66 V 66 H 34 V 100 H 0 Z" },
  'I': { w: 34, d: "M 0,0 H 34 V 100 H 0 Z" },
  'J': { w: 100, d: "M 66,0 H 100 V 50 A 50,50 0 0,1 0,50 V 34 H 34 V 50 A 16,16 0 0,0 66,50 Z" },
  'K': { w: 100, d: "M 0,0 H 34 V 100 H 0 Z M 100,0 L 34,50 L 100,100 H 55 L 34,65 V 35 L 55,0 Z" },
  'L': { w: 100, d: "M 0,0 H 34 V 66 H 100 V 100 H 0 Z" },
  'M': { w: 120, d: "M 0,100 V 0 H 34 L 60,50 L 86,0 H 120 V 100 H 86 V 45 L 60,85 L 34,45 V 100 Z" },
  'N': { w: 100, d: "M 0,0 H 30 L 70,70 V 0 H 100 V 100 H 70 L 30,30 V 100 H 0 Z" },
  'O': { w: 100, d: "M 20,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 20 A 20,20 0 0,1 20,0 Z" },
  'P': { w: 93, d: "M 0,0 H 73 A 20,20 0 0,1 93,20 V 46 A 20,20 0 0,1 73,66 H 34 V 100 H 0 Z" },
  'Q': { w: 100, d: "M 20,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 20 A 20,20 0 0,1 20,0 Z M 60,80 L 100,100 H 70 L 50,90 Z" },
  'R': { w: 100, d: "M 0,0 H 73 A 20,20 0 0,1 93,20 V 46 A 20,20 0 0,1 73,66 H 68 L 100,100 H 66 L 34,66 V 100 H 0 Z" },
  'S': { w: 100, d: "M 100,0 V 34 H 34 V 42 H 100 V 100 H 0 V 66 H 66 V 58 H 0 V 0 Z" },
  'T': { w: 100, d: "M 0,0 H 100 V 34 H 67 V 100 H 33 V 34 H 0 Z" },
  'U': { w: 100, d: "M 0,0 V 50 A 50,50 0 0,0 100,50 V 0 H 66 V 50 A 16,16 0 0,1 34,50 V 0 Z" },
  'V': { w: 100, d: "M 0,0 H 34 L 50,70 L 66,0 H 100 L 50,100 Z" },
  'W': { w: 140, d: "M 0,0 H 34 L 50,70 L 70,20 L 90,70 L 106,0 H 140 L 105,100 H 75 L 70,60 L 65,100 H 35 Z" },
  'X': { w: 100, d: "M 0,0 H 34 L 50,40 L 66,0 H 100 L 67,50 L 100,100 H 66 L 50,60 L 34,100 H 0 L 33,50 Z" },
  'Y': { w: 100, d: "M 0,0 H 34 L 50,40 L 66,0 H 100 L 67,50 V 100 H 33 V 50 Z" },
  'Z': { w: 100, d: "M 0,0 H 100 V 30 L 40,70 H 100 V 100 H 0 V 70 L 60,30 H 0 Z" },
  '0': { w: 100, d: "M 20,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 20 A 20,20 0 0,1 20,0 Z" },
  '1': { w: 65, d: "M 20,0 H 45 A 20,20 0 0,1 65,20 V 100 H 35 V 30 L 20,30 Z" },
  '2': { w: 100, d: "M 0,25 V 20 A 20,20 0 0,1 20,0 H 80 A 20,20 0 0,1 100,20 V 60 H 35 V 80 H 80 A 20,20 0 0,1 100,100 H 20 A 20,20 0 0,1 0,80 V 40 H 65 V 25 H 0 Z" },
  '3': { w: 100, d: "M 0,25 V 20 A 20,20 0 0,1 20,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 75 H 65 V 55 H 30 V 45 H 65 V 25 H 0 Z" },
  '4': { w: 100, d: "M 65,0 H 100 V 80 A 20,20 0 0,1 80,100 H 65 V 85 H 0 V 60 L 65,0 Z" },
  '5': { w: 100, d: "M 100,25 V 20 A 20,20 0 0,0 80,0 H 20 A 20,20 0 0,0 0,20 V 60 H 65 V 80 H 20 A 20,20 0 0,0 0,100 H 80 A 20,20 0 0,0 100,80 V 40 H 35 V 25 H 100 Z" },
  '6': { w: 100, d: "M 20,0 H 80 A 20,20 0 0,1 100,20 V 25 H 35 V 45 H 100 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 20 A 20,20 0 0,1 20,0 Z" },
  '7': { w: 100, d: "M 0,20 A 20,20 0 0,1 20,0 H 80 A 20,20 0 0,1 100,20 V 30 L 40,100 H 0 L 60,30 H 0 Z" },
  '8': { w: 100, d: "M 0,20 A 20,20 0 0,1 20,0 H 80 A 20,20 0 0,1 100,20 V 35 L 65,50 L 100,65 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 65 L 35,50 L 0,35 Z" },
  '9': { w: 100, d: "M 20,0 H 80 A 20,20 0 0,1 100,20 V 80 A 20,20 0 0,1 80,100 H 20 A 20,20 0 0,1 0,80 V 75 H 65 V 55 H 0 V 20 A 20,20 0 0,1 20,0 Z" },
  '·': { w: 32, d: "M 16,16 A 16,16 0 1,1 16,48 A 16,16 0 1,1 16,16 Z" }
};

export default function BrandText({ text, className = "", style = {}, useBallForZero = false }) {
  if (!text) return null;
  const chars = String(text).toUpperCase().split('');
  
  return (
    <div className={`brand-text ${className}`} style={{ ...style }} aria-label={text}>
      {chars.map((char, index) => {
        if (char === ' ') {
          return <span key={index} className="brand-char space"></span>;
        }
        
        const g = GLYPHS[char];
        if (!g) {
          return <span key={index} className="brand-char fallback">{char}</span>;
        }
        
        if (char === '0' && useBallForZero) {
          return (
            <svg 
              key={index}
              viewBox={`0 0 ${g.w} 100`} 
              className="brand-char brand-char-ball"
              style={{ width: `${g.w * 0.01}em` }}
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`brand-ball-clip-${index}`}><rect x="0" y="0" width="100" height="100" rx="20" ry="20" /></clipPath>
                <radialGradient id={`brand-ball-shade-${index}`} cx="36%" cy="30%" r="80%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="62%" stopColor="#f5f7fa" />
                  <stop offset="100%" stopColor="#dfe5ee" />
                </radialGradient>
              </defs>
              <g clipPath={`url(#brand-ball-clip-${index})`}>
                <rect x="0" y="0" width="100" height="100" fill={`url(#brand-ball-shade-${index})`} />
                <ellipse cx="33" cy="28" rx="24" ry="17" fill="#ffffff" opacity="0.5" />
                
                {/* Seam Lines */}
                <g stroke="#d5d0c5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {/* Central Hexagon */}
                  <polygon points="34,14 66,14 80,50 66,86 34,86 20,50" />
                  {/* Radiating Seams */}
                  <path d="M 34,14 L 15,-2" />
                  <path d="M 66,14 L 85,-2" />
                  <path d="M 20,50 L -2,40" />
                  <path d="M 20,50 L -2,60" />
                  <path d="M 80,50 L 102,40" />
                  <path d="M 80,50 L 102,60" />
                  <path d="M 34,86 L 15,102" />
                  <path d="M 66,86 L 85,102" />
                </g>

                {/* Confetti & Branding Patterns */}
                <g strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 1.5px 1.5px rgba(0,0,0,0.15))">
                  {/* Top fountain */}
                  <path d="M48,30 C45,24 40,20 35,22" stroke="#a31f47" className="confetti-wiggle" />
                  <path d="M52,30 C55,24 60,20 65,22" stroke="#298888" className="confetti-wiggle" />
                  <path d="M50,28 C50,20 55,14 62,12" stroke="#4a256a" className="confetti-wiggle" />
                  <path d="M46,26 C40,20 42,10 48,10" stroke="#d1a74d" className="confetti-wiggle" />
                  
                  <polygon points="38,12 43,8 44,16" fill="none" stroke="#a31f47" className="confetti-spin" />
                  <polygon points="62,14 68,18 58,18" fill="none" stroke="#298888" className="confetti-spin" />
                  <circle cx="56" cy="8" r="2.5" fill="none" stroke="#4a256a" className="confetti-pulse" />
                  <circle cx="38" cy="6" r="2" fill="none" stroke="#d1a74d" className="confetti-pulse" />

                  {/* Left */}
                  <path d="M38,40 C32,40 28,35 30,30" stroke="#a31f47" className="confetti-wiggle" />
                  <polygon points="26,42 32,48 22,48" fill="none" stroke="#298888" className="confetti-spin" />
                  <polygon points="35,52 30,56 38,56" fill="none" stroke="#4a256a" className="confetti-spin" />
                  <path d="M26,54 C32,58 36,54 38,60" stroke="#e06b26" className="confetti-wiggle" />
                  <circle cx="24" cy="34" r="2" fill="none" stroke="#d1a74d" className="confetti-pulse" />

                  {/* Right */}
                  <path d="M62,40 C68,40 72,35 70,30" stroke="#4a256a" className="confetti-wiggle" />
                  <polygon points="74,42 68,48 78,48" fill="none" stroke="#a31f47" className="confetti-spin" />
                  <polygon points="65,52 70,56 62,56" fill="none" stroke="#298888" className="confetti-spin" />
                  <path d="M74,54 C68,58 64,54 62,60" stroke="#8db544" className="confetti-wiggle" />
                  <circle cx="76" cy="34" r="2.5" fill="none" stroke="#d1a74d" className="confetti-pulse" />

                  {/* Bottom */}
                  <path d="M45,72 C45,78 40,82 35,78" stroke="#298888" className="confetti-wiggle" />
                  <path d="M55,72 C55,78 60,82 65,78" stroke="#a31f47" className="confetti-wiggle" />
                  <polygon points="50,76 55,82 45,82" fill="none" stroke="#4a256a" className="confetti-spin" />
                  <circle cx="40" cy="84" r="2" fill="none" stroke="#d1a74d" className="confetti-pulse" />
                  <circle cx="60" cy="84" r="2" fill="none" stroke="#298888" className="confetti-pulse" />
                  <polygon points="32,74 36,70 34,78" fill="none" stroke="#a31f47" className="confetti-spin" />
                  <polygon points="68,74 64,70 66,78" fill="none" stroke="#d1a74d" className="confetti-spin" />
                </g>

                {/* World Cup Trophy */}
                <g fill="#c49a3f" transform="translate(50, 50) scale(1.4) translate(-50, -50)" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.2))">
                  {/* Base */}
                  <path d="M46.5 64 h7 l1 3 h-9 z" />
                  <path d="M46 60 h8 l.5 3 h-9 z" />
                  {/* Figures holding globe */}
                  <path d="M46 60 c-1.5-6 -4-10 -4-15 c0-5 3-4 4-2 c0 0 2-4 6-2 c1-1 4-2 4 2 c0 5 -2.5 9 -4 15 z" />
                  {/* Globe */}
                  <circle cx="50" cy="40" r="4.5" />
                </g>
                
                <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="none" stroke="#d5d0c5" strokeWidth="2.5" />
              </g>
              {/* subtle gold frame echoing the rounded shape */}
              <rect x="1.5" y="1.5" width="97" height="97" rx="18.5" fill="none" stroke="#f5c542" strokeWidth="1.4" opacity="0.5" />
            </svg>
          );
        }
        
        return (
          <svg 
            key={index}
            viewBox={`0 0 ${g.w} 100`} 
            className="brand-char"
            style={{ width: `${g.w * 0.01}em` }}
            aria-hidden="true"
          >
            <path fillRule="nonzero" d={g.d} />
          </svg>
        );
      })}
    </div>
  );
}
