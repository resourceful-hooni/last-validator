/**
 * Hud.ts — ACT1 상시 상단 UI: 로고 + ACT 뱃지 + 진행(01/05) + 운영 대시보드.
 * 풀스크린 장면(S0/S6/S7/S8/S12)에서는 숨긴다.
 * (STORYBOARD 전역 UI, DESIGN_SYSTEM §4)
 */
import { t, onLocaleChange } from '../i18n';
import { Dashboard } from './Dashboard';
import './hud.css';

export class Hud {
  readonly el: HTMLElement;
  readonly dashboard: Dashboard;
  private readonly brandEl: HTMLSpanElement;
  private readonly actEl: HTMLSpanElement;
  private readonly progEl: HTMLSpanElement;
  private actKey = 'ui.act1Badge';
  private progN = 1;

  constructor() {
    this.el = document.createElement('header');
    this.el.className = 'hud';

    const bar = document.createElement('div');
    bar.className = 'hud__bar';
    this.brandEl = document.createElement('span');
    this.brandEl.className = 'hud__brand';
    this.actEl = document.createElement('span');
    this.actEl.className = 'hud__act';
    this.progEl = document.createElement('span');
    this.progEl.className = 'hud__prog';
    bar.append(this.brandEl, this.actEl, this.progEl);

    this.dashboard = new Dashboard();

    this.el.append(bar, this.dashboard.el);
    this.syncText();
    onLocaleChange(() => this.syncText());
  }

  syncText(): void {
    this.brandEl.textContent = t('ui.brand');
    this.actEl.textContent = t(this.actKey);
    this.progEl.textContent = t('ui.progress', { n: String(this.progN).padStart(2, '0') });
  }

  setProgress(n: number): void {
    this.progN = n;
    this.progEl.textContent = t('ui.progress', { n: String(n).padStart(2, '0') });
  }

  setAct(key: 'ui.act1Badge' | 'ui.act2Badge'): void {
    this.actKey = key;
    this.actEl.textContent = t(key);
  }

  show(visible: boolean): void {
    this.el.classList.toggle('is-hidden', !visible);
  }
}
