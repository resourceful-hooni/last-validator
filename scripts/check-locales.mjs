/**
 * check-locales.mjs — 4개 로케일 파일의 키 집합 일치 검사. (I18N §9, TASKS Phase 1.5)
 * 누락/잉여 키가 있으면 비0 종료. 빌드/CI 게이트로 사용.
 * 실행: npm run check-locales
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, '../src/locales');
const locales = ['ko', 'en', 'zh', 'ja'];
const BASE = 'ko'; // 정본

const data = {};
let fatal = false;
for (const loc of locales) {
  const p = resolve(dir, `${loc}.json`);
  if (!existsSync(p)) {
    console.error(`✗ ${loc}.json 없음 (먼저 node scripts/extract-locales.mjs 실행)`);
    fatal = true;
    continue;
  }
  data[loc] = JSON.parse(readFileSync(p, 'utf8'));
}
if (fatal) process.exit(1);

const baseKeys = new Set(Object.keys(data[BASE]));
let problems = 0;

for (const loc of locales) {
  if (loc === BASE) continue;
  const keys = new Set(Object.keys(data[loc]));
  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));
  if (missing.length) {
    console.error(`✗ ${loc}: 누락 ${missing.length}개 → ${missing.join(', ')}`);
    problems += missing.length;
  }
  if (extra.length) {
    console.error(`✗ ${loc}: 잉여 ${extra.length}개 → ${extra.join(', ')}`);
    problems += extra.length;
  }
  // 빈 값(미번역) 검사
  const empties = [...keys].filter((k) => !String(data[loc][k]).trim());
  if (empties.length) {
    console.error(`✗ ${loc}: 빈 값 ${empties.length}개 → ${empties.join(', ')}`);
    problems += empties.length;
  }
}

if (problems === 0) {
  console.log(`✓ 로케일 키 일치 — ${baseKeys.size} keys × ${locales.length} locales, 누락 0`);
} else {
  console.error(`\n총 ${problems}개 문제. 실패.`);
  process.exit(1);
}
