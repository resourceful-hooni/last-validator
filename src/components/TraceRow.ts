/**
 * TraceRow.ts — 역추적 행(S10). 좌측 빨강 보더 + 연도 라벨 + 문장 + 빨강 화살표(draw).
 * (DESIGN_SYSTEM §4)
 */
import { t } from '../i18n';
import { renderPlain } from '../i18n/richText';
import { drawPath } from '../engine/motion';

export function createTraceRow(yrKey: string, txtKey: string): { el: HTMLDivElement; play: (delay?: number) => void } {
  const el = document.createElement('div');
  el.className = 'trace-row';
  el.innerHTML = `
    <span class="trace-row__yr">${renderPlain(t(yrKey))}</span>
    <span class="trace-row__txt">${renderPlain(t(txtKey))}</span>
    <svg class="trace-row__arrow" viewBox="0 0 40 12" aria-hidden="true">
      <path d="M2 6 H32 M27 2 L33 6 L27 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const path = el.querySelector<SVGPathElement>('path')!;
  const play = (delay = 0): void => {
    drawPath(path, { delay, duration: 0.6 });
  };
  return { el, play };
}
