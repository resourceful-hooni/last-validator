/**
 * ChoiceCard.ts — 풀폭 선택 버튼. (DESIGN_SYSTEM §4, STORYBOARD ACT1)
 * 태그(효율 우선/역량 보존) + 제목 + 서브. hover 시 보더 밝게+상승. ≥44px.
 * 키보드 접근(button) 기본.
 */
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import type { Choice, Pick } from '../data/script';

export function createChoiceCard(choice: Choice, pick: Pick, onPick: (p: Pick) => void): HTMLButtonElement {
  const tagKey = choice.tag === 'efficient' ? 'ui.tag.efficient' : 'ui.tag.preserve';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'choice';
  btn.dataset.pick = pick;
  btn.dataset.tag = choice.tag;
  btn.innerHTML = `
    <span class="choice__tag">${renderPlain(t(tagKey))}</span>
    <span class="choice__text">${renderPlain(t(choice.textKey))}</span>
    <span class="choice__sub">${renderPlain(t(choice.subKey))}</span>
  `;
  btn.addEventListener('click', () => onPick(pick));
  return btn;
}
