/**
 * stage.ts — 전역 WebGL 배경 스테이지(Three.js). "입체 공간이 흐르는" 분위기 레이어.
 * DOM(텍스트·UI)은 그대로 위에 얹혀 가독성·i18n·접근성 유지. 3D는 배경 아틀라스.
 *
 * 안전장치:
 *  - WebGL 미지원 → null 반환(앱은 2D로 정상 동작).
 *  - prefers-reduced-motion → 단일 정적 프레임(애니메이션 루프 없음).
 *  - 탭 숨김 → 루프 정지(배터리/성능). DPR 캡. 리사이즈 대응.
 * 전부 절차적 지오메트리(자작) — 외부 3D 에셋 0, 저작권 안전.
 */
import * as THREE from 'three';
import { prefersReducedMotion } from '../engine/motion';
import type { Branch } from '../data/script';
import { createBrainHero, type BrainHero } from './brainHero';

export type Mood = 'cool' | 'neutral' | 'green' | 'amber' | 'red';
export type SceneKind = 'ambient' | 'title' | 'dash' | 'reveal' | 'timejump' | 'er' | 'ending';

const MOOD_COLORS: Record<Mood, number> = {
  cool: 0x2a3a48,
  neutral: 0x223142,
  green: 0x1f6b47,
  amber: 0x6b5320,
  red: 0x6e2b26,
};

export interface Stage {
  setMood(mood: Mood): void;
  setScene(kind: SceneKind): void;
  showBrain(branch: Branch): void;
  clearHero(): void;
  warp(on: boolean): void;
  resize(): void;
  dispose(): void;
}

class WebGLStage implements Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;

  private points!: THREE.Points;
  private pointsFar!: THREE.Points;
  private readonly baseColor = new THREE.Color(MOOD_COLORS.cool);
  private readonly targetColor = new THREE.Color(MOOD_COLORS.cool);
  private readonly fog: THREE.FogExp2;

  private hero: BrainHero | null = null;
  private heroGroup = new THREE.Group();

  private raf = 0;
  private running = false;
  private clock = new THREE.Clock();
  private warpAmt = 0;
  private targetWarp = 0;
  private pointer = new THREE.Vector2(0, 0);
  private readonly reduced = prefersReducedMotion();

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.fog = new THREE.FogExp2(0x0b0d10, 0.055);
    this.scene.fog = this.fog;
    this.scene.add(this.heroGroup);

    this.buildParticles();

    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    const key = new THREE.PointLight(0xffffff, 40, 60);
    key.position.set(6, 8, 12);
    this.scene.add(amb, key);

    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    if (this.reduced) {
      this.renderOnce();
    } else {
      this.start();
    }
  }

  private buildParticles(): void {
    const mk = (count: number, spread: number, size: number, opacity: number): THREE.Points => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.7 - 4;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: this.baseColor.clone(),
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    };
    this.points = mk(1600, 34, 0.09, 0.85);
    this.pointsFar = mk(1200, 60, 0.16, 0.4);
    this.scene.add(this.points, this.pointsFar);
  }

  setMood(mood: Mood): void {
    this.targetColor.setHex(MOOD_COLORS[mood]);
    if (this.reduced) {
      this.baseColor.copy(this.targetColor);
      this.applyPointColor();
      this.renderOnce();
    }
  }

  setScene(kind: SceneKind): void {
    // 카메라 거리/포그로 장면 성격 표현
    const conf: Record<SceneKind, { z: number; fog: number }> = {
      ambient: { z: 14, fog: 0.055 },
      title: { z: 16, fog: 0.045 },
      dash: { z: 15, fog: 0.06 },
      reveal: { z: 11, fog: 0.07 },
      timejump: { z: 9, fog: 0.04 },
      er: { z: 13, fog: 0.05 },
      ending: { z: 15, fog: 0.065 },
    };
    const c = conf[kind];
    this.camTargetZ = c.z;
    this.fogTarget = c.fog;
    if (this.reduced) {
      this.camera.position.z = c.z;
      this.fog.density = c.fog;
      this.renderOnce();
    }
  }

  private camTargetZ = 14;
  private fogTarget = 0.055;

  showBrain(branch: Branch): void {
    this.clearHero();
    this.hero = createBrainHero(branch);
    this.heroGroup.add(this.hero.object);
    if (this.reduced) {
      this.hero.setProgress(1);
      this.renderOnce();
    }
  }

  clearHero(): void {
    if (this.hero) {
      this.heroGroup.remove(this.hero.object);
      this.hero.dispose();
      this.hero = null;
    }
  }

  warp(on: boolean): void {
    this.targetWarp = on ? 1 : 0;
    if (this.reduced) {
      this.warpAmt = this.targetWarp;
      this.renderOnce();
    }
  }

  private applyPointColor(): void {
    (this.points.material as THREE.PointsMaterial).color.copy(this.baseColor);
    (this.pointsFar.material as THREE.PointsMaterial).color.copy(this.baseColor).multiplyScalar(0.8);
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const tick = (): void => {
      if (!this.running) return;
      this.update(this.clock.getDelta(), this.clock.elapsedTime);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private update(dt: number, t: number): void {
    const d = Math.min(dt, 0.05);
    // 색 전이
    this.baseColor.lerp(this.targetColor, 1 - Math.pow(0.001, d));
    this.applyPointColor();
    // 포그/카메라 전이
    this.fog.density += (this.fogTarget - this.fog.density) * (1 - Math.pow(0.01, d));
    this.warpAmt += (this.targetWarp - this.warpAmt) * (1 - Math.pow(0.02, d));

    // 카메라 드리프트 + 포인터 시차
    const px = this.pointer.x * 1.2;
    const py = this.pointer.y * 0.8;
    this.camera.position.x += (Math.sin(t * 0.15) * 0.8 + px - this.camera.position.x) * 0.02;
    this.camera.position.y += (Math.cos(t * 0.12) * 0.5 + py - this.camera.position.y) * 0.02;
    this.camera.position.z += (this.camTargetZ - this.camera.position.z) * 0.03;
    this.camera.lookAt(0, 0, -2);

    // 파티클 드리프트 + 워프(터널 가속 느낌)
    const warpZ = this.warpAmt * 26;
    this.points.rotation.z += d * 0.02;
    this.pointsFar.rotation.z -= d * 0.012;
    this.points.position.z = warpZ;
    this.pointsFar.position.z = warpZ * 1.6;
    (this.points.material as THREE.PointsMaterial).size = 0.09 + this.warpAmt * 0.05;

    if (this.hero) this.hero.update(d, t);
  }

  private renderOnce(): void {
    this.applyPointColor();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = (): void => this.resize();
  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.reduced || !this.running) this.renderOnce();
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    this.pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  };

  private onVisibility = (): void => {
    if (document.hidden) this.stop();
    else if (!this.reduced) this.start();
  };

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.clearHero();
    this.scene.traverse((o) => {
      const any = o as THREE.Mesh;
      if (any.geometry) any.geometry.dispose();
      const m = (any as THREE.Mesh).material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else if (m) (m as THREE.Material).dispose();
    });
    this.renderer.dispose();
    this.canvas.remove();
  }
}

/** WebGL 지원 시 스테이지 생성, 아니면 null(2D 폴백). */
export async function initStage(): Promise<Stage | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'stage-canvas';
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    document.body.prepend(canvas);
    return new WebGLStage(renderer);
  } catch (e) {
    console.warn('[stage] WebGL unavailable, 2D fallback', e);
    return null;
  }
}
