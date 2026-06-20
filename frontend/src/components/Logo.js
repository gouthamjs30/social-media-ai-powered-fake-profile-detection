import React from 'react';

// Spiderweb logo SVG matching the UI screenshots
export const SpiderWebLogo = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer web lines */}
    <line x1="50" y1="5" x2="50" y2="95" stroke="#111" strokeWidth="1.5"/>
    <line x1="5" y1="50" x2="95" y2="50" stroke="#111" strokeWidth="1.5"/>
    <line x1="15" y1="15" x2="85" y2="85" stroke="#111" strokeWidth="1.5"/>
    <line x1="85" y1="15" x2="15" y2="85" stroke="#111" strokeWidth="1.5"/>
    {/* Web circles */}
    <ellipse cx="50" cy="50" rx="44" ry="44" stroke="#111" strokeWidth="1.5" fill="none"/>
    <ellipse cx="50" cy="50" rx="30" ry="30" stroke="#111" strokeWidth="1.5" fill="none"/>
    <ellipse cx="50" cy="50" rx="16" ry="16" stroke="#22C55E" strokeWidth="2" fill="none"/>
    {/* Center dot */}
    <circle cx="50" cy="50" r="4" fill="#22C55E"/>
    {/* Diagonal connections at outer ring */}
    <path d="M50 6 L72 20 L86 44 L86 56 L72 80 L50 94 L28 80 L14 56 L14 44 L28 20 Z" stroke="#111" strokeWidth="0.8" fill="none"/>
    <path d="M50 20 L64 28 L72 44 L72 56 L64 72 L50 80 L36 72 L28 56 L28 44 L36 28 Z" stroke="#111" strokeWidth="0.8" fill="none"/>
  </svg>
);

export const MayajalBrand = ({ light = false }) => (
  <div style={{ textAlign: 'center' }}>
    <SpiderWebLogo size={64} />
    <div style={{ marginTop: 10 }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: light ? '#fff' : '#111', letterSpacing: 1 }}>MAYA</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: '#22C55E', letterSpacing: 1 }}>JAL</span>
    </div>
    <div style={{ fontSize: 11, color: light ? 'rgba(255,255,255,0.5)' : '#9CA3AF', marginTop: 4, letterSpacing: 2, fontWeight: 500 }}>
      AI-POWERED <span style={{ color: '#22C55E', fontWeight: 700 }}>FRAUD</span> DETECTION
    </div>
  </div>
);

export default SpiderWebLogo;
