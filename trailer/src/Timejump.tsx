import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';
import { Overlays } from './overlays';

export const TIMEJUMP_DURATION = 30 * 6; // 6s

export const Timejump: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 연도 2026 → 2036 가속(이징)
  const t = interpolate(frame, [10, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const eased = t * t * (3 - 2 * t);
  const year = Math.round(2026 + eased * 10);
  const blur = interpolate(frame, [10, 60, 95], [0, 10, 0], { extrapolateRight: 'clamp' });
  const impact = spring({ frame: frame - 95, fps, config: { damping: 200 } });
  const date = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [155, 180], [1, 0], { extrapolateLeft: 'clamp' });

  // 모니터 파형(추상)
  const beeps = Array.from({ length: 40 });

  return (
    <AbsoluteFill style={{ background: '#07090c', opacity: outFade }}>
      {/* 배경 심전도 파형 */}
      <AbsoluteFill style={{ opacity: 0.18, justifyContent: 'center' }}>
        <svg width="100%" height="220" viewBox="0 0 1920 220" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={C.green}
            strokeWidth="2"
            points={beeps
              .map((_, i) => {
                const x = (i / 40) * 1920;
                const spike = i % 8 === (Math.floor(frame / 3) % 8);
                const y = 110 - (spike ? 70 : Math.sin(i + frame * 0.2) * 6);
                return `${x},${y} ${x + 12},${spike ? 175 : 110} ${x + 24},110`;
              })
              .join(' ')}
          />
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 22, fontFamily: FONT }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            letterSpacing: -6,
            color: C.txt,
            filter: `blur(${blur}px)`,
            transform: `scale(${0.9 + impact * 0.12})`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {year}
        </div>
        <div style={{ opacity: date, color: C.mut, fontSize: 40 }}>3월 · 새벽 3시 17분</div>
      </AbsoluteFill>
      <Overlays />
    </AbsoluteFill>
  );
};
