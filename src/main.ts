/**
 * main.ts — 부트스트랩. (셸 + 엔진 + i18n + HUD + 씬 등록)
 * 순서: i18n init → hreflang 주입 → 상단바 → HUD → 프리로더 → 씬 엔진 시작(S0).
 */
import './styles/tokens.css';
import './styles/base.css';

import { initI18n, onLocaleChange, injectAlternateLinks } from './i18n';
import { createTopBar, onMuteChange } from './components/TopBar';
import { setMuted } from './engine/audio';
import { createPreloader } from './components/Preloader';
import { Hud } from './components/Hud';
import { SceneEngine } from './engine/SceneEngine';
import { createS0Title } from './scenes/s0_title';
import { createDecisionScene } from './scenes/decision';
import { DECISIONS } from './data/script';
import { registerActTwoScenes } from './scenes';
import { state as stateRef } from './engine/state';

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  app.replaceChildren();

  await initI18n();
  injectAlternateLinks();

  document.body.appendChild(createTopBar());
  onMuteChange((m) => setMuted(m)); // 음소거 토글 → 오디오 마스터

  const hud = new Hud();
  app.appendChild(hud.el);

  const pre = createPreloader();
  document.body.appendChild(pre.el);

  const root = document.createElement('main');
  root.id = 'scene-root';
  app.appendChild(root);

  const engine = new SceneEngine(root, { hud });

  // S0 + ACT1 결정 5개(데이터 주도)
  engine.register('s0', createS0Title);
  DECISIONS.forEach((d, i) => engine.register(d.id, () => createDecisionScene(d, i)));
  // ACT1 결산 ~ 엔딩(S6~S12)
  registerActTwoScenes(engine);

  onLocaleChange(() => {
    void engine.rerenderCurrent();
  });

  // 개발 전용 디버그 훅(빌드시 트리셰이킹). 검증/QA용.
  if (import.meta.env.DEV) {
    const { gsap } = await import('gsap');
    (window as unknown as { __app: unknown }).__app = { engine, hud, state: stateRef, gsap };
  }

  await pre.done();
  await engine.next('s0');
}

void boot();
