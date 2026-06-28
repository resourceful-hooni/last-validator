/**
 * scenes/index.ts — ACT1 결산~엔딩(S6~S12) 씬 등록.
 * (현재 S6 임시 플레이스홀더 — Phase 4~6에서 정식 씬으로 교체)
 */
import type { SceneEngine, Scene, SceneContext } from '../engine/SceneEngine';
import { state } from '../engine/state';
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';

function tempSettlement(): Scene {
  return {
    id: 's6',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      container.classList.add('scene--fs', 'scene--center');
      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s6.kicker'))}</p>
        <h2 class="scene__title scene__title--hero">${renderPlain(t('s6.scoreDashLabelEff'))}</h2>
        <p class="scene__body">[임시 S6] vCap=${state.vCap} · eff=${state.eff} · branch=${state.endingBranch()}</p>
        <button class="btn btn--ghost" type="button" data-replay>${renderPlain(t('ui.btn.replay'))}</button>
      `;
      container.querySelector('[data-replay]')?.addEventListener('click', () => {
        state.reset();
        ctx.hud.dashboard.reset();
        void ctx.engine.next('s0');
      });
      ctx.gsapCtx.add(() => fadeUp(container.querySelectorAll('.scene__kicker, .scene__title, .scene__body, .btn'), { stagger: 0.08 }));
    },
  };
}

export function registerActTwoScenes(engine: SceneEngine): void {
  engine.register('s6', tempSettlement);
}
