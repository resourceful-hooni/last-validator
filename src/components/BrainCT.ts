/**
 * BrainCT.ts — 추상 뇌 CT 비주얼(자작 벡터). (STORYBOARD S9, 절대규칙: 상징적·비자극)
 * 평소 'AI 오버레이'(점선 윤곽)가 병변을 짚다가, 결정적 순간 분기별로 다르게 동작:
 *  - tragedy: 오버레이가 엉뚱한 곳을 짚고 사라짐(놓침).
 *  - nearmiss: 오버레이가 깜빡이다 흐려지고, 사람 표식이 뒤늦게 병변을 짚음.
 *  - averted: 사람 표식이 병변을 분명히 짚음.
 * 사실적 얼굴/사진 없음. 느린 스캔 + 부드러운 글로우(점멸/스트로브 금지).
 */
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../engine/motion';
import type { Branch } from '../data/script';
import './brain-ct.css';

const SVG = `
<svg viewBox="0 0 220 220" class="ct__svg" aria-hidden="true">
  <defs>
    <clipPath id="ctClip"><ellipse cx="110" cy="112" rx="78" ry="86"/></clipPath>
  </defs>
  <!-- 두개골 단면 윤곽 -->
  <ellipse cx="110" cy="112" rx="78" ry="86" class="ct__skull"/>
  <ellipse cx="110" cy="112" rx="68" ry="76" class="ct__inner"/>
  <g clip-path="url(#ctClip)" class="ct__contours">
    <path d="M70 70 C95 95 95 130 72 158" />
    <path d="M150 70 C125 95 125 130 148 158" />
    <path d="M110 60 C108 100 112 140 110 170" />
    <path d="M64 112 H156" />
  </g>
  <!-- 실제 병변(은은) -->
  <circle cx="140" cy="92" r="9" class="ct__lesion"/>
  <!-- AI 오버레이(점선 윤곽) -->
  <circle cx="84" cy="138" r="16" class="ct__ai"/>
  <!-- 사람 표식(나중에 병변을 짚음) -->
  <g class="ct__human">
    <circle cx="140" cy="92" r="14"/>
    <path d="M140 74 V70 M140 110 V114 M122 92 H118 M158 92 H162"/>
  </g>
  <!-- 스캔 라인 -->
  <line x1="32" x2="188" y1="40" y2="40" class="ct__scan"/>
</svg>`;

export function createBrainCT(branch: Branch): { el: HTMLDivElement; play: () => void } {
  const el = document.createElement('div');
  el.className = 'ct';
  el.dataset.branch = branch;
  el.innerHTML = SVG;

  const scan = el.querySelector<SVGLineElement>('.ct__scan')!;
  const ai = el.querySelector<SVGCircleElement>('.ct__ai')!;
  const human = el.querySelector<SVGGElement>('.ct__human')!;

  const play = (): void => {
    if (prefersReducedMotion()) {
      // 최종 상태만: 분기에 따라 오버레이/사람 표식 표시
      gsap.set(scan, { attr: { y1: 180, y2: 180 }, opacity: 0.0 });
      if (branch === 'tragedy') {
        gsap.set(ai, { opacity: 0 });
        gsap.set(human, { opacity: 0 });
      } else {
        gsap.set(ai, { opacity: 0.25 });
        gsap.set(human, { opacity: 1 });
      }
      return;
    }

    const tl = gsap.timeline();
    // 느린 스캔(위→아래)
    tl.fromTo(scan, { attr: { y1: 40, y2: 40 }, opacity: 0.9 }, { attr: { y1: 184, y2: 184 }, duration: 2.4, ease: 'none' }, 0)
      .to(scan, { opacity: 0, duration: 0.4 }, 2.2);

    // AI 오버레이: 부드럽게 나타났다가(짚는 척) 분기별 처리
    tl.fromTo(ai, { opacity: 0 }, { opacity: 0.8, duration: 0.6 }, 0.6);

    if (branch === 'tragedy') {
      // 엉뚱한 곳을 짚다 사라짐 — 병변은 끝내 미표시
      tl.to(ai, { opacity: 0.2, duration: 0.5 }, 1.8).to(ai, { opacity: 0, duration: 0.6 }, 2.6);
    } else if (branch === 'nearmiss') {
      // 깜빡이다 흐려지고, 사람 표식이 뒤늦게 병변을 짚음
      tl.to(ai, { opacity: 0.25, duration: 0.5 }, 1.8)
        .to(ai, { opacity: 0.6, duration: 0.5 }, 2.3)
        .to(ai, { opacity: 0.15, duration: 0.5 }, 2.9)
        .fromTo(human, { opacity: 0, scale: 0.7, transformOrigin: '140px 92px' }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 3.0);
    } else {
      // averted: 사람 표식이 병변을 분명히 짚음
      tl.to(ai, { opacity: 0.2, duration: 0.5 }, 1.8).fromTo(
        human,
        { opacity: 0, scale: 0.7, transformOrigin: '140px 92px' },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' },
        2.2,
      );
    }
  };

  return { el, play };
}
