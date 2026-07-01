import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';
import { Overlays } from './overlays';

export const INTRO_DURATION = 30 * 8; // 8s

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kicker = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: 'clamp' });
  const chars = [...'마지막 검증자'];
  const lead = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp' });

  // 초록 점등 모티프(한 점은 빨강)
  const dots = [0, 1, 2, 3];

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: outFade }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 30,
          fontFamily: FONT,
        }}
      >
        <div style={{ opacity: kicker, color: C.mut2, letterSpacing: 12, fontSize: 26 }}>
          PRE-MORTEM · 인터랙티브
        </div>
        <div style={{ display: 'flex', fontSize: 138, fontWeight: 800, letterSpacing: -3, color: C.txt }}>
          {chars.map((ch, i) => {
            const s = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 200 } });
            return (
              <span
                key={i}
                style={{ opacity: s, transform: `translateY(${(1 - s) * 26}px)`, whiteSpace: 'pre' }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ opacity: lead, display: 'flex', gap: 16, alignItems: 'center' }}>
          {dots.map((d) => {
            const last = d === 3;
            const on = interpolate(frame, [140 + d * 8, 152 + d * 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const col = last ? C.red : C.green;
            return (
              <div
                key={d}
                style={{
                  width: last ? 20 : 16,
                  height: last ? 20 : 16,
                  borderRadius: '50%',
                  background: col,
                  opacity: 0.25 + on * 0.75,
                  boxShadow: `0 0 ${12 + on * 18}px ${col}`,
                }}
              />
            );
          })}
        </div>
        <div style={{ opacity: lead, color: C.mut, fontSize: 28 }}>10년 뒤, 그 초록불의 대가를 보게 됩니다.</div>
      </AbsoluteFill>
      <Overlays />
    </AbsoluteFill>
  );
};
