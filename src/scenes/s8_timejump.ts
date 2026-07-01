/**
 * s8_timejump.ts — 2036 시간점프 (STORYBOARD S8). 라이브 3D 전환(영상 아님, 더 자연스러움).
 * 연도 2026→2036 가속(블러) + 3D 파티클 워프 → "2036" → 날짜 → S9.
 * 화면/클릭으로 즉시 진행(접근성), 미조작 시 자동 진행.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { countTo, fadeUp, prefersReducedMotion } from '../engine/motion';
import { audio } from '../engine/audio';
import { gsap } from 'gsap';
import './scene.css';

export function createS8Timejump(): Scene {
  let advanced = false;
  let timer: number | undefined;

  return {
    id: 's8',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      ctx.stage?.setScene('timejump');
      ctx.stage?.setMood('cool');
      ctx.stage?.warp(true); // 시간 가속 — 파티클 스트리크
      audio.monitor();

      container.classList.add('scene--fs', 'scene--center', 's8');
      container.innerHTML = `
        <div class="s8-year"><span class="s8-year__n">2026</span></div>
        <p class="scene__title scene__title--hero s8-date" style="opacity:0">${renderPlain(t('s8.datetime'))}</p>
      `;
      const yearEl = container.querySelector<HTMLSpanElement>('.s8-year__n')!;
      const yearWrap = container.querySelector<HTMLDivElement>('.s8-year')!;
      const dateEl = container.querySelector<HTMLElement>('.s8-date')!;

      const advance = (): void => {
        if (advanced) return;
        advanced = true;
        if (timer) window.clearTimeout(timer);
        void ctx.engine.next('s9');
      };
      container.addEventListener('click', advance);
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advance(); // 키보드 사용자도 진행 가능(container는 전환 시 포커스됨)
        }
      });

      ctx.gsapCtx.add(() => {
        if (prefersReducedMotion()) {
          yearEl.textContent = '2036';
          gsap.set(dateEl, { opacity: 1 });
          timer = window.setTimeout(advance, 900);
          return;
        }
        gsap
          .timeline()
          .to(yearWrap, { filter: 'blur(2px)', duration: 0.3, ease: 'power1.in' }, 0)
          .add(countTo(2026, 2036, (n) => (yearEl.textContent = String(Math.round(n))), { duration: 1.2 }), 0)
          .to(yearWrap, { filter: 'blur(0px)', scale: 1.05, duration: 0.4, ease: 'power2.out' }, 1.2)
          .add(() => fadeUp(dateEl, { duration: 0.6 }), 1.5);
        timer = window.setTimeout(advance, 3600);
      });
    },
    exit() {
      if (timer) window.clearTimeout(timer);
    },
  };
}
