/**
 * audio.ts — 사운드 매니저. (TECH_SPEC §6/§9, DESIGN_SYSTEM §6, FR-9)
 * 전부 Web Audio API로 **합성**(외부 에셋 0, 저작권 안전). 기본 음소거.
 * 브라우저 자동재생 정책: AudioContext는 **사용자 제스처(시작 버튼) 이후** 생성/resume.
 * 음소거 토글(TopBar)과 onMuteChange로 연동. reduced-motion과 무관(시각 대체는 항상 존재).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let humGain: GainNode | null = null;
let humNodes: OscillatorNode[] = [];
let enabled = false; // 사용자 제스처로 활성화됐는가
let muted = true; // 기본 음소거

const MASTER_LEVEL = 0.75;

/** 디버그/검증용 상태 */
export function audioState(): Record<string, unknown> {
  return {
    ctx: ctx?.state ?? 'none',
    enabled,
    muted,
    master: master ? Math.round(master.gain.value * 100) / 100 : null,
    humNodes: humNodes.length,
  };
}

function ensureContext(): boolean {
  if (ctx) return true;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_LEVEL;
  master.connect(ctx.destination);
  return true;
}

/** 시작 버튼(첫 제스처)에서 호출 — 컨텍스트 활성 + 앰비언트 험 시작 */
export function activateAudio(): void {
  if (!ensureContext() || !ctx || !master) return;
  enabled = true;
  if (ctx.state === 'suspended') void ctx.resume();
  startHum();
}

export function setMuted(m: boolean): void {
  muted = m;
  if (master && ctx) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.linearRampToValueAtTime(m ? 0 : MASTER_LEVEL, now + 0.2);
  }
}

function startHum(): void {
  if (!ctx || !master || humNodes.length) return;
  humGain = ctx.createGain();
  humGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 720; // 중역을 통과시켜 노트북 스피커에서도 들리게
  lp.Q.value = 0.7;
  humGain.connect(lp).connect(master);

  // 따뜻한 임상 드론: 근음(A2) + 살짝 디튠 + 5도 + 옥타브
  const voices: Array<[number, OscillatorType, number]> = [
    [110, 'triangle', 0.5],
    [110.5, 'sine', 0.32],
    [164.8, 'sine', 0.28],
    [220, 'sine', 0.2],
  ];
  for (const [f, type, g] of voices) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const vg = ctx.createGain();
    vg.gain.value = g;
    o.connect(vg).connect(humGain);
    o.start();
    humNodes.push(o);
  }

  // 부드러운 페이드인 + 미세 호흡 LFO
  const now = ctx.currentTime;
  humGain.gain.setValueAtTime(0, now);
  humGain.gain.linearRampToValueAtTime(0.12, now + 1.6);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.09;
  lfoGain.gain.value = 0.035;
  lfo.connect(lfoGain).connect(humGain.gain);
  lfo.start();
  humNodes.push(lfo);
}

/** 톤 1발 합성(엔벨로프) */
function tone(opts: { freq: number; type?: OscillatorType; dur?: number; level?: number; delay?: number; sweepTo?: number }): void {
  if (!ctx || !master || !enabled) return;
  const { freq, type = 'sine', dur = 0.18, level = 0.18, delay = 0, sweepTo } = opts;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(level, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/* ── 큐(시각 연출과 동기) ── */
export const audio = {
  /** KPI 초록 점등 '딩'(밝고 짧게) */
  ding(): void {
    tone({ freq: 880, type: 'triangle', dur: 0.18, level: 0.24 });
    tone({ freq: 1320, type: 'sine', dur: 0.26, level: 0.16, delay: 0.04 });
    tone({ freq: 1760, type: 'sine', dur: 0.2, level: 0.08, delay: 0.06 });
  },
  /** 보존 선택 '둔탁한 톤' */
  thud(): void {
    tone({ freq: 160, type: 'triangle', dur: 0.28, level: 0.28, sweepTo: 90 });
  },
  /** S4 경보 꺼짐 — 험이 끊기고 정적. 오실레이터를 정지·해제해 리플레이 시 재생성 가능하게 한다. */
  alarmOff(): void {
    if (!ctx || !humGain) return;
    const now = ctx.currentTime;
    humGain.gain.cancelScheduledValues(now);
    humGain.gain.linearRampToValueAtTime(0, now + 0.5);
    const stopAt = now + 0.6;
    for (const o of humNodes) {
      try {
        o.stop(stopAt);
      } catch {
        /* already stopped */
      }
    }
    humNodes = []; // 비워서 다음 startHum()이 새 험을 만들 수 있게
    humGain = null;
  },
  /** S8 모니터 비프 + 긴장 드론 */
  monitor(): void {
    tone({ freq: 1046, type: 'square', dur: 0.1, level: 0.12 });
    tone({ freq: 1046, type: 'square', dur: 0.1, level: 0.12, delay: 0.55 });
    tone({ freq: 110, type: 'sawtooth', dur: 2.0, level: 0.14, sweepTo: 90 });
  },
  /** 엔딩/명제 저음 임팩트 */
  impact(): void {
    tone({ freq: 90, type: 'triangle', dur: 1.4, level: 0.32, sweepTo: 45 });
    tone({ freq: 180, type: 'sine', dur: 0.6, level: 0.14 });
  },
};
