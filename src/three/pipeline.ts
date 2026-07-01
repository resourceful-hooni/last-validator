/**
 * pipeline.ts — 시네마틱 포스트프로세싱 컴포저. (계획 §2A, §4)
 * 순서: Render → Bloom(HDR) → ToneMap(AgX) → Grade → ChromaticAberration → Vignette → Grain → SMAA.
 * 티어별 이펙트 토글. 전부 셰이더(무에셋).
 */
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  DepthOfFieldEffect,
  GodRaysEffect,
  BlendFunction,
  KernelSize,
} from 'postprocessing';
import { HalfFloatType, Vector2 } from 'three';
import type * as THREE from 'three';
import { GradeEffect } from './grade';
import type { Tier } from './quality';

export interface Pipeline {
  composer: EffectComposer;
  grade: GradeEffect;
  bloom: BloomEffect;
  dof: DepthOfFieldEffect | null;
  setFocus(worldDist: number): void;
  setSize(w: number, h: number): void;
  render(dt: number): void;
  dispose(): void;
}

export function createPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  tier: Tier,
  lightSource?: THREE.Mesh,
): Pipeline {
  const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));

  // god rays(빛기둥) — high 티어 + 광원 있을 때
  const godrays =
    tier === 'high' && lightSource
      ? new GodRaysEffect(camera as THREE.PerspectiveCamera, lightSource, {
          resolutionScale: 0.5,
          density: 0.86,
          decay: 0.9,
          weight: 0.32,
          exposure: 0.3,
          samples: 60,
          clampMax: 0.9,
          blur: true,
        })
      : null;

  const bloom = new BloomEffect({
    intensity: tier === 'high' ? 1.05 : 0.85,
    luminanceThreshold: 0.55,
    luminanceSmoothing: 0.32,
    mipmapBlur: true,
    kernelSize: tier === 'low' ? KernelSize.MEDIUM : KernelSize.LARGE,
    radius: 0.7,
  });

  const tonemap = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
  const grade = new GradeEffect();
  const vignette = new VignetteEffect({ offset: 0.28, darkness: 0.62 });
  const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
  noise.blendMode.opacity.value = tier === 'high' ? 0.075 : 0.055;

  const chroma =
    tier === 'low'
      ? null
      : new ChromaticAberrationEffect({
          offset: new Vector2(0.0007, 0.0007),
          radialModulation: true,
          modulationOffset: 0.35,
        });

  // 피사계심도(랙포커스) — 고/중 티어
  const dof =
    tier === 'low'
      ? null
      : new DepthOfFieldEffect(camera, {
          worldFocusDistance: 12,
          worldFocusRange: tier === 'high' ? 9 : 11,
          bokehScale: tier === 'high' ? 2.4 : 1.8,
          resolutionScale: tier === 'high' ? 0.75 : 0.5,
        });

  const list = [
    ...(godrays ? [godrays] : []),
    ...(dof ? [dof] : []),
    bloom,
    tonemap,
    grade,
    ...(chroma ? [chroma] : []),
    vignette,
    noise,
  ];
  composer.addPass(new EffectPass(camera, ...list));

  if (tier !== 'low') {
    composer.addPass(new EffectPass(camera, new SMAAEffect()));
  }

  return {
    composer,
    grade,
    bloom,
    dof,
    setFocus: (worldDist: number) => {
      if (!dof) return;
      try {
        (dof.cocMaterial as unknown as { worldFocusDistance: number }).worldFocusDistance = worldDist;
      } catch {
        /* API 차이 시 정적 초점 유지 */
      }
    },
    setSize: (w, h) => composer.setSize(w, h),
    render: (dt) => {
      // grade.update는 컴포저가 매 프레임 자동 호출한다.
      composer.render(dt);
    },
    dispose: () => composer.dispose(),
  };
}
