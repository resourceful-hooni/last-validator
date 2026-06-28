/**
 * s0_title.ts — 오프닝/타이틀 (STORYBOARD S0). 풀스크린, 시네마틱 stagger.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp, staggerIn, prefersReducedMotion } from '../engine/motion';
import { gsap } from 'gsap';
import './scene.css';

/** 글자별 stagger를 위해 텍스트를 span으로 분해(공백 보존) */
function splitChars(text: string): string {
  return [...text]
    .map((ch) => (ch === ' ' ? '<span class="ch">&nbsp;</span>' : `<span class="ch">${renderPlain(ch)}</span>`))
    .join('');
}

export function createS0Title(): Scene {
  return {
    id: 's0',
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(false);
      container.classList.add('scene--center', 'scene--fs');
      container.innerHTML = `
        <p class="scene__kicker">${renderPlain(t('s0.kicker'))}</p>
        <h1 class="scene__title scene__title--hero s0-title">${splitChars(t('s0.title'))}</h1>
        <p class="scene__body s0-lead">${renderRich(t('s0.lead'))}</p>
        <p class="scene__body s0-lead">${renderRich(t('s0.lead2'))}</p>
        <button class="btn s0-cta" type="button" data-start>${renderPlain(t('ui.btn.start'))}</button>
        <p class="scene__footer s0-foot">${renderPlain(t('s0.footer'))}</p>
        <p class="scene__note s0-foot">${renderPlain(t('ui.supplementNote'))}</p>
      `;

      container.querySelector<HTMLButtonElement>('[data-start]')?.addEventListener('click', () => {
        void ctx.engine.next('s1');
      });

      ctx.gsapCtx.add(() => {
        if (prefersReducedMotion()) {
          gsap.set(container.querySelectorAll('.ch, .s0-lead, .s0-cta, .s0-foot, .scene__kicker'), { opacity: 1, y: 0 });
          return;
        }
        const tl = gsap.timeline();
        tl.fromTo('.scene__kicker', { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
          .add(() => staggerIn(container.querySelectorAll('.s0-title .ch'), { each: 0.045, max: 0.5 }), '-=0.1')
          .add(() => fadeUp(container.querySelectorAll('.s0-lead'), { stagger: 0.12 }), '+=0.15')
          .add(() => fadeUp(container.querySelectorAll('.s0-cta, .s0-foot'), { stagger: 0.08 }), '-=0.1');
      });
    },
  };
}
