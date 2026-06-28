/**
 * main.ts — 부트스트랩. (Phase 0.5 셸 + Phase 1 엔진 + Phase 1.5 i18n)
 * 순서: i18n init → hreflang 주입 → 상단바 → 프리로더 → 씬 엔진 시작.
 * 언어 전환 시 현재 씬을 재렌더(상태 유지)한다.
 */
import './styles/tokens.css';
import './styles/base.css';

import { initI18n, onLocaleChange, injectAlternateLinks } from './i18n';
import { createTopBar } from './components/TopBar';
import { createPreloader } from './components/Preloader';
import { SceneEngine } from './engine/SceneEngine';
import { createDemoIntro } from './scenes/demoIntro';
import { createDemoDecision } from './scenes/demoDecision';

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  app.replaceChildren();

  await initI18n();
  injectAlternateLinks();

  // 전역 상단바 (음소거 토글 + LangSwitcher) — body에 fixed
  document.body.appendChild(createTopBar());

  // 프리로더 (첫 화면 팝인 방지)
  const pre = createPreloader();
  document.body.appendChild(pre.el);

  // 씬 마운트 루트
  const root = document.createElement('main');
  root.id = 'scene-root';
  app.appendChild(root);

  const engine = new SceneEngine(root);
  engine
    .register('demo-intro', createDemoIntro)
    .register('demo-decision', createDemoDecision);

  // 진행 중 언어 전환 → 현재 씬 재렌더(텍스트·폰트 교체, 상태 유지)
  onLocaleChange(() => {
    void engine.rerenderCurrent();
  });

  await pre.done();
  await engine.next('demo-intro');
}

void boot();
