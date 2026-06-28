/**
 * TopBar.ts — 전역 상단 컨트롤: 음소거 토글(자작 SVG) + LangSwitcher.
 * (TECH_SPEC §9, DESIGN_SYSTEM §8/§9, TASKS Phase 0.5)
 * 오디오 매니저는 Phase 7. 여기서는 토글 UI/상태만 둔다(기본 음소거).
 */
import { t, onLocaleChange } from '../i18n';
import { createLangSwitcher } from './LangSwitcher';
import './top-bar.css';

/** 전역 음소거 상태 (기본 ON = 음소거). Phase 7 audio.ts가 구독한다. */
let muted = true;
const muteListeners = new Set<(m: boolean) => void>();
export const isMuted = (): boolean => muted;
export function onMuteChange(cb: (m: boolean) => void): () => void {
  muteListeners.add(cb);
  return () => muteListeners.delete(cb);
}

const ICON_MUTED = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>`;
const ICON_ON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>`;

export function createTopBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'top-bar';

  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'top-bar__mute';

  const syncMute = () => {
    muteBtn.innerHTML = muted ? ICON_MUTED : ICON_ON;
    // muted=true → 다음 동작은 '소리 켜기'
    muteBtn.setAttribute('aria-label', muted ? t('ui.unmute') : t('ui.mute'));
    muteBtn.setAttribute('aria-pressed', String(muted));
  };

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    syncMute();
    muteListeners.forEach((cb) => cb(muted));
  });
  onLocaleChange(syncMute);
  syncMute();

  bar.appendChild(createLangSwitcher());
  bar.appendChild(muteBtn);
  return bar;
}
