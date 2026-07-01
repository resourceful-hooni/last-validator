/**
 * narration.ts — 감정 낭독(사전 생성 Kokoro mp3) 재생 매니저. (사용자 요청)
 * - **영어(en) 로케일만** 클립 존재(오픈 감정 TTS가 한국어를 지원하지 않아 en 한정). 그 외 로케일은 무음(우아한 폴백).
 * - **옵트인 토글**(기본 OFF, localStorage) + 음소거 연동 + 첫 사용자 제스처 이후에만 재생(자동재생 정책).
 * - 씬 enter에서 start(), exit/teardown에서 stop() → 겹침·리플레이 누수 0.
 * - 자막=화면 텍스트가 이미 존재. 저작권: Kokoro(Apache-2.0)로 자작 생성(CREDITS 표기).
 */
import { getLocale, onLocaleChange } from '../i18n';
import { state } from './state';
import type { Branch } from '../data/script';

const BASE = import.meta.env.BASE_URL;
const safe = (k: string): string => k.replace(/\./g, '_');
const clipUrl = (key: string): string => `${BASE}audio/narration/en/${safe(key)}.mp3`;

let enabled = false; // 낭독 토글
try {
  enabled = localStorage.getItem('narration') === 'on';
} catch {
  /* private mode */
}
let muted = false; // 전역 음소거 미러(main.ts가 onMuteChange로 동기화)
let started = false; // 첫 제스처(오디오 활성) 여부

let audioEl: HTMLAudioElement | null = null;
let seq: Array<{ key: string; delayMs: number }> = [];
let seqIdx = 0;
let timer: number | undefined;
const listeners = new Set<(on: boolean) => void>();

export const isNarrationEnabled = (): boolean => enabled;
export function onNarrationChange(cb: (on: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 토글 설정(+localStorage 영속). 끄면 즉시 정지. */
export function setNarration(on: boolean): void {
  if (enabled === on) return;
  enabled = on;
  try {
    localStorage.setItem('narration', on ? 'on' : 'off');
  } catch {
    /* noop */
  }
  if (!on) stop();
  listeners.forEach((cb) => cb(on));
}

/** 음소거 미러 갱신(main.ts에서 onMuteChange로 연결). */
export function setNarrationMuted(m: boolean): void {
  muted = m;
  if (m) stop();
}

/** 첫 사용자 제스처에서 호출(자동재생 정책). */
export function markStarted(): void {
  started = true;
}

/** 로케일 변경 시 정지(en만 클립). main.ts에서 init. */
export function initNarration(): void {
  onLocaleChange(() => stop());
}

/** 씬+상태 → 낭독 클립 시퀀스. en 외에는 빈 배열. */
function planFor(sceneId: string): Array<{ key: string; delayMs: number }> {
  if (getLocale() !== 'en') return [];
  const branch: Branch = state.endingBranch();
  const v = state.vCap;
  switch (sceneId) {
    case 's7':
      return [{ key: v >= 70 ? 's7.msgHigh' : v >= 40 ? 's7.msgMid' : 's7.msgLow', delayMs: 1200 }];
    case 's9':
      return [{ key: `s9.${branch}.body`, delayMs: 700 }];
    case 's10':
      return [
        { key: `s10.verdict.${branch}`, delayMs: 500 },
        { key: 's12.thesis1', delayMs: 500 },
        { key: 's12.thesis2', delayMs: 250 },
        { key: 's12.body', delayMs: 450 },
      ];
    default:
      return [];
  }
}

/** 씬 진입 시 호출. 조건 미충족 시 무음. */
export function start(sceneId: string): void {
  stop();
  if (!enabled || muted || !started) return;
  seq = planFor(sceneId);
  seqIdx = 0;
  if (seq.length) playNext();
}

function playNext(): void {
  if (seqIdx >= seq.length) {
    audioEl = null;
    return;
  }
  const { key, delayMs } = seq[seqIdx++]!;
  timer = window.setTimeout(() => {
    if (!enabled || muted) return;
    const el = new Audio(clipUrl(key));
    audioEl = el;
    let advanced = false;
    const advance = (): void => {
      if (advanced) return;
      advanced = true;
      if (audioEl === el) playNext(); // stop() 이후엔 무시
    };
    el.addEventListener('ended', advance);
    el.addEventListener('error', advance); // 클립 부재/로드 실패 → 다음
    void el.play().catch(advance); // 자동재생 차단 등 → 다음
  }, delayMs);
}

/** 재생 취소(씬 이탈·리플레이·음소거·언어변경). 겹침·누수 0. */
export function stop(): void {
  if (timer) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  if (audioEl) {
    audioEl.pause();
    audioEl.src = '';
    audioEl = null;
  }
  seq = [];
  seqIdx = 0;
}
