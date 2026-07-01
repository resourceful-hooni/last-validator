/**
 * environment.ts — 절차적 IBL 환경맵 + 시네마틱 라이팅 + 반사 바닥. (계획 §2B, §2E)
 * 외부 HDRI 없이 RoomEnvironment로 PBR 반사를 확보(무에셋). 깊이·입체감의 핵심.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import type { Tier } from './quality';

export interface Environment {
  setRim(hex: number): void;
  showFloor(on: boolean): void;
  dispose(): void;
}

export function buildEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene, tier: Tier): Environment {
  // ── 절차적 환경맵(IBL) ──
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  pmrem.dispose();

  // ── 라이팅 ──
  const hemi = new THREE.HemisphereLight(0x9fb4c6, 0x05070a, 0.22);

  RectAreaLightUniformsLib.init();
  const key = new THREE.RectAreaLight(0xcfe4f5, 2.2, 14, 10); // 차가운 소프트 키
  key.position.set(6, 7, 10);
  key.lookAt(0, 0, 0);

  const rim = new THREE.DirectionalLight(0x66ccff, 3.6); // 재색 가능한 림/백라이트(강한 엣지)
  rim.position.set(-7, 3, -6);

  const fill = new THREE.DirectionalLight(0x223040, 0.5);
  fill.position.set(-2, -4, 6);

  scene.add(hemi, key, rim, fill);

  // ── 반사 바닥(er/ending에서 표시) ──
  const floorGeo = new THREE.PlaneGeometry(160, 160);
  const res = tier === 'high' ? 1024 : tier === 'mid' ? 512 : 256;
  const floor = new Reflector(floorGeo, {
    color: 0x0a0e12,
    textureWidth: res,
    textureHeight: res,
    clipBias: 0.003,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6.2;
  floor.visible = false;
  scene.add(floor);

  // 바닥 위 얇은 광택 오버레이(완전 거울 완화 → 젖은 바닥 느낌)
  const gloss = new THREE.Mesh(
    floorGeo.clone(),
    new THREE.MeshStandardMaterial({
      color: 0x0a0e12,
      roughness: 0.55,
      metalness: 0.6,
      transparent: true,
      opacity: 0.45,
    }),
  );
  gloss.rotation.x = -Math.PI / 2;
  gloss.position.y = -6.19;
  gloss.visible = false;
  scene.add(gloss);

  return {
    setRim(hex: number): void {
      rim.color.setHex(hex);
    },
    showFloor(on: boolean): void {
      floor.visible = on;
      gloss.visible = on;
    },
    dispose(): void {
      envRT.dispose();
      floorGeo.dispose();
      (floor.material as THREE.Material).dispose();
      floor.dispose?.();
      (gloss.material as THREE.Material).dispose();
    },
  };
}
