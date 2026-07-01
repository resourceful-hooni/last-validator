/**
 * s8_timejump.ts — 2036 시간점프 (STORYBOARD S8). 비인터랙티브 전환 컷신.
 * 자작 렌더 영상(public/video/timejump.mp4)을 재생하고 끝나면 S9로.
 * 영상 로드 실패·reduced-motion 시 라이브 애니메이션으로 폴백.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { countTo, fadeUp, prefersReducedMotion } from '../engine/motion';
import { audio } from '../engine/audio';
import { playCutscene, cutsceneUrl } from '../components/CutsceneVideo';
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
      ctx.stage?.warp(true);
      audio.monitor();

      const advance = (): void => {
        if (advanced) return;
        advanced = true;
        if (timer) window.clearTimeout(timer);
        void ctx.engine.next('s9');
      };

      // ── 라이브 폴백(영상 실패·reduced-motion) ──
      const runLive = (): void => {
        container.classList.add('scene--fs', 'scene--center', 's8');
        container.innerHTML = `
          <div class="s8-year"><span class="s8-year__n">2026</span></div>
          <p class="scene__title scene__title--hero s8-date" style="opacity:0">${renderPlain(t('s8.datetime'))}</p>
        `;
        const yearEl = container.querySelector<HTMLSpanElement>('.s8-year__n')!;
        const yearWrap = container.querySelector<HTMLDivElement>('.s8-year')!;
        const dateEl = container.querySelector<HTMLElement>('.s8-date')!;
        container.addEventListener('click', advance);
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
      };

      // reduced-motion → 바로 라이브(정적) 경로
      if (prefersReducedMotion()) {
        runLive();
        return;
      }

      // 컷신 영상 재생 → 끝/스킵이면 S9, 로드 실패면 라이브 폴백
      const scene = playCutscene(cutsceneUrl('timejump'));
      container.appendChild(scene.el);
      void scene.done.then((r) => {
        if (advanced) return;
        if (r === 'error') runLive();
        else advance();
      });
    },
    exit() {
      if (timer) window.clearTimeout(timer);
    },
  };
}
