import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';
import { Overlays } from './overlays';

// 5s 시네마틱 프롤로그. S0와 문구가 겹치지 않도록 키커/리드 문장은 넣지 않는다
// (그 텍스트들은 S0 타이틀 화면이 담당). 여기선 타이틀 리빌 + '초록불' 모티프만.
export const INTRO_DURATION = 30 * 5; // 5s

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height >= width;
  const S = (land: number, port: number): number => (portrait ? port : land);

  const chars = [...'마지막 검증자'];
  const dots = [0, 1, 2, 3];
  const push = interpolate(frame, [0, 150], [1.06, 1.0], { extrapolateRight: 'clamp' });
  const outFade = interpolate(frame, [120, 150], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: outFade }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: S(40, 48),
          fontFamily: FONT,
          padding: S(80, 50),
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: S(150, 116),
            fontWeight: 800,
            letterSpacing: -3,
            color: C.txt,
            whiteSpace: portrait ? 'normal' : 'nowrap',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {chars.map((ch, i) => {
            const s = spring({ frame: frame - 12 - i * 5, fps, config: { damping: 200 } });
            return (
              <span key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 30}px)`, whiteSpace: 'pre' }}>
                {ch}
              </span>
            );
          })}
        </div>
        {/* 대시보드가 '전부 초록'으로 켜지고 — 하나만 붉게. 작품의 핵심 은유(텍스트 없음). */}
        <div style={{ display: 'flex', gap: S(18, 16), alignItems: 'center' }}>
          {dots.map((d) => {
            const last = d === 3;
            const on = interpolate(frame, [58 + d * 9, 74 + d * 9], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const col = last ? C.red : C.green;
            const sz = last ? S(22, 24) : S(17, 19);
            return (
              <div
                key={d}
                style={{
                  width: sz,
                  height: sz,
                  borderRadius: '50%',
                  background: col,
                  opacity: 0.22 + on * 0.78,
                  boxShadow: `0 0 ${12 + on * 20}px ${col}`,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
      <Overlays />
    </AbsoluteFill>
  );
};
