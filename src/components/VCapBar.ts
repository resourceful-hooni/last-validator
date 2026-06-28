/**
 * VCapBar.ts — '독립 검증 역량' 막대. (DESIGN_SYSTEM §4, STORYBOARD 전역 UI)
 * 작고 차분하게(주목도 낮게). 색 임계: >70 초록 / >40 호박 / ≤40 빨강.
 * 꺼짐(vbarKilled): 전체 디밍 + 값 "측정 안 함" + 막대 회색.
 */
import { t } from '../i18n';
import { countTo, prefersReducedMotion } from '../engine/motion';
import { gsap } from 'gsap';

function thresholdClass(v: number): 'high' | 'mid' | 'low' {
  return v > 70 ? 'high' : v > 40 ? 'mid' : 'low';
}

export class VCapBar {
  readonly el: HTMLDivElement;
  private readonly labelEl: HTMLSpanElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly fillEl: HTMLDivElement;
  private shownValue = 100;
  private killed = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'vcap';

    const head = document.createElement('div');
    head.className = 'vcap__head';
    this.labelEl = document.createElement('span');
    this.labelEl.className = 'vcap__label';
    this.valueEl = document.createElement('span');
    this.valueEl.className = 'vcap__value';
    head.append(this.labelEl, this.valueEl);

    const track = document.createElement('div');
    track.className = 'vcap__track';
    this.fillEl = document.createElement('div');
    this.fillEl.className = 'vcap__fill';
    track.appendChild(this.fillEl);

    this.el.append(head, track);
    this.applyThreshold(100);
    this.syncText();
    this.fillEl.style.width = '100%';
  }

  syncText(): void {
    this.labelEl.textContent = t('ui.vcap');
    this.valueEl.textContent = this.killed
      ? t('ui.vcap.off')
      : `${Math.round(this.shownValue)}%`;
  }

  private applyThreshold(v: number): void {
    this.el.dataset.threshold = thresholdClass(v);
  }

  /** vCap 값으로 막대/색/퍼센트 갱신. animate=true면 0.7s ease. */
  setValue(v: number, animate: boolean): void {
    if (this.killed) return;
    this.applyThreshold(v);
    if (animate && !prefersReducedMotion()) {
      gsap.to(this.fillEl, { width: `${v}%`, duration: 0.7, ease: 'power2.inOut' });
      countTo(this.shownValue, v, (n) => {
        this.shownValue = n;
        this.valueEl.textContent = `${Math.round(n)}%`;
      }, { duration: 0.7 });
    } else {
      this.fillEl.style.width = `${v}%`;
      this.shownValue = v;
      this.valueEl.textContent = `${Math.round(v)}%`;
    }
  }

  /** 경보 꺼짐(S4-A): 회색 디밍 + '측정 안 함'. animate=true면 부드럽게 흐려짐. */
  kill(animate: boolean): void {
    this.killed = true;
    this.el.dataset.threshold = 'off';
    this.valueEl.textContent = t('ui.vcap.off');
    if (animate && !prefersReducedMotion()) {
      gsap.to(this.el, { opacity: 0.32, duration: 0.6, ease: 'power2.inOut' });
    } else {
      this.el.style.opacity = '0.32';
    }
  }

  /** 현재 state로 즉시 동기화(씬 진입 시) */
  syncInstant(vCap: number, killed: boolean): void {
    if (killed) {
      this.killed = false; // reset then kill to set styles
      this.setValue(vCap, false);
      this.kill(false);
    } else {
      this.killed = false;
      this.el.style.opacity = '1';
      this.setValue(vCap, false);
      this.syncText();
    }
  }

  reset(): void {
    this.killed = false;
    this.shownValue = 100;
    this.el.style.opacity = '1';
    this.el.dataset.threshold = 'high';
    this.fillEl.style.width = '100%';
    this.syncText();
  }
}
