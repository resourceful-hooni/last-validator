/**
 * demoDecision.ts — Phase 1 검증용 결정 씬(S1 데이터). 선택→state 반영→피드백/델타.
 * state.picks를 읽어 (재렌더/언어전환 시) 진행 상태를 유지한다.
 * (Phase 3의 정식 s1..s5 + ChoiceCard/Dashboard가 이 자리를 대체한다.)
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp } from '../engine/motion';
import { state } from '../engine/state';
import { DECISIONS } from '../data/script';
import type { Choice, Pick } from '../data/script';
import './scene.css';

const D = DECISIONS[0]!; // s1

export function createDemoDecision(): Scene {
  return {
    id: 'demo-decision',
    enter(container: HTMLElement, ctx: SceneContext) {
      const picked = state.picks[D.id];
      container.innerHTML = picked
        ? feedbackView(picked, picked === 'A' ? D.a : D.b)
        : choiceView();

      if (!picked) {
        container.querySelector('[data-pick="A"]')?.addEventListener('click', () => choose('A'));
        container.querySelector('[data-pick="B"]')?.addEventListener('click', () => choose('B'));
      } else {
        container.querySelector('[data-replay]')?.addEventListener('click', () => {
          state.reset();
          void ctx.engine.next('demo-intro');
        });
      }

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__meta, .scene__title, .scene__body, .choice, .btn, .chips, .demo-state'), {
          stagger: 0.06,
        });
      });

      function choose(pick: Pick) {
        if (ctx.engine.isLocked) return;
        const choice = pick === 'A' ? D.a : D.b;
        state.applyChoice(D.id, pick, choice);
        // 같은 씬을 피드백 뷰로 다시 그린다
        void ctx.engine.rerenderCurrent();
      }
    },
  };

  function choiceView(): string {
    return `
      <p class="scene__meta">${renderPlain(t(D.metaKey))}</p>
      <h2 class="scene__title">${renderPlain(t(D.titleKey))}</h2>
      <p class="scene__body">${renderRich(t(D.bodyKey))}</p>
      <div class="choices">
        ${choiceCard(D.a, 'A')}
        ${choiceCard(D.b, 'B')}
      </div>
    `;
  }

  function choiceCard(c: Choice, pick: Pick): string {
    const tagKey = c.tag === 'efficient' ? 'ui.tag.efficient' : 'ui.tag.preserve';
    return `
      <button class="choice" type="button" data-pick="${pick}">
        <span class="choice__tag">${renderPlain(t(tagKey))}</span>
        <span class="choice__text">${renderPlain(t(c.textKey))}</span>
        <span class="choice__sub">${renderPlain(t(c.subKey))}</span>
      </button>
    `;
  }

  function feedbackView(pick: Pick, c: Choice): string {
    const chips = c.efficient
      ? `<span class="chip chip--up">${renderPlain(t('ui.delta.greenUp'))}</span>
         <span class="chip chip--dn">${renderPlain(t('ui.delta.vcapDown'))}</span>`
      : `<span class="chip chip--hold">${renderPlain(t('ui.delta.effLoss'))}</span>
         <span class="chip chip--hold">${renderPlain(t('ui.delta.vcapHold'))}</span>`;
    return `
      <p class="scene__meta">${renderPlain(t(D.metaKey))}</p>
      <h2 class="scene__title">${renderPlain(t(D.titleKey))}</h2>
      <p class="scene__body">${renderRich(t(c.feedbackKey))}</p>
      <div class="chips">${chips}</div>
      <button class="btn btn--ghost" type="button" data-replay>${renderPlain(t('ui.btn.replay'))}</button>
      <p class="demo-state">[demo] pick=${pick} · vCap=${state.vCap} · eff=${state.eff} · branch=${state.endingBranch()}</p>
    `;
  }
}
