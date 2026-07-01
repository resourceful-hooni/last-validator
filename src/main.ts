/**
 * main.ts — 부트스트랩. (셸 + 엔진 + i18n + HUD + 씬 등록)
 * 순서: i18n init → hreflang 주입 → 상단바 → HUD → 프리로더 → 씬 엔진 시작(S0).
 */
import './styles/tokens.css';
import './styles/base.css';

import { initI18n, onLocaleChange, injectAlternateLinks, getLocale } from './i18n';
import { createTopBar, onMuteChange } from './components/TopBar';
import { setMuted, audioState, activateAudio } from './engine/audio';
import { setMute } from './components/TopBar';
import { initNarration, setNarrationMuted, markStarted as narrationMarkStarted } from './engine/narration';
import { createPreloader } from './components/Preloader';
import { playCutscene, cutsceneUrl } from './components/CutsceneVideo';
import { prefersReducedMotion } from './engine/motion';
import { Hud } from './components/Hud';
import { SceneEngine } from './engine/SceneEngine';
import { createS0Title } from './scenes/s0_title';
import { createDecisionScene } from './scenes/decision';
import { DECISIONS } from './data/script';
import { registerActTwoScenes } from './scenes';
import { state as stateRef } from './engine/state';
import type { Stage } from './three/stage';

/** 현재 로케일 서브셋 폰트 1개만 preload(FOUT·첫 텍스트 지연 완화). @font-face URL과 동일 경로. */
const LOCALE_FONT: Record<string, string> = {
  ko: 'pretendard-subset',
  en: 'pretendard-subset',
  zh: 'noto-sc-subset',
  ja: 'noto-jp-subset',
};
function preloadActiveLocaleFont(): void {
  const name = LOCALE_FONT[getLocale()] ?? 'pretendard-subset';
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.href = `/fonts/${name}.woff2`;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  app.replaceChildren();

  // 3D 스테이지 청크(≈917KB) 조기 프리페치 — 셋업과 병렬 다운로드로 첫 3D 렌더 지연 완화
  const stageMod = import('./three/stage').catch(() => null);

  await initI18n();
  injectAlternateLinks();
  preloadActiveLocaleFont();

  document.body.appendChild(createTopBar());
  initNarration();
  onMuteChange((m) => {
    setMuted(m); // 음소거 토글 → 오디오 마스터
    setNarrationMuted(m); // + 낭독도 정지
  });

  // 소리 기본 재생: 자동재생 정책상 첫 사용자 제스처에 오디오 컨텍스트 활성(어떤 터치/클릭/키든).
  const startAudioOnce = (): void => {
    activateAudio();
    narrationMarkStarted(); // 첫 제스처 → 낭독 재생 허용
    window.removeEventListener('pointerdown', startAudioOnce);
    window.removeEventListener('keydown', startAudioOnce);
    window.removeEventListener('touchstart', startAudioOnce);
  };
  window.addEventListener('pointerdown', startAudioOnce);
  window.addEventListener('keydown', startAudioOnce);
  window.addEventListener('touchstart', startAudioOnce);

  // 시네마스코프 레터박스 바 (stage가 body.cinemascope 토글로 제어)
  const barTop = document.createElement('div');
  barTop.className = 'letterbar letterbar--top';
  const barBottom = document.createElement('div');
  barBottom.className = 'letterbar letterbar--bottom';
  document.body.append(barTop, barBottom);

  const hud = new Hud();
  app.appendChild(hud.el);

  const pre = createPreloader();
  document.body.appendChild(pre.el);

  const root = document.createElement('main');
  root.id = 'scene-root';
  app.appendChild(root);

  const shared: { hud: Hud; stage: Stage | null } = { hud, stage: null };
  const engine = new SceneEngine(root, shared);

  // S0 + ACT1 결정 5개(데이터 주도)
  engine.register('s0', createS0Title);
  DECISIONS.forEach((d, i) => engine.register(d.id, () => createDecisionScene(d, i)));
  // ACT1 결산 ~ 엔딩(S6~S12)
  registerActTwoScenes(engine);

  onLocaleChange(() => {
    void engine.rerenderCurrent();
  });

  // 3D 배경 스테이지 초기화(동적 import → three는 별도 청크). 미지원 시 null(2D 유지).
  try {
    const mod = await stageMod;
    if (mod) shared.stage = await mod.initStage();
  } catch (e) {
    console.warn('[main] stage init failed, 2D fallback', e);
  }

  // 개발 전용 디버그 훅(빌드시 트리셰이킹). 검증/QA용.
  if (import.meta.env.DEV) {
    const { gsap } = await import('gsap');
    (window as unknown as { __app: unknown }).__app = {
      engine,
      hud,
      state: stateRef,
      gsap,
      audioState,
      testAudio: () => {
        activateAudio();
        setMute(false);
      },
    };
  }

  await pre.done();

  // 인트로 시네마틱 컷신(자작 렌더 영상) — 진입 시 재생(스킵 가능). reduced-motion 시 생략.
  if (!prefersReducedMotion()) {
    const intro = playCutscene(cutsceneUrl('intro')); // body에 자동 부착
    await intro.done;
  }

  await engine.next('s0');
}

void boot();
