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
import { playCutscene, cutsceneUrl } from '../components/CutsceneVideo';
import { prefersReducedMotion } from '../engine/motion';
import { audio } from '../engine/audio';
import { stop as narrationStop } from '../engine/narration';
import './scene.css';

export function createS9Er(): Scene {
  let cut: ReturnType<typeof playCutscene> | null = null;
  let disposed = false;
  return {
    id: 's9',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      const branch = state.endingBranch();
      const titleKey = `s9.${branch}.title`;
      const bodyKey = `s9.${branch}.body`;

      const moodMap = { tragedy: 'red', nearmiss: 'amber', averted: 'green' } as const;
      ctx.stage?.setScene('er');
      ctx.stage?.warp(false);
      ctx.stage?.setMood(moodMap[branch]);
      const use3D = !!ctx.stage;
      if (use3D) ctx.stage?.showBrain(branch);

      container.classList.add('scene--fs', 's9');
      if (use3D) container.classList.add('s9--webgl');
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
        <h1 class="scene__title s9-title" data-branch="${branch}">${renderPlain(t(titleKey))}</h1>
        <div class="s9-body">${paragraphs}</div>
        <button class="btn s9-cta" type="button" data-next>${renderPlain(t('ui.btn.whyHappened'))}</button>
      `;

      const ct = createBrainCT(branch);
      const clock = createGoldenClock(branch);
      container.querySelector('.s9-ct')!.appendChild(ct.el);
      container.querySelector('.s9-clock')!.appendChild(clock.el);

      // 왜 이렇게 됐는지 → 명제 finale 컷신(자작 영상) → 인터랙티브 엔딩(S10)
      container.querySelector('[data-next]')?.addEventListener('click', () => {
        if (ctx.engine.isLocked) return;
        narrationStop(); // 컷신 전 낭독 정지(음성이 finale 위로 겹치는 것 방지)
        if (prefersReducedMotion()) {
          void ctx.engine.next('s10');
          return;
        }
        const btn = container.querySelector<HTMLButtonElement>('[data-next]');
        if (btn) btn.disabled = true;
        audio.impact(); // 명제 저음 임팩트
        cut = playCutscene(cutsceneUrl('finale'));
        void cut.done.then(() => {
          cut = null;
          // 컷신 재생 중 리플레이/로케일 변경으로 이 씬이 교체됐으면(disposed) 강제 이동 금지
          if (!disposed && ctx.engine.currentId === 's9') void ctx.engine.next('s10');
        });
      });

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.s9-kicker, .s9-stage'), { stagger: 0.15 });
        ct.play();
        clock.play();
        fadeUp(container.querySelectorAll('.s9-title, .s9-p, .s9-cta'), { delay: 0.5, stagger: 0.12 });
      });
    },
    exit() {
      disposed = true;
      cut?.dispose(); // 진행 중 finale 컷신 정리(고아 오버레이·강제 이동 방지)
      cut = null;
    },
  };
}
