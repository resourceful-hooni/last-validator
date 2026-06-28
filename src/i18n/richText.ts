/**
 * richText.ts — 강조 토큰 안전 파서. (TECH_SPEC §12, I18N §3)
 * 허용 토큰: <em>(강조) / <gn>(초록) / <rd>(빨강). 그 외 모든 마크업은 이스케이프(XSS 방지).
 * 결과는 innerHTML로 안전하게 주입 가능한 문자열.
 */

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE[c] ?? c);
}

const TOKEN_CLASS: Record<string, string> = {
  em: 'rt-em',
  gn: 'rt-gn',
  rd: 'rt-rd',
};

/**
 * 정본/번역 문자열을 안전한 HTML로 변환한다.
 * 1) 전체 이스케이프 → 2) 화이트리스트 토큰만 span으로 복원 → 3) 개행 \n → <br>.
 */
export function renderRich(input: string): string {
  let s = escapeHtml(input);
  // 이스케이프된 토큰(&lt;em&gt; …)을 span으로 복원
  for (const tag of Object.keys(TOKEN_CLASS)) {
    const open = new RegExp(`&lt;${tag}&gt;`, 'g');
    const close = new RegExp(`&lt;/${tag}&gt;`, 'g');
    s = s.replace(open, `<span class="${TOKEN_CLASS[tag]}">`).replace(close, '</span>');
  }
  s = s.replace(/\n/g, '<br/>');
  return s;
}

/** 강조/개행이 필요 없는 짧은 라벨용 — 순수 이스케이프만. */
export function renderPlain(input: string): string {
  return escapeHtml(input).replace(/\n/g, '<br/>');
}
