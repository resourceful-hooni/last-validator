/**
 * generate-narration.mjs — 영어 감정 낭독 클립 사전 생성(Kokoro, Apache-2.0 오픈웨이트).
 * en.json 원문 → 토큰 제거 → Kokoro(af_heart, mood별 속도) 합성 → mp3(lamejs) → public/audio/narration/en/.
 * 한국어/중/일은 오픈 감정 TTS 부재로 낭독 없음(무음, 우아한 폴백). 실행: node scripts/generate-narration.mjs
 * 모델은 최초 1회 다운로드(캐시). 카피 수정 시 재실행.
 */
import { KokoroTTS } from 'kokoro-js';
import * as lamejsNS from '@breezystack/lamejs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const lamejs = lamejsNS.default ?? lamejsNS;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public/audio/narration/en');
mkdirSync(outDir, { recursive: true });

// 낭독 세그먼트(영어). mood → 속도(느릴수록 묵직). 단일 내레이터(af_heart)로 통일감.
const CLIPS = [
  { key: 's7.msgHigh', mood: 'hope' },
  { key: 's7.msgMid', mood: 'somber' },
  { key: 's7.msgLow', mood: 'grave' },
  { key: 's9.tragedy.body', mood: 'grave' },
  { key: 's9.nearmiss.body', mood: 'tense' },
  { key: 's9.averted.body', mood: 'hope' },
  { key: 's10.verdict.tragedy', mood: 'grave' },
  { key: 's10.verdict.nearmiss', mood: 'somber' },
  { key: 's10.verdict.averted', mood: 'hope' },
  { key: 's12.thesis1', mood: 'calm' },
  { key: 's12.thesis2', mood: 'grave' },
  { key: 's12.body', mood: 'hope' },
];
const SPEED = { grave: 0.84, somber: 0.9, tense: 0.92, calm: 0.95, hope: 0.98 };
const VOICE = 'af_heart';

const en = JSON.parse(readFileSync(resolve(root, 'src/locales/en.json'), 'utf8'));
const clean = (s) =>
  s.replace(/<\/?(?:em|gn|rd)>/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
const safe = (k) => k.replace(/\./g, '_');

function toMp3(float32, sampleRate) {
  const enc = new lamejs.Mp3Encoder(1, sampleRate, 96);
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const out = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const chunk = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (chunk.length) out.push(Buffer.from(chunk));
  }
  const end = enc.flush();
  if (end.length) out.push(Buffer.from(end));
  return Buffer.concat(out);
}

console.log('[narration] loading Kokoro (Apache-2.0)...');
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
console.log('[narration] loaded. generating', CLIPS.length, 'English clips...');

let total = 0;
for (const { key, mood } of CLIPS) {
  const text = clean(en[key] ?? '');
  if (!text) {
    console.warn(`  ⚠ ${key}: en 텍스트 없음 — 스킵`);
    continue;
  }
  const audio = await tts.generate(text, { voice: VOICE, speed: SPEED[mood] ?? 1 });
  const mp3 = toMp3(audio.audio, audio.sampling_rate);
  const file = resolve(outDir, `${safe(key)}.mp3`);
  writeFileSync(file, mp3);
  total += mp3.length;
  console.log(`  ✓ ${safe(key)}.mp3 — ${mood}, ${Math.round(mp3.length / 1024)} KB`);
}
console.log(`[narration] done. en 클립 총 ${Math.round(total / 1024)} KB → public/audio/narration/en/`);
