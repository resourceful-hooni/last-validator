/**
 * s8_timejump.ts — 2036 시간점프 (STORYBOARD S8). 전환 시네마틱.
 * 연도 카운터 2026→2036 가속(블러) → "2036" 정지 → 날짜/시각 → S9.
 * 화면/클릭으로 즉시 진행 가능(접근성), 미조작 시 자동 진행.
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
      container.classList.add('scene--fs', 'scene--center', 's8');
      container.innerHTML = `
        <div class="s8-year"><span class="s8-year__n">2026</span></div>
        <p class="scene__title scene__title--hero s8-date" style="opacity:0">${renderPlain(t('s8.datetime'))}</p>
      `;
      const yearEl = container.querySelector<HTMLSpanElement>('.s8-year__n')!;
      const yearWrap = container.querySelector<HTMLDivElement>('.s8-year')!;
      const dateEl = container.querySelector<HTMLElement>('.s8-date')!;

      const advance = () => {
        if (advanced) return;
        advanced = true;
        if (timer) window.clearTimeout(timer);
        void ctx.engine.next('s9');
      };
      container.addEventListener('click', advance);

      audio.monitor();

      ctx.gsapCtx.add(() => {
        if (prefersReducedMotion()) {
          yearEl.textContent = '2036';
          gsap.set(dateEl, { opacity: 1 });
          timer = window.setTimeout(advance, 900);
          return;
        }
        const tl = gsap.timeline();
        tl.to(yearWrap, { filter: 'blur(2px)', duration: 0.3, ease: 'power1.in' }, 0)
          .add(countTo(2026, 2036, (n) => (yearEl.textContent = String(Math.round(n))), { duration: 1.2 }), 0)
          .to(yearWrap, { filter: 'blur(0px)', scale: 1.05, duration: 0.4, ease: 'power2.out' }, 1.2)
          .add(() => fadeUp(dateEl, { duration: 0.6 }), 1.5);
        // 자동 진행(전환 컷)
        timer = window.setTimeout(advance, 3600);
      });
    },
    exit() {
      if (timer) window.clearTimeout(timer);
    },
  };
}
