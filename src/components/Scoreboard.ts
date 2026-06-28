/**
 * Scoreboard.ts — ACT1 결산 스코어보드(S6). 3칸, 값 초록, 카운트업. (DESIGN_SYSTEM §4)
 * 수치: 운영효율 = 20+eff*16, 비용 = 8+eff*5. 대시보드 = eff>=3 ? 올 초록 : 양호.
 */
import { t } from '../i18n';
import { scoreEfficiency, scoreCost } from '../data/script';
import { countTo } from '../engine/motion';

export class Scoreboard {
  readonly el: HTMLDivElement;
  private readonly effNum: HTMLSpanElement;
  private readonly costNum: HTMLSpanElement;
  private readonly effVal: number;
  private readonly costVal: number;

  constructor(eff: number) {
    this.effVal = scoreEfficiency(eff);
    this.costVal = scoreCost(eff);
    const dashKey = eff >= 3 ? 's6.scoreDashAllGreen' : 's6.scoreDashGood';

    this.el = document.createElement('div');
    this.el.className = 'scoreboard';

    const num = (id: string) => `<span class="sb__num" data-id="${id}">0</span>`;
    this.el.innerHTML = `
      <div class="sb__cell">
        <span class="sb__value">${t('s6.scoreEfficiency', { value: num('eff') })}</span>
      </div>
      <div class="sb__cell">
        <span class="sb__value">${t('s6.scoreCost', { value: num('cost') })}</span>
      </div>
      <div class="sb__cell">
        <span class="sb__label">${t('s6.scoreDashLabelDash')}</span>
        <span class="sb__value">${t(dashKey)}</span>
      </div>
    `;
    this.effNum = this.el.querySelector('[data-id="eff"]')!;
    this.costNum = this.el.querySelector('[data-id="cost"]')!;
  }

  animate(): void {
    countTo(0, this.effVal, (v) => (this.effNum.textContent = String(Math.round(v))), { duration: 1 });
    countTo(0, this.costVal, (v) => (this.costNum.textContent = String(Math.round(v))), { duration: 1, delay: 0.1 });
  }
}
