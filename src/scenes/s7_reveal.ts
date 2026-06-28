/**
 * s7_reveal.ts — 검증 역량 드라마틱 리빌 (STORYBOARD S7). 풀스크린, 암전.
 * 거대한 % 숫자가 100→실제 vCap로 카운트다운. 색: >70 초록 / >40 호박 / ≤40 빨강.
 * 메시지 분기(vCap): ≥70 high / 40~69 mid / <40 low.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { fadeUp, countTo, prefersReducedMotion } from '../engine/motion';
import { state } from '../engine/state';
import './scene.css';

function threshold(v: number): 'high' | 'mid' | 'low' {
  return v > 70 ? 'high' : v > 40 ? 'mid' : 'low';
}
function messageKey(v: number): string {
  return v >= 70 ? 's7.msgHigh' : v >= 40 ? 's7.msgMid' : 's7.msgLow';
}

export function createS7Reveal(): Scene {
  return {
    id: 's7',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      container.classList.add('scene--fs', 'scene--center');
      const v = state.vCap;

      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s7.kicker'))}</p>
        <p class="scene__body s7-sub">${renderPlain(t('s7.subtitle'))}</p>
        <div class="reveal-num" data-threshold="${threshold(v)}"><span class="reveal-num__n">100</span><span class="reveal-num__pct">%</span></div>
        <p class="scene__body s7-msg">${renderPlain(t(messageKey(v)))}</p>
        <p class="scene__footer s7-help">${renderPlain(t('s7.helper'))}</p>
        <button class="btn s7-cta" type="button" data-next>${renderPlain(t('ui.btn.to2036'))}</button>
      `;

      const numEl = container.querySelector<HTMLSpanElement>('.reveal-num__n')!;

      container.querySelector('[data-next]')?.addEventListener('click', () => {
        void ctx.engine.next('s8');
      });

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__kicker, .s7-sub'), { stagger: 0.12 });
        countTo(100, v, (n) => (numEl.textContent = String(Math.round(n))), {
          duration: 0.9,
          delay: prefersReducedMotion() ? 0 : 0.4,
        });
        fadeUp(container.querySelectorAll('.s7-msg, .s7-help, .s7-cta'), { delay: 1.1, stagger: 0.15 });
      });
    },
  };
}
