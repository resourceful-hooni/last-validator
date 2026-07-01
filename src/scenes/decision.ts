/**
 * decision.ts — ACT1 결정 씬 팩토리(S1~S5, 데이터 주도). (STORYBOARD S1~S5)
 * 셋업 모션 → 선택 → state 반영 + 대시보드 애니메이션 → 피드백 카드 → 다음.
 * S4 효율(A): 전 KPI 초록 점등 → 초록빛 정점 → vCap '측정 안 함' 디밍(경보 꺼짐).
 * state.picks를 읽어 (언어 전환 재렌더 시) 진행 상태를 유지한다.
 */
import type { Scene, SceneContext } from '../engine/SceneEngine';
import { t } from '../i18n';
import { renderRich, renderPlain } from '../i18n/richText';
import { fadeUp, prefersReducedMotion } from '../engine/motion';
import { gsap } from 'gsap';
import { state } from '../engine/state';
import { DECISIONS } from '../data/script';
import type { DecisionScene, Pick } from '../data/script';
import { createChoiceCard } from '../components/ChoiceCard';
import { createFeedbackCard } from '../components/FeedbackCard';
import { greenVeil } from '../engine/motion';
import { audio } from '../engine/audio';
import './scene.css';

export function createDecisionScene(d: DecisionScene, index: number): Scene {
  const nextId = DECISIONS[index + 1]?.id ?? 's6';
  const nextLabelKey = index + 1 >= DECISIONS.length ? 'ui.btn.tenYears' : 'ui.btn.nextDecision';

  return {
    id: d.id,
    enter(container: HTMLElement, ctx: SceneContext) {
      ctx.hud.show(true);
      ctx.hud.setAct('ui.act1Badge');
      ctx.hud.setProgress(index + 1);
      ctx.hud.dashboard.syncInstant();
      ctx.stage?.setScene('dash');
      ctx.stage?.clearHero();
      ctx.stage?.setMood(state.vbarKilled ? 'green' : state.greens.some(Boolean) ? 'green' : 'neutral');

      const already = state.picks[d.id];

      container.innerHTML = `
        <p class="scene__meta">${renderPlain(t(d.metaKey))}</p>
        <h2 class="scene__title">${renderPlain(t(d.titleKey))}</h2>
        <p class="scene__body">${renderRich(t(d.bodyKey))}</p>
        <div class="slot"></div>
      `;
      const slot = container.querySelector<HTMLDivElement>('.slot')!;

      if (already) {
        renderFeedback(already);
      } else {
        const choices = document.createElement('div');
        choices.className = 'choices';
        choices.append(
          createChoiceCard(d.a, 'A', choose),
          createChoiceCard(d.b, 'B', choose),
        );
        slot.appendChild(choices);
      }

      ctx.gsapCtx.add(() => {
        fadeUp(container.querySelectorAll('.scene__meta, .scene__title, .scene__body'), { stagger: 0.1 });
        if (!already) fadeUp(container.querySelectorAll('.choice'), { delay: 0.25, stagger: 0.08 });
      });

      function choose(pick: Pick): void {
        if (ctx.engine.isLocked) return;
        const choice = pick === 'A' ? d.a : d.b;
        state.applyChoice(d.id, pick, choice);

        // 3D 배경 분위기: 효율=초록(거짓 성공)/보존=호박
        ctx.stage?.setMood(choice.efficient ? 'green' : 'amber');

        // 대시보드 애니메이션
        const isS4Eff = d.id === 's4' && choice.efficient;
        if (choice.efficient) {
          ctx.hud.dashboard.animateChoice(choice.kpi, {
            all: isS4Eff,
            killVbar: choice.killVbar === true,
          });
          if (isS4Eff) {
            ctx.hud.dashboard.flashGreen();
            if (!prefersReducedMotion()) greenVeil(); // 만족의 정점(은은한 초록빛)
            audio.ding();
            audio.alarmOff(); // 험이 끊기고 정적
          } else {
            audio.ding();
          }
        } else {
          ctx.hud.dashboard.animateChoice(choice.kpi, {});
          if (d.id === 's4') ctx.hud.dashboard.addRedFlag(); // 불편한 빨간 지표
          audio.thud();
        }

        // 선택지 → 피드백 크로스페이드
        const old = slot.querySelector('.choices');
        if (old && !prefersReducedMotion()) {
          gsap.to(old, {
            opacity: 0,
            y: -6,
            duration: 0.3,
            onComplete: () => {
              old.remove();
              renderFeedback(pick);
            },
          });
        } else {
          old?.remove();
          renderFeedback(pick);
        }
      }

      function renderFeedback(pick: Pick): void {
        const choice = pick === 'A' ? d.a : d.b;
        const card = createFeedbackCard(choice, nextLabelKey, () => {
          void ctx.engine.next(nextId);
        });
        slot.appendChild(card);
        ctx.gsapCtx.add(() => fadeUp(card, { delay: 0.05 }));
      }
    },
  };
}
