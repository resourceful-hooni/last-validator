/**
 * narration.ts — 감정 낭독 매니저(하이브리드). (사용자 요청)
 *  - **en**: Kokoro(Apache-2.0)로 사전 생성한 mp3 클립 재생(고품질·감정).
 *  - **ko/zh/ja**: 브라우저 Web Speech(OS 음성) 런타임 낭독 — mood별 rate/pitch로 '절제된 무게감'.
 *    (자연스러움은 기기 OS 음성 의존. 해당 언어 음성이 없으면 무음으로 스킵.)
 *  - **옵트인 토글**(기본 OFF, localStorage) + 음소거 연동 + 첫 제스처 이후 재생.
 *  - 씬 enter→start / exit·teardown→stop (겹침·리플레이 누수 0). 자막=화면 텍스트 상시.
 *  - 저작권: en 클립=Kokoro 자작 생성(CREDITS). Web Speech=OS 음성 런타임(에셋 0).
 */
import { getLocale, onLocaleChange, t } from '../i18n';
import { state } from './state';
import type { Branch } from '../data/script';

const BASE = import.meta.env.BASE_URL;
const safe = (k: string): string => k.replace(/\./g, '_');
const clipUrl = (k: string): string => `${BASE}audio/narration/en/${safe(k)}.mp3`;

type Mood = 'grave' | 'somber' | 'tense' | 'calm' | 'hope';
/** mood → Web Speech 운율(절제된 감정). en 클립은 생성 시 이미 속도 반영됨. */
const PROSODY: Record<Mood, { rate: number; pitch: number }> = {
  grave: { rate: 0.82, pitch: 0.92 },
  somber: { rate: 0.88, pitch: 0.96 },
  tense: { rate: 0.9, pitch: 1.0 },
  calm: { rate: 0.92, pitch: 1.0 },
  hope: { rate: 0.96, pitch: 1.03 },
};
interface Seg {
  key: string;
  mood: Mood;
  delayMs: number;
}

let enabled = false;
try {
  enabled = localStorage.getItem('narration') === 'on';
} catch {
  /* private mode */
}
let muted = false;
let started = false;

let curAudio: HTMLAudioElement | null = null;
let speaking = false;
let seq: Seg[] = [];
let seqIdx = 0;
let timer: number | undefined;
const listeners = new Set<(on: boolean) => void>();

export const isNarrationEnabled = (): boolean => enabled;
export function onNarrationChange(cb: (on: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

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

export function setNarrationMuted(m: boolean): void {
  muted = m;
  if (m) stop();
}

export function markStarted(): void {
  started = true;
}

export function initNarration(): void {
  onLocaleChange(() => stop());
  // Web Speech 음성 목록 워밍업(첫 getVoices()는 비어있을 수 있음)
  const synth = window.speechSynthesis;
  if (synth) {
    synth.getVoices();
    synth.addEventListener?.('voiceschanged', () => synth.getVoices());
  }
}

/** 씬+상태 → 낭독 세그먼트(모든 로케일 공통 키). */
function planFor(sceneId: string): Seg[] {
  const branch: Branch = state.endingBranch();
  const v = state.vCap;
  switch (sceneId) {
    case 's7': {
      const key = v >= 70 ? 's7.msgHigh' : v >= 40 ? 's7.msgMid' : 's7.msgLow';
      const mood: Mood = v >= 70 ? 'hope' : v >= 40 ? 'somber' : 'grave';
      return [{ key, mood, delayMs: 1200 }];
    }
    case 's9': {
      const mood: Mood = branch === 'tragedy' ? 'grave' : branch === 'nearmiss' ? 'tense' : 'hope';
      return [{ key: `s9.${branch}.body`, mood, delayMs: 700 }];
    }
    case 's10':
      return [
        { key: `s10.verdict.${branch}`, mood: branch === 'tragedy' ? 'grave' : branch === 'nearmiss' ? 'somber' : 'hope', delayMs: 500 },
        { key: 's12.thesis1', mood: 'calm', delayMs: 500 },
        { key: 's12.thesis2', mood: 'grave', delayMs: 250 },
        { key: 's12.body', mood: 'hope', delayMs: 450 },
      ];
    default:
      return [];
  }
}

export function start(sceneId: string): void {
  stop();
  if (!enabled || muted || !started) return;
  seq = planFor(sceneId);
  seqIdx = 0;
  if (seq.length) playNext();
}

function playNext(): void {
  if (seqIdx >= seq.length) {
    curAudio = null;
    return;
  }
  const { key, mood, delayMs } = seq[seqIdx++]!;
  timer = window.setTimeout(() => {
    if (!enabled || muted) return;
    if (getLocale() === 'en') playClip(key);
    else speakSegment(key, mood);
  }, delayMs);
}

/** en: 사전 생성 mp3 클립. */
function playClip(key: string): void {
  const el = new Audio(clipUrl(key));
  curAudio = el;
  let done = false;
  const advance = (): void => {
    if (done) return;
    done = true;
    if (curAudio === el) playNext();
  };
  el.addEventListener('ended', advance);
  el.addEventListener('error', advance);
  void el.play().catch(advance);
}

/* ── Web Speech (ko/zh/ja) ── */
const VOICE_LANG: Record<string, string> = { ko: 'ko-KR', zh: 'zh-CN', ja: 'ja-JP', en: 'en-US' };
const PREF = /google|natural|neural|siri|yuna|nari|sora|kyoko|o-?ren|nanami|xiao|ting|mei|premium|enhanced|online/i;

/** 현재 로케일에서 가장 자연스러운 음성 선택(없으면 undefined → 무음 스킵). */
function bestVoice(locale: string): SpeechSynthesisVoice | undefined {
  const synth = window.speechSynthesis;
  if (!synth) return undefined;
  const want = (VOICE_LANG[locale] ?? locale).toLowerCase();
  const byLang = synth.getVoices().filter((vc) => (vc.lang || '').replace('_', '-').toLowerCase().startsWith(locale));
  if (!byLang.length) return undefined;
  const exact = byLang.filter((vc) => (vc.lang || '').toLowerCase() === want);
  const pool = exact.length ? exact : byLang;
  return pool.find((vc) => PREF.test(vc.name)) ?? pool.find((vc) => !vc.localService) ?? pool[0];
}

const stripTokens = (s: string): string =>
  s.replace(/<\/?(?:em|gn|rd)>/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
/** 문장 단위 분해(Chrome의 장문 절단 회피 + 자연 호흡). */
const toSentences = (s: string): string[] =>
  s.split(/(?<=[.!?。！？])\s+/).map((x) => x.trim()).filter(Boolean);

function speakSegment(key: string, mood: Mood): void {
  const synth = window.speechSynthesis;
  const loc = getLocale();
  const text = stripTokens(t(key));
  const voice = synth ? bestVoice(loc) : undefined;
  if (!synth || !text || !voice) {
    playNext(); // 음성/텍스트 없으면 스킵(무음)
    return;
  }
  const parts = toSentences(text);
  const { rate, pitch } = PROSODY[mood];
  let i = 0;
  speaking = true;
  const speakPart = (): void => {
    if (!enabled || muted || i >= parts.length) {
      speaking = false;
      playNext();
      return;
    }
    const u = new SpeechSynthesisUtterance(parts[i++]!);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;
    u.onend = speakPart;
    u.onerror = () => {
      speaking = false;
      playNext();
    };
    synth.speak(u);
  };
  speakPart();
}

/** 재생 취소(씬 이탈·리플레이·음소거·언어변경). 겹침·누수 0. */
export function stop(): void {
  if (timer) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  if (curAudio) {
    curAudio.pause();
    curAudio.src = '';
    curAudio = null;
  }
  if (speaking && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    speaking = false;
  }
  seq = [];
  seqIdx = 0;
}
