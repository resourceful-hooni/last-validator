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

const MASTER_LEVEL = 0.5;

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
  humGain.gain.value = 0.06;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 220;
  humGain.connect(lp).connect(master);
  for (const f of [55, 82.5]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(humGain);
    o.start();
    humNodes.push(o);
  }
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
    tone({ freq: 880, type: 'triangle', dur: 0.16, level: 0.16 });
    tone({ freq: 1320, type: 'sine', dur: 0.22, level: 0.1, delay: 0.04 });
  },
  /** 보존 선택 '둔탁한 톤' */
  thud(): void {
    tone({ freq: 150, type: 'sine', dur: 0.26, level: 0.2, sweepTo: 90 });
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
    tone({ freq: 1000, type: 'square', dur: 0.09, level: 0.08 });
    tone({ freq: 1000, type: 'square', dur: 0.09, level: 0.08, delay: 0.5 });
    tone({ freq: 70, type: 'sine', dur: 1.6, level: 0.12 });
  },
  /** 엔딩 저음 임팩트 */
  impact(): void {
    tone({ freq: 60, type: 'sine', dur: 1.2, level: 0.22, sweepTo: 40 });
  },
};
