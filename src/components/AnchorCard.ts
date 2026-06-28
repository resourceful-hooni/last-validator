/**
 * AnchorCard.ts — 실제 신호 앵커 박스(S11). 적갈색 톤, 헤더 빨강, 행마다 상단 구분선.
 * 각 줄 페이드로 등장. (DESIGN_SYSTEM §4)
 */
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';

export function createAnchorCard(): { el: HTMLDivElement; play: () => void } {
  const el = document.createElement('div');
  el.className = 'anchor';
  el.innerHTML = `
    <p class="anchor__header">${renderPlain(t('s11.header'))}</p>
    <ul class="anchor__list">
      <li class="anchor__row">${renderPlain(t('s11.row1'))}</li>
      <li class="anchor__row">${renderPlain(t('s11.row2'))}</li>
      <li class="anchor__row">${renderPlain(t('s11.row3'))}</li>
    </ul>
  `;
  const play = (): void => {
    fadeUp(el.querySelectorAll('.anchor__row'), { stagger: 0.18, y: 6 });
  };
  return { el, play };
}
