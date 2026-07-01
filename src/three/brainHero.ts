/**
 * brainHero.ts — S9 뇌 CT 히어로. 라이팅을 받는 반투명(SSS 유사) 메시 뇌(절차적, 자작).
 * 노이즈 변위 아이코스피어 + 중앙 열구, MeshPhysicalMaterial transmission(반투명)로 CT 질감.
 * 병변 발광(분기색)→블룸, 스캔 링 sweep, AI 오버레이/사람 표식(분기별). 상징적·비자극.
 */
import * as THREE from 'three';
import type { Branch } from '../data/script';
import type { Tier } from './quality';

export interface BrainHero {
  object: THREE.Object3D;
  update(dt: number, t: number): void;
  setProgress(p: number): void;
  dispose(): void;
}

const BRANCH_COLOR: Record<Branch, number> = {
  tragedy: 0xe24a3d,
  nearmiss: 0xe0a23a,
  averted: 0x34c77b,
};

// ── 절차적 값 노이즈(변위용) ──
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
function vhash(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}
function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a: number, b: number, d: number): number => vhash(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x: number, y: number, z: number): number {
  let f = 0, a = 0.5, fr = 1;
  for (let i = 0; i < 4; i++) {
    f += a * vnoise(x * fr, y * fr, z * fr);
    fr *= 2;
    a *= 0.5;
  }
  return f;
}

function makeBrainGeometry(detail: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(3, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    // 뇌 주름(sulci): 저·고주파 FBM
    const coarse = fbm(n.x * 1.6 + 3, n.y * 1.6, n.z * 1.6) - 0.5;
    const fine = fbm(n.x * 4.2, n.y * 4.2, n.z * 4.2 + 7) - 0.5;
    let disp = coarse * 0.5 + fine * 0.28;
    // 중앙 열구(세로 홈)
    const groove = Math.exp(-(n.x * n.x) / 0.03) * Math.max(0, n.y) * 0.55;
    disp -= groove;
    // 살짝 납작한 두상
    v.multiplyScalar(1 + disp);
    v.y *= 1.06;
    v.z *= 0.92;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createBrainHero(branch: Branch, tier: Tier = 'high'): BrainHero {
  const group = new THREE.Group();
  const accent = new THREE.Color(BRANCH_COLOR[branch]);
  const disposables: Array<{ dispose(): void }> = [];

  // ── 반투명 뇌 메시 ──
  const geo = makeBrainGeometry(tier === 'high' ? 6 : tier === 'mid' ? 5 : 4);
  disposables.push(geo);
  const low = tier === 'low';
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x33434e,
    roughness: 0.62,
    metalness: 0.0,
    transmission: low ? 0 : 0.74,
    thickness: 3.4,
    ior: 1.37,
    attenuationColor: accent.clone().lerp(new THREE.Color(0x1a2630), 0.35),
    attenuationDistance: 1.8,
    clearcoat: 0.16,
    clearcoatRoughness: 0.6,
    emissive: accent.clone(),
    emissiveIntensity: 0.06,
    envMapIntensity: 0.75,
    transparent: low,
    opacity: low ? 0.8 : 1,
  });
  disposables.push(mat);
  const brain = new THREE.Mesh(geo, mat);
  brain.castShadow = true;
  group.add(brain);

  // ── 병변(발광) ──
  const lesionPos = new THREE.Vector3(1.5, 1.0, 1.6);
  const lesionGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const lesionMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 3.0, roughness: 0.4 });
  const lesion = new THREE.Mesh(lesionGeo, lesionMat);
  lesion.position.copy(lesionPos);
  const glowGeo = new THREE.SphereGeometry(0.62, 20, 20);
  const glowMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  lesion.add(glow);
  disposables.push(lesionGeo, lesionMat, glowGeo, glowMat);
  group.add(lesion);

  // ── 스캔 링(위→아래 sweep, 발광) ──
  const scanGeo = new THREE.TorusGeometry(3.15, 0.018, 8, 96);
  const scanMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
  const scan = new THREE.Mesh(scanGeo, scanMat);
  scan.rotation.x = Math.PI / 2;
  disposables.push(scanGeo, scanMat);
  group.add(scan);

  // ── AI 오버레이 마커(엉뚱한 곳) ──
  const aiGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 40);
  const aiMat = new THREE.MeshBasicMaterial({ color: 0x9aa7b2, transparent: true, opacity: 0 });
  const ai = new THREE.Mesh(aiGeo, aiMat);
  ai.position.set(-1.5, -0.7, 1.5);
  disposables.push(aiGeo, aiMat);
  group.add(ai);

  // ── 사람 표식(십자) ──
  const humanMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 });
  const humanGeo = new THREE.BufferGeometry();
  const s = 0.5;
  humanGeo.setAttribute('position', new THREE.Float32BufferAttribute([-s, 0, 0, s, 0, 0, 0, -s, 0, 0, s, 0], 3));
  const human = new THREE.LineSegments(humanGeo, humanMat);
  human.position.copy(lesionPos);
  disposables.push(humanGeo, humanMat);
  group.add(human);

  group.scale.setScalar(0.92);

  let progress = 0;
  const applyProgress = (p: number): void => {
    progress = p;
    scan.position.y = 3.2 - p * 6.4;
    if (branch === 'tragedy') {
      aiMat.opacity = Math.max(0, 0.7 * (1 - Math.max(0, (p - 0.5) * 2)));
      humanMat.opacity = 0;
    } else if (branch === 'nearmiss') {
      aiMat.opacity = 0.7 * (1 - p) * (0.5 + 0.5 * Math.sin(p * 20));
      const h = Math.max(0, (p - 0.7) / 0.3);
      humanMat.opacity = h;
      human.scale.setScalar(0.7 + 0.3 * h);
    } else {
      aiMat.opacity = 0.4 * (1 - p);
      const h = Math.max(0, (p - 0.45) / 0.55);
      humanMat.opacity = h;
      human.scale.setScalar(0.7 + 0.3 * h);
    }
  };
  applyProgress(0);

  return {
    object: group,
    update(dt: number, t: number): void {
      group.rotation.y += dt * 0.2;
      if (progress < 1) applyProgress(Math.min(1, progress + dt / 4));
      glowMat.opacity = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2.2));
      lesionMat.emissiveIntensity = 2.4 + 0.9 * Math.sin(t * 2.2);
      lesion.scale.setScalar(1 + 0.05 * Math.sin(t * 2.2));
    },
    setProgress(p: number): void {
      applyProgress(p);
    },
    dispose(): void {
      for (const d of disposables) d.dispose();
    },
  };
}
