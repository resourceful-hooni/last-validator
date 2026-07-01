/**
 * TopBar.ts — 전역 상단 컨트롤: 음소거 토글(자작 SVG) + LangSwitcher.
 * (TECH_SPEC §9, DESIGN_SYSTEM §8/§9, TASKS Phase 0.5)
 * 오디오 매니저는 Phase 7. 여기서는 토글 UI/상태만 둔다(기본 음소거).
 */
import { t, onLocaleChange, getLocale } from '../i18n';
import { createLangSwitcher } from './LangSwitcher';
import { activateAudio } from '../engine/audio';
import { isNarrationEnabled, setNarration, onNarrationChange, markStarted } from '../engine/narration';
import './top-bar.css';

/** 전역 음소거 상태 (기본 재생 = false). audio.ts가 구독한다. */
let muted = false;
const muteListeners = new Set<(m: boolean) => void>();
let syncUI: (() => void) | null = null;
export const isMuted = (): boolean => muted;
export function onMuteChange(cb: (m: boolean) => void): () => void {
  muteListeners.add(cb);
  return () => muteListeners.delete(cb);
}

/** 프로그램적으로 음소거 상태 설정(예: 시작 제스처 후 소리 켜기). 버튼 UI·구독자 동기화. */
export function setMute(m: boolean): void {
  if (muted === m) return;
  muted = m;
  syncUI?.();
  muteListeners.forEach((cb) => cb(muted));
}

const ICON_MUTED = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>`;
const ICON_ON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>`;
// 낭독(내레이션) 토글 아이콘 — 말풍선 + 대사줄(켜짐) / 사선(꺼짐)
const ICON_NARR_ON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H8l-4 4V5z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="12" x2="13" y2="12"/></svg>`;
const ICON_NARR_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H8l-4 4V5z"/><line x1="5" y1="3.5" x2="19" y2="17.5"/></svg>`;

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
    muteBtn.classList.remove('is-hint');
  });
  onLocaleChange(syncMute);
  syncUI = syncMute;
  syncMute();

  // 낭독 토글 — 감정 낭독 클립은 영어만 존재 → en 로케일에서만 노출(그 외 무음).
  const narrateBtn = document.createElement('button');
  narrateBtn.type = 'button';
  narrateBtn.className = 'top-bar__mute top-bar__narrate';
  const syncNarrate = (): void => {
    const on = isNarrationEnabled();
    narrateBtn.innerHTML = on ? ICON_NARR_ON : ICON_NARR_OFF;
    narrateBtn.setAttribute('aria-label', on ? t('ui.narrate.off') : t('ui.narrate.on'));
    narrateBtn.setAttribute('aria-pressed', String(on));
    narrateBtn.classList.toggle('is-active', on);
    narrateBtn.style.display = getLocale() === 'en' ? '' : 'none';
  };
  narrateBtn.addEventListener('click', () => {
    activateAudio(); // 클릭=제스처 → 오디오 활성
    markStarted();
    setNarration(!isNarrationEnabled());
  });
  onNarrationChange(syncNarrate);
  onLocaleChange(syncNarrate);
  syncNarrate();

  bar.appendChild(createLangSwitcher());
  bar.appendChild(narrateBtn);
  bar.appendChild(muteBtn);
  return bar;
}
