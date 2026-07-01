import React from 'react';
import { AbsoluteFill } from 'remotion';

// 본편/트레일러 공유 시네마틱 오버레이
export const Scanlines: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      opacity: 0.05,
      backgroundImage:
        'repeating-linear-gradient(to bottom, rgba(255,255,255,.6) 0, rgba(255,255,255,.6) 1px, transparent 1px, transparent 3px)',
    }}
  />
);

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.72) 100%)',
    }}
  />
);

export const Grain: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'overlay' }}>
    <svg width="100%" height="100%">
      <filter id="grain-n">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-n)" />
    </svg>
  </AbsoluteFill>
);

export const Letterbox: React.FC = () => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 84, background: '#000' }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, background: '#000' }} />
  </>
);

export const Overlays: React.FC = () => (
  <>
    <Scanlines />
    <Grain />
    <Vignette />
    <Letterbox />
  </>
);
