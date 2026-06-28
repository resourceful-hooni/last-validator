/**
 * Preloader.ts — 첫 화면 팝인 방지. (TECH_SPEC §9, DESIGN_SYSTEM §8, TASKS Phase 0.5)
 * --bg 중앙 워드마크 + 얇은 빨강 진행 인디케이터. reduced-motion 시 정적.
 * 폰트/초기 에셋 준비(document.fonts.ready) 후 사라지고 S0 진입.
 */
import { t } from '../i18n';
import { prefersReducedMotion } from '../engine/motion';
import './preloader.css';

export function createPreloader(): { el: HTMLElement; done: () => Promise<void> } {
  const el = document.createElement('div');
  el.className = 'preloader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  const word = document.createElement('div');
  word.className = 'preloader__word';
  word.textContent = t('ui.brand');

  const track = document.createElement('div');
  track.className = 'preloader__track';
  const fill = document.createElement('div');
  fill.className = 'preloader__fill';
  if (prefersReducedMotion()) fill.style.width = '100%';
  track.appendChild(fill);

  el.append(word, track);

  const done = async (): Promise<void> => {
    // 폰트 준비 대기(시스템 폰트면 즉시) + 최소 표시 시간
    const fontsReady = (document.fonts?.ready ?? Promise.resolve()) as Promise<unknown>;
    const minShow = new Promise<void>((r) => setTimeout(r, prefersReducedMotion() ? 120 : 450));
    await Promise.all([fontsReady, minShow]);
    return new Promise<void>((resolve) => {
      el.classList.add('is-leaving');
      setTimeout(
        () => {
          el.remove();
          resolve();
        },
        prefersReducedMotion() ? 0 : 400,
      );
    });
  };

  return { el, done };
}
