/**
 * SceneEngine.ts — 씬 전환 상태머신. (TECH_SPEC §4)
 * 각 씬은 enter(container, ctx)에서 DOM/GSAP 타임라인을 만들고, exit()에서 정리한다.
 * 전이 중에는 입력을 잠가 연타·중복 전환을 막는다(리플레이 누수 0 목표).
 */
import { gsap } from 'gsap';
import { state } from './state';
import type { Branch } from '../data/script';
import type { Hud } from '../components/Hud';

/** 모든 씬에 공유되는 컨텍스트(앱 셸) */
export interface SharedContext {
  hud: Hud;
}

export interface SceneContext extends SharedContext {
  engine: SceneEngine;
  /** 씬 트윈을 격리하는 GSAP context (exit 시 revert) */
  gsapCtx: gsap.Context;
}

export interface Scene {
  readonly id: string;
  enter(container: HTMLElement, ctx: SceneContext): void | Promise<void>;
  exit?(): void;
}

/** 씬 팩토리: 동적 import로 lazy 로딩 가능 */
export type SceneFactory = () => Scene | Promise<Scene>;

export class SceneEngine {
  private readonly root: HTMLElement;
  private readonly registry = new Map<string, SceneFactory>();
  private current: Scene | null = null;
  private currentCtx: SceneContext | null = null;
  private locked = false;
  private readonly shared: SharedContext;

  constructor(root: HTMLElement, shared: SharedContext) {
    this.root = root;
    this.shared = shared;
  }

  register(id: string, factory: SceneFactory): this {
    this.registry.set(id, factory);
    return this;
  }

  /** 분기 → 씬 id 매핑 후 전이 (S7/S9 등에서 사용) */
  goByVCap(map: Record<Branch, string>): Promise<void> {
    return this.next(map[state.endingBranch()]);
  }

  get currentId(): string | null {
    return this.current?.id ?? null;
  }

  get isLocked(): boolean {
    return this.locked;
  }

  /** 씬 전이. 전이 중 재호출은 무시(입력 잠금). */
  async next(id: string): Promise<void> {
    if (this.locked) return;
    const factory = this.registry.get(id);
    if (!factory) {
      console.warn(`[SceneEngine] unknown scene id: ${id}`);
      return;
    }
    this.locked = true;
    try {
      // 이전 씬 정리
      if (this.current) {
        try {
          this.current.exit?.();
        } catch (e) {
          console.warn('[SceneEngine] exit error', e);
        }
        this.currentCtx?.gsapCtx.revert();
      }
      this.root.replaceChildren();

      const scene = await factory();
      const container = document.createElement('section');
      container.className = 'scene';
      container.dataset.scene = scene.id;
      this.root.appendChild(container);

      const ctx: SceneContext = {
        ...this.shared,
        engine: this,
        gsapCtx: gsap.context(() => {}, container),
      };
      this.current = scene;
      this.currentCtx = ctx;

      await scene.enter(container, ctx);
    } finally {
      this.locked = false;
    }
  }

  /** 현재 씬을 동일 데이터로 다시 그린다(언어 전환 시 진행 유지용). */
  async rerenderCurrent(): Promise<void> {
    const id = this.current?.id;
    if (!id) return;
    // locked 우회: 직접 재진입
    const wasLocked = this.locked;
    this.locked = false;
    await this.next(id);
    this.locked = wasLocked && false;
  }

  /** 엔진 정지·정리 (리플레이 직전) */
  teardown(): void {
    try {
      this.current?.exit?.();
    } catch {
      /* noop */
    }
    this.currentCtx?.gsapCtx.revert();
    this.root.replaceChildren();
    this.current = null;
    this.currentCtx = null;
    this.locked = false;
  }
}
