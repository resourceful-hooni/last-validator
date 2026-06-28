/**
 * extract-locales.mjs — TRANSLATIONS.md(정본)의 4개 JSON 블록을 src/locales/*.json으로 추출.
 * 손으로 옮기지 않고 스크립트로 추출해 ko 정본의 글자 단위 일치를 보장한다(절대 규칙 2).
 * 실행: node scripts/extract-locales.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const md = readFileSync(resolve(root, 'TRANSLATIONS.md'), 'utf8');

const locales = ['ko', 'en', 'zh', 'ja'];
const outDir = resolve(root, 'src/locales');
mkdirSync(outDir, { recursive: true });

let failed = false;
for (const loc of locales) {
  // "## ko.json" 또는 "## ko.json  (...)" 헤더 다음의 첫 ```json … ``` 펜스를 잡는다.
  const re = new RegExp('##\\s+' + loc + '\\.json[^\\n]*\\n+```json\\n([\\s\\S]*?)\\n```', 'm');
  const m = md.match(re);
  if (!m) {
    console.error(`✗ ${loc}: TRANSLATIONS.md에서 블록을 찾지 못함`);
    failed = true;
    continue;
  }
  const raw = m[1];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`✗ ${loc}: JSON 파싱 실패 — ${e.message}`);
    failed = true;
    continue;
  }
  // 키 정렬은 유지(원본 순서), 2-space pretty
  const json = JSON.stringify(parsed, null, 2) + '\n';
  writeFileSync(resolve(outDir, `${loc}.json`), json, 'utf8');
  console.log(`✓ ${loc}.json — ${Object.keys(parsed).length} keys`);
}

if (failed) process.exit(1);
