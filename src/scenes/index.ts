/**
 * scenes/index.ts — ACT1 결산~엔딩(S6~S12) 씬 등록.
 * 동적 import로 코드 스플릿(초기 번들 절감 · TECH_SPEC §6).
 */
import type { SceneEngine } from '../engine/SceneEngine';

export function registerActTwoScenes(engine: SceneEngine): void {
  engine.register('s6', () => import('./s6_settlement').then((m) => m.createS6Settlement()));
  engine.register('s7', () => import('./s7_reveal').then((m) => m.createS7Reveal()));
  engine.register('s8', () => import('./s8_timejump').then((m) => m.createS8Timejump()));
  engine.register('s9', () => import('./s9_er').then((m) => m.createS9Er()));
  // s10 = 엔딩 시퀀스(S10 역추적 + S11 앵커 + S12 명제/CTA/리플레이)
  engine.register('s10', () => import('./ending').then((m) => m.createEnding()));
}
