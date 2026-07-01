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
import { createVolumeBrain } from './volumeBrain';
import { createPipeline, type Pipeline } from './pipeline';
import { detectTier, TIER_DPR, FpsMonitor, type Tier } from './quality';
import { buildEnvironment, type Environment } from './environment';
import { gsap } from 'gsap';

/** mood → 시네마틱 그레이드 룩 */
const MOOD_LOOK: Record<Mood, string> = {
  cool: 'cool',
  neutral: 'clinical',
  green: 'green',
  amber: 'amber',
  red: 'red',
};

/** mood → 림라이트 색 */
const MOOD_RIM: Record<Mood, number> = {
  cool: 0x3f78b0,
  neutral: 0x3f78b0,
  green: 0x34c77b,
  amber: 0xe0a23a,
  red: 0xe24a3d,
};

/** 씬별 카메라/렌즈 프리셋 (시네마틱 프레이밍) */
interface CamPreset {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  fog: number;
  focus: number;
}
const CAM: Record<SceneKind, CamPreset> = {
  ambient: { pos: [0, 0, 14], look: [0, 0, -2], fov: 55, fog: 0.055, focus: 14 },
  title: { pos: [0, 0.6, 17], look: [0, 0.4, -2], fov: 50, fog: 0.045, focus: 17 },
  dash: { pos: [0, 0, 15], look: [0, 0, -2], fov: 52, fog: 0.06, focus: 15 },
  reveal: { pos: [0, 0, 11], look: [0, 0, -1], fov: 47, fog: 0.07, focus: 11 },
  timejump: { pos: [0, 0, 9], look: [0, 0, -12], fov: 72, fog: 0.038, focus: 9 },
  er: { pos: [1.8, 0.4, 10.5], look: [0, 0.15, 0], fov: 44, fog: 0.05, focus: 10 },
  ending: { pos: [0, 0.2, 15], look: [0, 0.1, -2], fov: 50, fog: 0.062, focus: 15 },
};

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
  private heroBranch: Branch | null = null;
  private heroGroup = new THREE.Group();

  private raf = 0;
  private running = false;
  private clock = new THREE.Clock();
  private warpAmt = 0;
  private targetWarp = 0;
  private pointer = new THREE.Vector2(0, 0);
  private readonly reduced = prefersReducedMotion();
  private pipeline!: Pipeline;
  private tier: Tier;
  private readonly fps: FpsMonitor;
  private env!: Environment;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;

    // 시네마틱 렌더러 설정: 톤매핑은 포스트(AgX)에서 처리, 소프트 섀도
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.fog = new THREE.FogExp2(0x0b0d10, 0.055);
    this.scene.fog = this.fog;
    this.scene.add(this.heroGroup);

    this.buildParticles();

    this.tier = detectTier(this.renderer);
    this.env = buildEnvironment(this.renderer, this.scene, this.tier); // IBL + 라이팅 + 반사 바닥
    this.pipeline = createPipeline(this.renderer, this.scene, this.camera, this.tier, this.env.lightSource);
    // ?nodegrade: FPS 자동 강등 비활성(최고화질 강제 보기/튜닝용)
    const noDegrade = new URLSearchParams(location.search).has('nodegrade');
    this.fps = new FpsMonitor(() => {
      if (!noDegrade) this.degrade();
    });

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

  private sunVisible = false;
  private sunColor = 0x8fb0d0;

  setMood(mood: Mood): void {
    this.targetColor.setHex(MOOD_COLORS[mood]);
    this.pipeline.grade.setLook(MOOD_LOOK[mood], this.reduced);
    this.env.setRim(MOOD_RIM[mood]);
    // 태양(god ray 광원)은 차가운 백색 유지 → 그레이드가 씬별로 색을 입힌다.
    this.env.setSun(this.sunColor, this.sunVisible);
    if (this.reduced) {
      this.baseColor.copy(this.targetColor);
      this.applyPointColor();
      this.renderOnce();
    }
  }

  setScene(kind: SceneKind): void {
    const c = CAM[kind];
    this.camTargetPos.set(c.pos[0], c.pos[1], c.pos[2]);
    this.camLook.set(c.look[0], c.look[1], c.look[2]);
    this.camTargetFov = c.fov;
    this.fogTarget = c.fog;

    // 레터박스는 단일 화면 시네마틱 컷에만(스크롤 엔딩은 텍스트 잘림 방지 위해 제외)
    const cinemascope = kind === 'timejump' || kind === 'er';
    document.body.classList.toggle('cinemascope', cinemascope);
    this.env.showFloor(kind === 'er' || kind === 'ending');
    // god rays(빛기둥)는 응급실·시간점프에서
    this.sunVisible = kind === 'er' || kind === 'timejump';
    this.env.setSun(this.sunColor, this.sunVisible);

    // 초점: er은 랙포커스(안개→뇌로 초점 이동), 그 외 정적
    if (kind === 'er' && !this.reduced) {
      const proxy = { f: 22 };
      this.pipeline.setFocus(proxy.f);
      gsap.to(proxy, { f: c.focus, duration: 2.6, ease: 'power2.inOut', onUpdate: () => this.pipeline.setFocus(proxy.f) });
    } else {
      this.pipeline.setFocus(c.focus);
    }

    if (this.reduced) {
      this.camera.position.set(c.pos[0], c.pos[1], c.pos[2]);
      this.camera.fov = c.fov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.camLook);
      this.fog.density = c.fog;
      this.renderOnce();
    }
  }

  private camTargetPos = new THREE.Vector3(0, 0, 14);
  private camLook = new THREE.Vector3(0, 0, -2);
  private camTargetFov = 55;
  private fogTarget = 0.055;

  showBrain(branch: Branch): void {
    this.clearHero();
    this.heroBranch = branch;
    // high 티어: 레이마칭 볼류메트릭 CT / 그 외: 반투명 메시 뇌
    this.hero = this.tier === 'high' ? createVolumeBrain(branch) : createBrainHero(branch, this.tier);
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
    this.heroBranch = null;
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
      const dt = this.clock.getDelta();
      this.update(dt, this.clock.elapsedTime);
      this.pipeline.render(dt);
      this.fps.tick(performance.now());
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

    // 카메라: 프리셋으로 이동 + 포인터 시차 + 핸드헬드 미세 흔들림
    const px = this.pointer.x * 0.9;
    const py = this.pointer.y * 0.6;
    const sh = this.tier === 'low' ? 0 : this.tier === 'high' ? 0.06 : 0.035;
    const shakeX = sh * (Math.sin(t * 2.3) + 0.6 * Math.sin(t * 5.1));
    const shakeY = sh * (Math.cos(t * 2.05) + 0.6 * Math.sin(t * 4.3));
    const tx = this.camTargetPos.x + px + shakeX;
    const ty = this.camTargetPos.y + py + shakeY;
    const tz = this.camTargetPos.z - this.warpAmt * 3;
    this.camera.position.x += (tx - this.camera.position.x) * 0.045;
    this.camera.position.y += (ty - this.camera.position.y) * 0.045;
    this.camera.position.z += (tz - this.camera.position.z) * 0.03;
    if (Math.abs(this.camera.fov - this.camTargetFov) > 0.02) {
      this.camera.fov += (this.camTargetFov - this.camera.fov) * 0.05;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.camLook);

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
    this.pipeline.composer.render(0);
  }

  /** FPS 저하 시 티어 하향(포스트 재구성). high→mid→low 단방향. */
  private degrade(): void {
    if (this.tier === 'low') return;
    const wasHigh = this.tier === 'high';
    this.tier = this.tier === 'high' ? 'mid' : 'low';
    console.info('[stage] degrade →', this.tier);
    this.pipeline.dispose();
    this.pipeline = createPipeline(this.renderer, this.scene, this.camera, this.tier, this.env.lightSource);
    // high에서 내려오면 볼류메트릭 뇌 → 가벼운 메시 뇌로 교체
    if (wasHigh && this.heroBranch) this.showBrain(this.heroBranch);
    this.resize();
    this.fps.reset();
  }

  private onResize = (): void => this.resize();
  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, TIER_DPR[this.tier]);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.pipeline.setSize(w, h);
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
    this.env.dispose();
    this.pipeline.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

/** WebGL 지원 시 스테이지 생성, 아니면 null(2D 폴백). */
export async function initStage(): Promise<Stage | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'stage-canvas';
    // antialias는 SMAA(포스트)가 담당 → false. 최고화질 우선이므로 high-performance GPU 선호.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    document.body.prepend(canvas);
    return new WebGLStage(renderer);
  } catch (e) {
    console.warn('[stage] WebGL unavailable, 2D fallback', e);
    return null;
  }
}
