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
                  <stop offset="0%" stopColor="#BFD7EA" />
                  <stop offset="62%" stopColor="#f5f7fa" />
                  <stop offset="100%" stopColor="#dfe5ee" />
                </radialGradient>
              </defs>
              <g clipPath={`url(#brand-ball-clip-${index})`}>
                <rect x="0" y="0" width="100" height="100" fill={`url(#brand-ball-shade-${index})`} />
                <ellipse cx="33" cy="28" rx="24" ry="17" fill="#BFD7EA" opacity="0.5" />
                
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
                <g strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 1.5px 1.5px rgba(0,0,0,0.15))">
                  {/* Top Left */}
                  <path d="M30,30 L20,20 M25,15 L15,25" stroke="#a31f47" className="confetti-shoot-tl" />
                  <polygon points="25,35 30,40 20,40" fill="#298888" stroke="none" className="confetti-shoot-tl" />
                  <circle cx="35" cy="25" r="3" fill="#d1a74d" stroke="none" className="confetti-shoot-tl" style={{animationDelay: '0.2s'}} />
                  
                  {/* Top Right */}
                  <path d="M70,30 L80,20 M75,15 L85,25" stroke="#298888" className="confetti-shoot-tr" />
                  <polygon points="75,35 70,40 80,40" fill="#a31f47" stroke="none" className="confetti-shoot-tr" />
                  <circle cx="65" cy="25" r="3" fill="#4a256a" stroke="none" className="confetti-shoot-tr" style={{animationDelay: '0.1s'}} />
                  
                  {/* Bottom Left */}
                  <path d="M30,70 L20,80 M25,85 L15,75" stroke="#4a256a" className="confetti-shoot-bl" />
                  <polygon points="25,65 30,60 20,60" fill="#e06b26" stroke="none" className="confetti-shoot-bl" style={{animationDelay: '0.3s'}} />
                  <circle cx="35" cy="75" r="3" fill="#d1a74d" stroke="none" className="confetti-shoot-bl" />
                  
                  {/* Bottom Right */}
                  <path d="M70,70 L80,80 M75,85 L85,75" stroke="#e06b26" className="confetti-shoot-br" />
                  <polygon points="75,65 70,60 80,60" fill="#298888" stroke="none" className="confetti-shoot-br" style={{animationDelay: '0.15s'}} />
                  <circle cx="65" cy="75" r="3" fill="#a31f47" stroke="none" className="confetti-shoot-br" />
                  
                  {/* Popping center accents */}
                  <circle cx="50" cy="15" r="2.5" fill="#d1a74d" stroke="none" className="confetti-pop" />
                  <circle cx="50" cy="85" r="2.5" fill="#d1a74d" stroke="none" className="confetti-pop" style={{animationDelay: '0.2s'}} />
                  <circle cx="15" cy="50" r="2.5" fill="#4a256a" stroke="none" className="confetti-pop" style={{animationDelay: '0.4s'}} />
                  <circle cx="85" cy="50" r="2.5" fill="#298888" stroke="none" className="confetti-pop" style={{animationDelay: '0.1s'}} />
                </g>

                {/* World Cup Trophy */}
                <g transform="translate(50, 48) scale(1.6) translate(-50, -50)" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.3))">
                  {/* Base Layers */}
                  <path d="M44.5 68 L43 72 H57 L55.5 68 Z" fill="#c29b38" />
                  <path d="M45 66 H55 L55.5 68 H44.5 Z" fill="#184a28" />
                  <path d="M45.5 62 H54.5 L55 66 H45 Z" fill="#e8c253" />
                  <path d="M46 60 H54 L54.5 62 H45.5 Z" fill="#184a28" />
                  <path d="M46.5 56 H53.5 L54 60 H46 Z" fill="#e8c253" />
                  
                  {/* Left Figure */}
                  <path d="M46.5 56 C 44 48, 41 40, 45 31 C 48 29, 49 32, 48 35 C 47 39, 49 46, 50 50 C 49 53, 47 55, 46.5 56 Z" fill="#d9b141" />
                  
                  {/* Right Figure */}
                  <path d="M53.5 56 C 56 48, 59 40, 55 31 C 52 29, 51 32, 52 35 C 53 39, 51 46, 50 50 C 51 53, 53 55, 53.5 56 Z" fill="#ebd170" />
                  
                  {/* Globe */}
                  <circle cx="50" cy="28" r="6" fill="#fce588" />
                  <path d="M45.5 25 Q 48 22 51 26 T 55 24 M 46 30 Q 50 28 53 32" stroke="#d9b141" strokeWidth="1.2" strokeLinecap="round" fill="none" />
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
