/**
 * GoldenClock.ts — 골든타임 시계(자작 벡터). 원형 아크가 줄어드는 카운트다운. (STORYBOARD S9)
 * 분기색 적용. reduced-motion 시 분기에 맞는 최종 상태로 즉시 표시.
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../engine/motion';
import type { Branch } from '../data/script';
import './golden-clock.css';

const R = 26;
const C = 2 * Math.PI * R;

export function createGoldenClock(branch: Branch): { el: HTMLDivElement; play: () => void } {
  const el = document.createElement('div');
  el.className = 'gclock';
  el.dataset.branch = branch;
  el.innerHTML = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="${R}" class="gclock__track"/>
      <circle cx="32" cy="32" r="${R}" class="gclock__arc"
        stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 32 32)"/>
      <circle cx="32" cy="32" r="2.4" class="gclock__hub"/>
    </svg>`;
  const arc = el.querySelector<SVGCircleElement>('.gclock__arc')!;

  // 분기별 남는 시간: tragedy 거의 소진 / nearmiss 아슬 / averted 여유
  const remain = branch === 'tragedy' ? 0.04 : branch === 'nearmiss' ? 0.22 : 0.45;

  const play = (): void => {
    const targetOffset = C * (1 - remain);
    if (prefersReducedMotion()) {
      arc.style.strokeDashoffset = String(targetOffset);
      return;
    }
    gsap.fromTo(
      arc,
      { strokeDashoffset: 0 },
      { strokeDashoffset: targetOffset, duration: 3.2, ease: 'power1.in' },
    );
  };

  return { el, play };
}
