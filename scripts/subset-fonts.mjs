/**
 * subset-fonts.mjs — 정적 텍스트(4개 locale + 하드코딩 + UI 기호)에서 "실제 쓰는 글자만"
 * 남긴 Variable woff2 서브셋을 public/fonts/로 생성. (OFL 셀프호스트 · 절대규칙 1)
 *
 * 원본: assets-src/fonts/*.ttf (gitignore, 대용량). 서브셋만 커밋.
 * 툴: subset-font(harfbuzz wasm, Python 불필요) + fontkit(커버리지 검증).
 * 커버 매핑: Pretendard=ko+en, Noto Sans SC=zh, Noto Sans JP=ja (+공용 ASCII·기호).
 * 카피 수정 시 재실행: node scripts/subset-fonts.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const srcDir = resolve(root, 'assets-src/fonts');
const localesDir = resolve(root, 'src/locales');
const outDir = resolve(root, 'public/fonts');
mkdirSync(outDir, { recursive: true });

/** 로케일 JSON의 모든 값 문자열을 이어붙여 반환 */
function charsOf(locale) {
  const json = JSON.parse(readFileSync(resolve(localesDir, `${locale}.json`), 'utf8'));
  return Object.values(json).join('');
}
const ko = charsOf('ko');
const en = charsOf('en');
const zh = charsOf('zh');
const ja = charsOf('ja');

// 모든 폰트 공통: printable ASCII(숫자·문장부호·{value}/{n} 주입 대비) + UI 기호.
// (렌더되는 카피는 전부 locale JSON에 있음 — 타이틀 포함. 컴포넌트 하드코딩 글리프는 ↗ 정도라 아래 기호에 포함.)
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const UI_SYMBOLS = '→←↑↓↺↻↗↘▲▼△▽●○•·—–−×÷…“”‘’「」『』％';

const COMMON = ASCII + UI_SYMBOLS;
// 중복 제거 + 제어문자(\n\r\t 등, 글리프 없음) 제외
const uniq = (s) => [...new Set([...s])].filter((c) => c.codePointAt(0) >= 0x20).join('');

// public/proposal.html(자작 제안서) 가시 텍스트도 서브셋에 포함. Han·Kana는 noto가 담당 → Pretendard에선 제외.
let proposalHtml = '';
try {
  proposalHtml = readFileSync(resolve(root, 'public/proposal.html'), 'utf8');
} catch {
  /* 없으면 스킵 */
}
const proposalText = proposalHtml.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
const koLatin = (s) =>
  [...s]
    .filter((c) => {
      const cp = c.codePointAt(0);
      return !((cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0x4e00 && cp <= 0x9fff));
    })
    .join('');

const FONTS = [
  { src: 'PretendardVariable.ttf', out: 'pretendard-subset.woff2', text: ko + en + koLatin(proposalText) + COMMON, name: 'Pretendard (ko+en+제안서)' },
  { src: 'NotoSansSC.ttf', out: 'noto-sc-subset.woff2', text: zh + COMMON, name: 'Noto Sans SC (zh)' },
  { src: 'NotoSansJP.ttf', out: 'noto-jp-subset.woff2', text: ja + COMMON, name: 'Noto Sans JP (ja)' },
];

let anyMissing = false;
for (const f of FONTS) {
  const buf = readFileSync(resolve(srcDir, f.src));
  const text = uniq(f.text);

  // 커버리지: 원본에 글리프가 없는 코드포인트 = 서브셋 후 폴백 처리됨
  const src = fontkit.create(buf);
  const missing = [...text].filter((ch) => !src.hasGlyphForCodePoint(ch.codePointAt(0)));
  if (missing.length) {
    anyMissing = true;
    console.warn(`  ⚠ ${f.name}: 원본 미보유 ${missing.length}자(시스템 폴백): ${missing.map((c) => c + '(U+' + c.codePointAt(0).toString(16).toUpperCase() + ')').join(' ')}`);
  }

  const subset = await subsetFont(buf, text, { targetFormat: 'woff2' });
  writeFileSync(resolve(outDir, f.out), subset);

  // 가변축(wght) 보존 확인
  let axes = '(확인 불가)';
  try {
    axes = Object.keys(fontkit.create(subset).variationAxes ?? {}).join(',') || '(정적)';
  } catch { /* woff2 파싱 미지원 시 스킵 */ }
  console.log(
    `✓ ${f.out} — 글자 ${[...text].length}, ${Math.round(subset.length / 1024)} KB` +
      ` (원본 ${(buf.length / 1048576).toFixed(1)}MB) · 축[${axes}]`,
  );
}
console.log(anyMissing ? '\n일부 기호는 폴백 스택으로 렌더됩니다(위 경고 참조).' : '\n요청 글자 100% 커버 — 누락 0.');
