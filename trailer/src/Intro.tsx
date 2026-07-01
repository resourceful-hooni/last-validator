import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';
import { Overlays } from './overlays';

export const INTRO_DURATION = 30 * 8; // 8s

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height >= width;
  const S = (land: number, port: number): number => (portrait ? port : land);

  const kicker = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: 'clamp' });
  const chars = [...'마지막 검증자'];
  const lead = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp' });
  const dots = [0, 1, 2, 3];

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: outFade }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: S(30, 40),
          fontFamily: FONT,
          padding: S(80, 50),
        }}
      >
        <div style={{ opacity: kicker, color: C.mut2, letterSpacing: S(12, 8), fontSize: S(26, 30) }}>
          PRE-MORTEM · 인터랙티브
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: S(138, 108),
            fontWeight: 800,
            letterSpacing: -3,
            color: C.txt,
            whiteSpace: portrait ? 'normal' : 'nowrap',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {chars.map((ch, i) => {
            const s = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 200 } });
            return (
              <span key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 26}px)`, whiteSpace: 'pre' }}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ opacity: lead, display: 'flex', gap: S(16, 14), alignItems: 'center' }}>
          {dots.map((d) => {
            const last = d === 3;
            const on = interpolate(frame, [140 + d * 8, 152 + d * 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const col = last ? C.red : C.green;
            const sz = last ? S(20, 22) : S(16, 18);
            return (
              <div
                key={d}
                style={{
                  width: sz,
                  height: sz,
                  borderRadius: '50%',
                  background: col,
                  opacity: 0.25 + on * 0.75,
                  boxShadow: `0 0 ${12 + on * 18}px ${col}`,
                }}
              />
            );
          })}
        </div>
        <div style={{ opacity: lead, color: C.mut, fontSize: S(28, 30), textAlign: 'center' }}>
          10년 뒤, 그 초록불의 대가를 보게 됩니다.
        </div>
      </AbsoluteFill>
      <Overlays />
    </AbsoluteFill>
  );
};
