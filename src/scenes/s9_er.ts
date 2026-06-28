/**
 * s9_er.ts — 2036 응급실 (STORYBOARD S9). 분기 3종(vCap 기준). 시네마틱.
 * 추상 뇌 CT + AI 오버레이 + 골든타임 시계 + 구석 작은 초록 대시보드(아이러니).
 * 분기색: 비극=적색 / near-miss=호박 / 회피=초록.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';
import { state } from '../engine/state';
import { createBrainCT } from '../components/BrainCT';
import { createGoldenClock } from '../components/GoldenClock';
import './scene.css';

export function createS9Er(): Scene {
  return {
    id: 's9',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      const branch = state.endingBranch();
      const titleKey = `s9.${branch}.title`;
      const bodyKey = `s9.${branch}.body`;

      container.classList.add('scene--fs', 's9');
      container.dataset.branch = branch;

      const paragraphs = t(bodyKey)
        .split('\n')
        .map((line) => `<p class="scene__body s9-p">${renderRich(line)}</p>`)
        .join('');

      container.innerHTML = `
        <p class="scene__kicker s9-kicker">${renderPlain(t('ui.act2Badge'))}</p>
        <div class="s9-stage">
          <div class="s9-corner" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div class="s9-ct"></div>
          <div class="s9-clock"></div>
        </div>
        <h2 class="scene__title s9-title" data-branch="${branch}">${renderPlain(t(titleKey))}</h2>
        <div class="s9-body">${paragraphs}</div>
        <button class="btn s9-cta" type="button" data-next>${renderPlain(t('ui.btn.whyHappened'))}</button>
      `;

      const ct = createBrainCT(branch);
      const clock = createGoldenClock(branch);
      container.querySelector('.s9-ct')!.appendChild(ct.el);
      container.querySelector('.s9-clock')!.appendChild(clock.el);

      container.querySelector('[data-next]')?.addEventListener('click', () => {
        void ctx.engine.next('s10');
      });

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.s9-kicker, .s9-stage'), { stagger: 0.15 });
        ct.play();
        clock.play();
        fadeUp(container.querySelectorAll('.s9-title, .s9-p, .s9-cta'), { delay: 0.5, stagger: 0.12 });
      });
    },
  };
}
