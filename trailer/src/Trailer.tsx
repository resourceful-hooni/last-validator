import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, FONT } from './theme';

export const TRAILER_FPS = 30;
export const TRAILER_DURATION = 30 * 78; // 78s

// ── 공통 오버레이 ──
const Scanlines: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      opacity: 0.05,
      backgroundImage:
        'repeating-linear-gradient(to bottom, rgba(255,255,255,.6) 0, rgba(255,255,255,.6) 1px, transparent 1px, transparent 3px)',
    }}
  />
);
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.72) 100%)',
    }}
  />
);
const Letterbox: React.FC = () => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 84, background: '#000' }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, background: '#000' }} />
  </>
);
const Grain: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'overlay' }}>
    <svg width="100%" height="100%">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  </AbsoluteFill>
);

const center: React.CSSProperties = {
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  fontFamily: FONT,
};

// 페이드 인/아웃 헬퍼
const useFade = (inF: number, outStart: number, outEnd: number): number => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, inF], [0, 1], { extrapolateRight: 'clamp' });
  const b = interpolate(f, [outStart, outEnd], [1, 0], { extrapolateLeft: 'clamp' });
  return Math.min(a, b);
};

// ── Beat 1: 타이틀 ──
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [6, 24], [0, 1], { extrapolateRight: 'clamp' });
  const chars = [...'마지막 검증자'];
  const lead = useFade(30, 200, 240);
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, flexDirection: 'column', gap: 26 }}>
      <div style={{ opacity: kicker, color: C.mut2, letterSpacing: 10, fontSize: 26 }}>
        PRE-MORTEM · 인터랙티브
      </div>
      <div style={{ display: 'flex', fontSize: 132, fontWeight: 800, letterSpacing: -2, color: C.txt }}>
        {chars.map((ch, i) => {
          const s = spring({ frame: frame - 18 - i * 3, fps, config: { damping: 200 } });
          return (
            <span key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 22}px)`, whiteSpace: 'pre' }}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ opacity: lead, color: C.mut, fontSize: 30, maxWidth: 900 }}>
        10년 뒤, 그 초록불의 대가를 보게 됩니다.
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 2: 초록불 약속 ──
const GreenPromise: React.FC = () => {
  const a = useFade(24, 210, 260);
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, flexDirection: 'column', gap: 20, opacity: a }}>
      <div style={{ color: C.mut, fontSize: 34, maxWidth: 1100, lineHeight: 1.5 }}>
        당신은 2026년, 한 병원 시스템의 결정권자입니다.
      </div>
      <div style={{ color: C.txt, fontSize: 46, fontWeight: 700, maxWidth: 1200, lineHeight: 1.4 }}>
        대시보드의 모든 불이 <span style={{ color: C.green }}>초록색</span>이 될 겁니다.
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 3: 대시보드 점등 + vCap 하강 ──
const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const labels = ['판독 처리량', '비용 절감', 'AI 일치율', '환자 대기'];
  const vcap = Math.round(interpolate(frame, [120, 260], [100, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const a = useFade(20, 270, 300);
  const vColor = vcap > 70 ? C.green : vcap > 40 ? C.amber : C.red;
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, opacity: a }}>
      <div style={{ width: 1200 }}>
        <div style={{ color: C.mut2, letterSpacing: 4, fontSize: 20, marginBottom: 18, fontFamily: FONT }}>
          운영 대시보드
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {labels.map((l, i) => {
            const lit = frame > 40 + i * 28;
            return (
              <div
                key={i}
                style={{
                  padding: '22px 20px',
                  borderRadius: 12,
                  border: `1px solid ${lit ? C.green : C.line}`,
                  background: C.surf,
                  boxShadow: lit ? `0 0 0 1px ${C.greenGlow}, 0 0 40px -8px ${C.greenGlow}` : 'none',
                  fontFamily: FONT,
                  textAlign: 'left',
                }}
              >
                <div style={{ color: C.mut, fontSize: 22 }}>{l}</div>
                <div style={{ color: lit ? C.green : C.mut2, fontSize: 28, fontWeight: 700, marginTop: 8 }}>
                  {lit ? '정상' : '기준'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', color: vColor, fontSize: 22, fontFamily: FONT }}>
          <span style={{ color: C.mut2, letterSpacing: 2 }}>독립 검증 역량</span>
          <span style={{ fontWeight: 700 }}>{vcap}%</span>
        </div>
        <div style={{ height: 8, background: C.surf, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${vcap}%`, background: vColor, borderRadius: 4 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 4: 성공, 그러나 ──
const Success: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [10, 34], [0, 1], { extrapolateRight: 'clamp' });
  const b = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: 'clamp' });
  const out = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, flexDirection: 'column', gap: 30, opacity: out }}>
      <div style={{ opacity: a, color: C.green, fontSize: 56, fontWeight: 800 }}>
        당신의 2026년은 성공적이었습니다.
      </div>
      <div style={{ opacity: b, color: C.txt, fontSize: 38, fontWeight: 700 }}>
        하지만 아무도 이 숫자는 보지 않았습니다.
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 5: 리빌 ──
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [10, 55], [100, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const sub = useFade(70, 200, 240);
  const a = useFade(10, 210, 240);
  return (
    <AbsoluteFill style={{ ...center, background: '#000', flexDirection: 'column', gap: 12, opacity: a }}>
      <div style={{ color: C.mut2, letterSpacing: 6, fontSize: 22, fontFamily: FONT }}>측정되지 않던 지표</div>
      <div style={{ display: 'flex', alignItems: 'baseline', color: C.red, fontWeight: 900, fontFamily: FONT }}>
        <span style={{ fontSize: 220, letterSpacing: -6 }}>{n}</span>
        <span style={{ fontSize: 90 }}>%</span>
      </div>
      <div style={{ opacity: sub, color: C.mut, fontSize: 30, fontFamily: FONT }}>
        독립 검증 역량 — AI 없이 스스로 판독할 수 있는 힘
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 6: 2036 ──
const Y2036: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const ring = interpolate(frame % 90, [0, 45, 90], [0.3, 0.8, 0.3]);
  const date = useFade(40, 250, 290);
  const a = useFade(8, 260, 300);
  return (
    <AbsoluteFill style={{ ...center, background: '#07090c', flexDirection: 'column', gap: 24, opacity: a }}>
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', border: `2px solid ${C.red}`, opacity: ring * 0.4 }} />
      <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', border: `1px solid ${C.red}`, opacity: ring * 0.3 }} />
      <div style={{ transform: `scale(${0.8 + s * 0.2})`, color: C.txt, fontSize: 160, fontWeight: 900, fontFamily: FONT }}>
        2036
      </div>
      <div style={{ opacity: date, color: C.mut, fontSize: 34, fontFamily: FONT }}>
        3월 · 새벽 3시 17분
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 7: 명제 ──
const Thesis: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: 'clamp' });
  const b = interpolate(frame, [70, 105], [0, 1], { extrapolateRight: 'clamp' });
  const out = interpolate(frame, [260, 300], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, flexDirection: 'column', gap: 22, opacity: out }}>
      <div style={{ opacity: a, color: C.txt, fontSize: 68, fontWeight: 800 }}>AI는 일자리를 빼앗지 않았다.</div>
      <div style={{ opacity: b, color: C.red, fontSize: 68, fontWeight: 800, transform: `translateY(${(1 - b) * 14}px)` }}>
        그것을 검증할 능력을 비웠다.
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 8: CTA / 로고 ──
const Outro: React.FC = () => {
  const a = useFade(24, 330, 380);
  const line = useFade(50, 330, 380);
  return (
    <AbsoluteFill style={{ ...center, background: C.bg, flexDirection: 'column', gap: 26, opacity: a }}>
      <div style={{ color: C.mut, fontSize: 34, maxWidth: 1200, lineHeight: 1.5 }}>
        막을 수 있습니다 — 오늘.
      </div>
      <div style={{ color: C.txt, fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>마지막 검증자</div>
      <div style={{ opacity: line, color: C.mut2, fontSize: 24, maxWidth: 1200, lineHeight: 1.5 }}>
        「마지막 검증자」 · 2026 KAIST AI × 실패 아이디어 공모전 보완 자료
      </div>
    </AbsoluteFill>
  );
};

export const Trailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={0} durationInFrames={240}><Title /></Sequence>
      <Sequence from={240} durationInFrames={270}><GreenPromise /></Sequence>
      <Sequence from={510} durationInFrames={300}><Dashboard /></Sequence>
      <Sequence from={810} durationInFrames={240}><Success /></Sequence>
      <Sequence from={1050} durationInFrames={240}><Reveal /></Sequence>
      <Sequence from={1290} durationInFrames={300}><Y2036 /></Sequence>
      <Sequence from={1590} durationInFrames={300}><Thesis /></Sequence>
      <Sequence from={1890} durationInFrames={TRAILER_DURATION - 1890}><Outro /></Sequence>

      {/* 전역 시네마틱 오버레이 */}
      <Scanlines />
      <Grain />
      <Vignette />
      <Letterbox />
    </AbsoluteFill>
  );
};
