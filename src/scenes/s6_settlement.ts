/**
 * s6_settlement.ts — ACT1 결산 (STORYBOARD S6). 풀스크린, 초록 스코어보드 카운트업.
 * "당신의 2026년은 성공적이었습니다" → "하지만 아무도 이 숫자는 보지 않았습니다".
 * 전환: 초록빛 한 점으로 수축 → 암전 → S7.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp, flashTransition, prefersReducedMotion } from '../engine/motion';
import { gsap } from 'gsap';
import { state } from '../engine/state';
import { Scoreboard } from '../components/Scoreboard';
import './scene.css';

export function createS6Settlement(): Scene {
  let board: Scoreboard | null = null;
  return {
    id: 's6',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      container.classList.add('scene--fs', 'scene--center');
      board = new Scoreboard(state.eff);

      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s6.kicker'))}</p>
        <h2 class="scene__title scene__title--hero s6-head">${renderRich(t('s6.headline'))}</h2>
        <div class="s6-board"></div>
        <p class="scene__body s6-line">${renderPlain(t('s6.body1'))}</p>
        <p class="scene__body s6-line">${renderRich(t('s6.body2'))}</p>
        <button class="btn s6-cta" type="button" data-next>${renderPlain(t('ui.btn.checkNumber'))}</button>
      `;
      container.querySelector('.s6-board')!.appendChild(board.el);

      container.querySelector('[data-next]')?.addEventListener('click', () => {
        // 초록 정점 → 암전 → S7
        flashTransition('black', () => void ctx.engine.next('s7'));
      });

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__kicker, .s6-head'), { stagger: 0.12 });
        if (!prefersReducedMotion()) {
          gsap.from(container.querySelector('.s6-board'), { opacity: 0, y: 10, duration: 0.5, delay: 0.3 });
        }
        board?.animate();
        fadeUp(container.querySelectorAll('.s6-line, .s6-cta'), { delay: 0.6, stagger: 0.15 });
      });
    },
    exit() {
      board = null;
    },
  };
}
