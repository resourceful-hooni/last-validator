/**
 * brainHero.ts — S9의 3D 뇌 CT 히어로(절차적 포인트클라우드, 자작). 상징적·비자극.
 * 볼류메트릭 머리 단면 + 스캔 평면 sweep + 병변 글로우(분기색) + AI 오버레이 마커.
 * 분기 동작: tragedy=AI가 병변을 못 짚고 사라짐 / nearmiss=깜빡이다 사람표식 / averted=분명히 짚음.
 */
import * as THREE from 'three';
import type { Branch } from '../data/script';

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

export function createBrainHero(branch: Branch): BrainHero {
  const group = new THREE.Group();
  const accent = new THREE.Color(BRANCH_COLOR[branch]);
  const disposables: Array<{ dispose(): void }> = [];

  // ── 볼류메트릭 머리(타원체 껍질 + 내부 조직) ──
  const rx = 3.0,
    ry = 3.6,
    rz = 2.7;
  const shellPos: number[] = [];
  const rings = 26;
  for (let i = 1; i < rings; i++) {
    const v = i / rings;
    const y = (v - 0.5) * 2 * ry;
    const r = Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
    const seg = 60;
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const jitter = 0.96 + Math.random() * 0.08;
      shellPos.push(Math.cos(a) * rx * r * jitter, y, Math.sin(a) * rz * r * jitter);
    }
  }
  const shellGeo = new THREE.BufferGeometry();
  shellGeo.setAttribute('position', new THREE.Float32BufferAttribute(shellPos, 3));
  const shellMat = new THREE.PointsMaterial({
    color: 0x8fa6b5,
    size: 0.055,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const shell = new THREE.Points(shellGeo, shellMat);
  disposables.push(shellGeo, shellMat);
  group.add(shell);

  // 내부 조직(흐릿한 채움)
  const tissuePos: number[] = [];
  for (let i = 0; i < 900; i++) {
    const u = Math.random(),
      c = Math.cbrt(u);
    const th = Math.acos(2 * Math.random() - 1),
      ph = Math.random() * Math.PI * 2;
    tissuePos.push(
      Math.sin(th) * Math.cos(ph) * rx * c * 0.9,
      Math.cos(th) * ry * c * 0.9,
      Math.sin(th) * Math.sin(ph) * rz * c * 0.9,
    );
  }
  const tissueGeo = new THREE.BufferGeometry();
  tissueGeo.setAttribute('position', new THREE.Float32BufferAttribute(tissuePos, 3));
  const tissueMat = new THREE.PointsMaterial({
    color: 0x3f5464,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const tissue = new THREE.Points(tissueGeo, tissueMat);
  disposables.push(tissueGeo, tissueMat);
  group.add(tissue);

  // ── 병변(글로우, 분기색) ──
  const lesionPos = new THREE.Vector3(1.5, 1.0, 0.7);
  const lesionGeo = new THREE.SphereGeometry(0.34, 24, 24);
  const lesionMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 });
  const lesion = new THREE.Mesh(lesionGeo, lesionMat);
  lesion.position.copy(lesionPos);
  const glowGeo = new THREE.SphereGeometry(0.7, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  lesion.add(glow);
  disposables.push(lesionGeo, lesionMat, glowGeo, glowMat);
  group.add(lesion);

  // ── 스캔 평면(가로 링, 위→아래 sweep) ──
  const scanGeo = new THREE.TorusGeometry(rx * 1.02, 0.02, 8, 80);
  const scanMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
  const scan = new THREE.Mesh(scanGeo, scanMat);
  scan.rotation.x = Math.PI / 2;
  disposables.push(scanGeo, scanMat);
  group.add(scan);

  // ── AI 오버레이 마커(엉뚱한 곳을 짚는 wireframe 링) ──
  const aiWrong = new THREE.Vector3(-1.4, -0.6, 1.2);
  const aiGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 40);
  const aiMat = new THREE.MeshBasicMaterial({ color: 0x9aa7b2, transparent: true, opacity: 0, wireframe: false });
  const ai = new THREE.Mesh(aiGeo, aiMat);
  ai.position.copy(aiWrong);
  disposables.push(aiGeo, aiMat);
  group.add(ai);

  // ── 사람 표식(십자, 분기 성공 시 병변을 짚음) ──
  const humanMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 });
  const humanGeo = new THREE.BufferGeometry();
  const s = 0.55;
  humanGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-s, 0, 0, s, 0, 0, 0, -s, 0, 0, s, 0], 3),
  );
  const human = new THREE.LineSegments(humanGeo, humanMat);
  human.position.copy(lesionPos);
  disposables.push(humanGeo, humanMat);
  group.add(human);

  group.scale.setScalar(0.9);

  let progress = 0; // 0..1 연출 진행

  const applyProgress = (p: number): void => {
    progress = p;
    // 스캔: 위→아래
    scan.position.y = ry - p * (ry * 2);
    // 병변 글로우 맥동은 update에서. 여기선 분기별 최종 상태 세팅.
    if (branch === 'tragedy') {
      // AI가 엉뚱한 곳을 잠깐 짚다 사라짐, 사람표식 없음
      aiMat.opacity = Math.max(0, 0.7 * (1 - Math.max(0, (p - 0.5) * 2)));
      humanMat.opacity = 0;
    } else if (branch === 'nearmiss') {
      aiMat.opacity = 0.7 * (1 - p) * (0.5 + 0.5 * Math.sin(p * 20));
      humanMat.opacity = Math.max(0, (p - 0.7) / 0.3);
      human.scale.setScalar(0.7 + 0.3 * Math.min(1, Math.max(0, (p - 0.7) / 0.3)));
    } else {
      aiMat.opacity = 0.4 * (1 - p);
      humanMat.opacity = Math.max(0, (p - 0.45) / 0.55);
      human.scale.setScalar(0.7 + 0.3 * Math.min(1, Math.max(0, (p - 0.45) / 0.55)));
    }
  };
  applyProgress(0);

  return {
    object: group,
    update(dt: number, t: number): void {
      group.rotation.y += dt * 0.25;
      // 진행(약 4초에 걸쳐 1까지)
      if (progress < 1) applyProgress(Math.min(1, progress + dt / 4));
      // 병변 글로우 맥동
      const pulse = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2.2));
      glowMat.opacity = pulse;
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
