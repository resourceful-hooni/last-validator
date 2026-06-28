/**
 * demoIntro.ts — Phase 1 검증용 인트로(S0 카피). 엔진 전환 + i18n + 모션 동작 확인.
 * (Phase 2의 정식 s0_title.ts가 이 자리를 대체한다.)
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';
import './scene.css';

export function createDemoIntro(): Scene {
  return {
    id: 'demo-intro',
    enter(container: HTMLElement, ctx: SceneContext) {
      container.classList.add('scene--center');
      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s0.kicker'))}</p>
        <h1 class="scene__title scene__title--hero">${renderPlain(t('s0.title'))}</h1>
        <p class="scene__body">${renderRich(t('s0.lead'))}</p>
        <p class="scene__body">${renderRich(t('s0.lead2'))}</p>
        <button class="btn" type="button" data-start>${renderPlain(t('ui.btn.start'))}</button>
        <p class="scene__footer">${renderPlain(t('s0.footer'))}</p>
        <p class="scene__note">${renderPlain(t('ui.supplementNote'))}</p>
      `;

      const startBtn = container.querySelector<HTMLButtonElement>('[data-start]');
      startBtn?.addEventListener('click', () => {
        void ctx.engine.next('demo-decision');
      });

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__kicker, .scene__title, .scene__body, .btn, .scene__footer, .scene__note'), {
          stagger: 0.08,
        });
      });
    },
  };
}
