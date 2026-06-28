/**
 * ending.ts — 엔딩 시퀀스 (STORYBOARD S10+S11+S12). 한 화면에 이어지는 시네마틱 결말.
 *  - S10 역추적: 분기별 평결 + 4개 TraceRow(화살표 draw)
 *  - S11 앵커: 실제 신호 3행
 *  - S12 명제 2줄(둘째 빨강) + CTA(제안서) + 리플레이(상태 완전 초기화) + 고지
 * 별도 '계속' 카피가 없으므로 스크롤 가능한 연속 결말로 구성(절대규칙: 하드코딩 0).
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';
import { audio } from '../engine/audio';
import { state } from '../engine/state';
import { PROPOSAL_URL } from '../data/script';
import { createTraceRow } from '../components/TraceRow';
import { createAnchorCard } from '../components/AnchorCard';
import './scene.css';

export function createEnding(): Scene {
  return {
    id: 's10',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      const branch = state.endingBranch();
      container.classList.add('scene--fs', 'ending');
      container.dataset.branch = branch;

      const ctaBtn = PROPOSAL_URL
        ? `<button class="btn ending-cta" type="button" data-proposal>${renderPlain(t('ui.btn.viewProposal'))}</button>`
        : '';

      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s10.kicker'))}</p>
        <h2 class="scene__title ending-verdict" data-branch="${branch}">${renderPlain(t(`s10.verdict.${branch}`))}</h2>
        <p class="scene__body ending-intro">${renderPlain(t('s10.intro'))}</p>
        <div class="trace-list"></div>

        <div class="anchor-slot"></div>

        <div class="thesis">
          <p class="thesis__line thesis__1">${renderPlain(t('s12.thesis1'))}</p>
          <p class="thesis__line thesis__2">${renderPlain(t('s12.thesis2'))}</p>
        </div>
        <p class="scene__body ending-body">${renderRich(t('s12.body'))}</p>

        <div class="ending-actions">
          <button class="btn btn--ghost ending-replay" type="button" data-replay>${renderPlain(t('ui.btn.replay'))}</button>
          ${ctaBtn}
        </div>
        <p class="scene__footer ending-foot">${renderPlain(t('s12.footer'))}</p>
        <p class="scene__note ending-disc">${renderPlain(t('s12.disclaimer'))}</p>
      `;

      // 역추적 4행
      const traceList = container.querySelector('.trace-list')!;
      const rows = [1, 2, 3, 4].map((i) => createTraceRow(`s10.row${i}.yr`, `s10.row${i}.txt`));
      rows.forEach((r) => traceList.appendChild(r.el));

      // 앵커
      const anchor = createAnchorCard();
      container.querySelector('.anchor-slot')!.appendChild(anchor.el);

      // 액션
      container.querySelector('[data-replay]')?.addEventListener('click', () => {
        state.reset();
        ctx.hud.dashboard.reset();
        void ctx.engine.next('s0');
      });
      container.querySelector('[data-proposal]')?.addEventListener('click', () => {
        if (PROPOSAL_URL) window.open(PROPOSAL_URL, '_blank', 'noopener');
      });

      audio.impact();

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__kicker, .ending-verdict, .ending-intro'), { stagger: 0.12 });
        fadeUp(traceList.querySelectorAll('.trace-row'), { delay: 0.3, stagger: 0.15, y: 6 });
        rows.forEach((r, i) => r.play(0.5 + i * 0.15));
        anchor.play();
        fadeUp(container.querySelectorAll('.thesis__line, .ending-body, .ending-actions, .ending-foot, .ending-disc'), {
          delay: 0.4,
          stagger: 0.12,
        });
      });
    },
  };
}
