/**
 * Dashboard.ts — 운영 대시보드 카드(4 KPI + vCap 바). (DESIGN_SYSTEM §4)
 * state를 읽어 동기화하고, 선택 결과를 애니메이션한다.
 */
import { t, onLocaleChange } from '../i18n';
import { state } from '../engine/state';
import { KPI_LABEL_KEYS } from '../data/script';
import type { KpiIndex } from '../data/script';
import { KpiChip } from './KpiChip';
import { VCapBar } from './VCapBar';
import './dashboard.css';

export class Dashboard {
  readonly el: HTMLDivElement;
  private readonly titleEl: HTMLDivElement;
  private readonly chips: KpiChip[];
  private readonly vbar: VCapBar;
  private timers: number[] = [];

  private after(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dashboard';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'dashboard__title';

    const grid = document.createElement('div');
    grid.className = 'dashboard__grid';
    this.chips = KPI_LABEL_KEYS.map((key, i) => new KpiChip(i, key));
    this.chips.forEach((c) => grid.appendChild(c.el));

    this.vbar = new VCapBar();

    this.el.append(this.titleEl, grid, this.vbar.el);
    this.syncText();
    this.syncInstant();

    onLocaleChange(() => this.syncText());
  }

  syncText(): void {
    this.titleEl.textContent = t('ui.dashTitle');
    this.chips.forEach((c) => c.syncText());
    this.vbar.syncText();
  }

  /** 현재 state를 애니메이션 없이 즉시 반영(씬 진입 시) */
  syncInstant(): void {
    this.chips.forEach((c) => c.setStatus(state.kpiStatus(c.kpiIndex as KpiIndex), false));
    this.vbar.syncInstant(state.vCap, state.vbarKilled);
  }

  /** 선택 결과 애니메이션. state는 이미 적용된 상태로 호출한다. */
  animateChoice(kpi: KpiIndex, opts: { all?: boolean; killVbar?: boolean }): void {
    if (opts.all) {
      // S4-A: 남은 KPI까지 일괄 초록 점등(약간의 stagger)
      this.chips.forEach((c, i) => {
        this.after(i * 90, () => c.setStatus(state.kpiStatus(c.kpiIndex as KpiIndex), true));
      });
    } else {
      const chip = this.chips[kpi];
      chip?.setStatus(state.kpiStatus(kpi), true);
    }
    if (opts.killVbar) {
      // 초록 정점 직후 vCap 디밍
      this.after(opts.all ? 520 : 200, () => this.vbar.kill(true));
    } else {
      this.vbar.setValue(state.vCap, true);
    }
  }

  /** 빨간 불편 지표 1개 추가(S4-B 시각적 불편) */
  addRedFlag(): void {
    this.el.classList.add('has-redflag');
  }

  flashGreen(): void {
    this.el.classList.add('is-flash');
    this.after(700, () => this.el.classList.remove('is-flash'));
  }

  reset(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.el.classList.remove('has-redflag', 'is-flash');
    this.chips.forEach((c) => c.reset());
    this.vbar.reset();
  }
}
