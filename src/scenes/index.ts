/**
 * scenes/index.ts — ACT1 결산~엔딩(S6~S12) 씬 등록.
 */
import type { SceneEngine } from '../engine/SceneEngine';
import { createS6Settlement } from './s6_settlement';
import { createS7Reveal } from './s7_reveal';
import { createS8Timejump } from './s8_timejump';
import { createS9Er } from './s9_er';
import { createEnding } from './ending';

export function registerActTwoScenes(engine: SceneEngine): void {
  engine.register('s6', createS6Settlement);
  engine.register('s7', createS7Reveal);
  engine.register('s8', createS8Timejump);
  engine.register('s9', createS9Er);
  // s10 = 엔딩 시퀀스(S10 역추적 + S11 앵커 + S12 명제/CTA/리플레이)
  engine.register('s10', createEnding);
}
