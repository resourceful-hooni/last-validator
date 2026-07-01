/**
 * LangSwitcher.ts — 언어 전환 세그먼트. (I18N §7, DESIGN_SYSTEM §9)
 * 자기표기 라벨, 현재 선택 강조, 키보드/aria, 터치 타깃 ≥44px. 진행 중 전환 허용.
 */
import { SUPPORTED, LOCALE_LABELS, getLocale, setLocale, onLocaleChange, type Locale } from '../i18n';
import './lang-switcher.css';

export function createLangSwitcher(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'lang-switcher';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'Language / 언어');

  const buttons = new Map<Locale, HTMLButtonElement>();

  const sync = () => {
    const cur = getLocale();
    buttons.forEach((btn, loc) => {
      const active = loc === cur;
      if (active) btn.setAttribute('aria-current', 'true'); // 현재 언어 semantics(토글 aria-pressed보다 정확)
      else btn.removeAttribute('aria-current');
      btn.classList.toggle('is-active', active);
    });
  };

  for (const loc of SUPPORTED) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-switcher__btn';
    btn.lang = loc;
    btn.textContent = LOCALE_LABELS[loc];
    btn.addEventListener('click', () => {
      if (loc !== getLocale()) void setLocale(loc);
    });
    buttons.set(loc, btn);
    wrap.appendChild(btn);
  }

  onLocaleChange(sync);
  sync();
  return wrap;
}
