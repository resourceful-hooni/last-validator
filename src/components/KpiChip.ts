/**
 * KpiChip.ts — 운영 대시보드의 단일 KPI 칩. (DESIGN_SYSTEM §4, STORYBOARD 전역 UI)
 * 상태: 중립(회색·"기준") / 초록(점등+글로우·"정상") / 호박(보더 amber).
 * 점등 시 0.5s 글로우 펄스. reduced-motion 시 즉시.
 */
import { t } from '../i18n';
import { prefersReducedMotion } from '../engine/motion';
import type { KpiStatus } from '../engine/state';

export class KpiChip {
  readonly el: HTMLDivElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly labelEl: HTMLSpanElement;
  private status: KpiStatus = 'neutral';

  constructor(
    private readonly index: number,
    private readonly labelKey: string,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'kpi-chip';
    this.el.dataset.status = 'neutral';

    this.labelEl = document.createElement('span');
    this.labelEl.className = 'kpi-chip__label';

    this.valueEl = document.createElement('span');
    this.valueEl.className = 'kpi-chip__value';

    this.el.append(this.labelEl, this.valueEl);
    this.syncText();
  }

  /** 언어 전환 시 라벨/값 텍스트 갱신 */
  syncText(): void {
    this.labelEl.textContent = t(this.labelKey);
    this.valueEl.textContent =
      this.status === 'green' ? t('ui.val.normal') : t('ui.val.baseline');
  }

  /** 상태 설정. animate=true면 초록 점등 시 글로우 펄스. */
  setStatus(status: KpiStatus, animate: boolean): void {
    const lit = status === 'green' && this.status !== 'green';
    this.status = status;
    this.el.dataset.status = status;
    this.valueEl.textContent =
      status === 'green' ? t('ui.val.normal') : t('ui.val.baseline');
    if (lit && animate && !prefersReducedMotion()) {
      this.el.classList.remove('is-pulse');
      // 리플로우로 애니메이션 재기동
      void this.el.offsetWidth;
      this.el.classList.add('is-pulse');
    }
  }

  reset(): void {
    this.status = 'neutral';
    this.el.dataset.status = 'neutral';
    this.el.classList.remove('is-pulse');
    this.syncText();
  }

  get kpiIndex(): number {
    return this.index;
  }
}
