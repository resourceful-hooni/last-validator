import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from './theme';
import { Overlays } from './overlays';

export const FINALE_DURATION = 30 * 8; // 8s

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();

  const line1 = interpolate(frame, [24, 54], [0, 1], { extrapolateRight: 'clamp' });
  const line2 = interpolate(frame, [80, 116], [0, 1], { extrapolateRight: 'clamp' });
  const line2y = interpolate(frame, [80, 116], [16, 0], { extrapolateRight: 'clamp' });
  const cta = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: outFade }}>
      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 26, fontFamily: FONT, padding: 60 }}
      >
        <div style={{ opacity: line1, color: C.txt, fontSize: 78, fontWeight: 800, textAlign: 'center', letterSpacing: -1 }}>
          AI는 일자리를 빼앗지 않았다.
        </div>
        <div
          style={{
            opacity: line2,
            transform: `translateY(${line2y}px)`,
            color: C.red,
            fontSize: 78,
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: -1,
          }}
        >
          그것을 검증할 능력을 비웠다.
        </div>
        <div style={{ opacity: cta, color: C.mut, fontSize: 30, marginTop: 20, textAlign: 'center' }}>
          막을 수 있습니다 — 오늘.
        </div>
      </AbsoluteFill>
      <Overlays />
    </AbsoluteFill>
  );
};
