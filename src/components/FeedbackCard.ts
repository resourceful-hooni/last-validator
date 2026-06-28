/**
 * FeedbackCard.ts — 선택 후 결과 카드: 피드백 문장 + 델타 칩 + 다음 버튼. (DESIGN_SYSTEM §4)
 * 델타 칩(STORYBOARD): 효율 → ▲초록불 + (−20% 또는 측정 중단) / 보존 → ▽효율 손해 + 역량 유지.
 */
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import type { Choice } from '../data/script';

export function createFeedbackCard(
  choice: Choice,
  nextLabelKey: string,
  onNext: () => void,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'feedback';

  const chips: Array<{ cls: string; key: string }> = choice.efficient
    ? [
        { cls: 'chip--up', key: 'ui.delta.greenUp' },
        choice.killVbar
          ? { cls: 'chip--dn', key: 'ui.delta.vcapOff' }
          : { cls: 'chip--dn', key: 'ui.delta.vcapDown' },
      ]
    : [
        { cls: 'chip--hold', key: 'ui.delta.effLoss' },
        { cls: 'chip--hold', key: 'ui.delta.vcapHold' },
      ];

  wrap.innerHTML = `
    <p class="scene__body feedback__text">${renderRich(t(choice.feedbackKey))}</p>
    <div class="chips">
      ${chips.map((c) => `<span class="chip ${c.cls}">${renderPlain(t(c.key))}</span>`).join('')}
    </div>
    <button class="btn feedback__next" type="button" data-next>${renderPlain(t(nextLabelKey))}</button>
  `;

  wrap.querySelector<HTMLButtonElement>('[data-next]')?.addEventListener('click', onNext);
  return wrap;
}
