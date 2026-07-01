/**
 * AnchorCard.ts — 실제 신호 앵커 박스(S11). 적갈색 톤, 헤더 빨강, 행마다 상단 구분선.
 * 각 행은 **실제 출처 링크**(새 탭). 각 줄 페이드로 등장. (DESIGN_SYSTEM §4)
 */
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';

/** 실제 신호 출처 링크(행 순서: 2024 전공의 · 2025 Lancet · 2009 AF447) */
const ANCHOR_LINKS = [
  'https://en.wikipedia.org/wiki/2024_South_Korean_medical_crisis',
  'https://doi.org/10.1016/S2468-1253(25)00133-5', // Lancet Gastroenterol Hepatol 2025 (영구 DOI)
  'https://en.wikipedia.org/wiki/Air_France_Flight_447',
] as const;

export function createAnchorCard(): { el: HTMLDivElement; play: () => void } {
  const el = document.createElement('div');
  el.className = 'anchor';
  const rows = [1, 2, 3]
    .map(
      (i) => `
      <a class="anchor__row" href="${ANCHOR_LINKS[i - 1]}" target="_blank" rel="noopener noreferrer">
        <span class="anchor__txt">${renderPlain(t(`s11.row${i}`))}</span>
        <span class="anchor__ext" aria-hidden="true">↗</span>
      </a>`,
    )
    .join('');
  el.innerHTML = `
    <p class="anchor__header">${renderPlain(t('s11.header'))}</p>
    <div class="anchor__list">${rows}</div>
  `;
  const play = (): void => {
    fadeUp(el.querySelectorAll('.anchor__row'), { stagger: 0.18, y: 6 });
  };
  return { el, play };
}
