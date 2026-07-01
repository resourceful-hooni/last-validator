/**
 * volumeBrain.ts — S9 쇼피스: 레이마칭 볼류메트릭 CT 뇌(high 티어). (계획 §2C, §6-C4)
 * 박스 안에서 절차적 3D 밀도장(FBM)을 레이마칭 → 흡수/발광. 진짜 CT 볼륨 렌더.
 * 스캔 슬라이스 sweep, 병변 발광(분기색). 전부 셰이더(자작·무에셋).
 * BrainHero 인터페이스 호환(메시 뇌와 교체 가능).
 */
import * as THREE from 'three';
import type { Branch } from '../data/script';
import type { BrainHero } from './brainHero';

const BRANCH_COLOR: Record<Branch, number> = {
  tragedy: 0xe24a3d,
  nearmiss: 0xe0a23a,
  averted: 0x34c77b,
};

const vert = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
precision highp float;
varying vec3 vLocal;
uniform vec3 uCamLocal;
uniform vec3 uAccent;
uniform float uScanY;
uniform float uLesion;
uniform float uTime;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z);
}
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.02; a*=0.5; } return s; }

const vec3 lesionPos = vec3(0.46, 0.3, 0.52);

float density(vec3 p){
  float r = length(p / vec3(0.92, 1.0, 0.82));
  float shell = smoothstep(1.02, 0.7, r);
  float folds = fbm(p * 3.3 + 5.0);
  float fissure = 1.0 - exp(-pow(p.x * 7.0, 2.0)) * step(0.0, p.y) * 0.85;
  return clamp(shell * (0.32 + 0.68 * folds) * fissure, 0.0, 1.0);
}

vec2 boxHit(vec3 ro, vec3 rd){
  vec3 t0 = (vec3(-1.0)-ro)/rd, t1 = (vec3(1.0)-ro)/rd;
  vec3 tmin = min(t0,t1), tmax = max(t0,t1);
  return vec2(max(max(tmin.x,tmin.y),tmin.z), min(min(tmax.x,tmax.y),tmax.z));
}

void main(){
  vec3 ro = uCamLocal;
  vec3 rd = normalize(vLocal - uCamLocal);
  vec2 h = boxHit(ro, rd);
  float tn = max(h.x, 0.0), tf = h.y;
  if (tf <= tn) discard;

  const int STEPS = 60;
  float dt = (tf - tn) / float(STEPS);
  // 디더링(밴딩 방지)
  float jitter = hash(vec3(gl_FragCoord.xy, uTime)) * dt;
  vec3 col = vec3(0.0);
  float alpha = 0.0;

  for (int i = 0; i < STEPS; i++){
    float t = tn + jitter + dt * float(i);
    if (t > tf) break;
    vec3 p = ro + rd * t;
    float d = density(p);
    // 주름 대비 강화(구조가 보이게)
    d = d * d * 1.35;
    if (d > 0.012){
      vec3 hi = mix(vec3(0.30,0.35,0.41), uAccent * 0.55 + vec3(0.16), 0.32); // 하이라이트에 분기색 스밈
      vec3 tissue = mix(vec3(0.05,0.075,0.1), hi, d);
      float scan = smoothstep(0.045, 0.0, abs(p.y - uScanY));
      tissue += scan * (uAccent * 0.6 + 0.12);
      float ld = length(p - lesionPos);
      float les = smoothstep(0.46, 0.0, ld) * uLesion;
      vec3 em = uAccent * les * 6.0;
      float a = d * 0.07;
      col += (1.0 - alpha) * a * (tissue + em);
      alpha += (1.0 - alpha) * a;
      if (alpha > 0.97) break;
    }
  }
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

export function createVolumeBrain(branch: Branch): BrainHero {
  const group = new THREE.Group();
  const accent = new THREE.Color(BRANCH_COLOR[branch]);
  const disposables: Array<{ dispose(): void }> = [];

  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uCamLocal: { value: new THREE.Vector3() },
      uAccent: { value: new THREE.Color(accent) },
      uScanY: { value: 1.0 },
      uLesion: { value: 0.0 },
      uTime: { value: 0 },
    },
  });
  disposables.push(geo, mat);
  const box = new THREE.Mesh(geo, mat);
  box.scale.setScalar(3.2);
  const tmp = new THREE.Vector3();
  box.onBeforeRender = (_r, _s, cam) => {
    // 카메라를 박스 로컬 좌표로 → 레이마칭 원점
    tmp.copy(cam.position);
    box.worldToLocal(tmp);
    (mat.uniforms.uCamLocal!.value as THREE.Vector3).copy(tmp);
  };
  group.add(box);

  // 외부 CT 갠트리 링(발광)
  const ringGeo = new THREE.TorusGeometry(3.4, 0.02, 8, 96);
  const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  disposables.push(ringGeo, ringMat);
  group.add(ring);

  // AI 오버레이 마커(엉뚱한 곳) + 사람 표식(십자)
  const aiGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 40);
  const aiMat = new THREE.MeshBasicMaterial({ color: 0x9aa7b2, transparent: true, opacity: 0 });
  const ai = new THREE.Mesh(aiGeo, aiMat);
  ai.position.set(-1.5, -0.7, 1.6);
  disposables.push(aiGeo, aiMat);
  group.add(ai);

  const humanMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 });
  const humanGeo = new THREE.BufferGeometry();
  const s = 0.5;
  humanGeo.setAttribute('position', new THREE.Float32BufferAttribute([-s, 0, 0, s, 0, 0, 0, -s, 0, 0, s, 0], 3));
  const human = new THREE.LineSegments(humanGeo, humanMat);
  human.position.set(1.47, 0.96, 1.66);
  disposables.push(humanGeo, humanMat);
  group.add(human);

  let progress = 0;
  const applyProgress = (p: number): void => {
    progress = p;
    mat.uniforms.uScanY!.value = 1.0 - p * 2.0;
    mat.uniforms.uLesion!.value = branch === 'tragedy' ? 0.6 + 0.4 * p : Math.min(1, p * 1.4);
    if (branch === 'tragedy') {
      aiMat.opacity = Math.max(0, 0.7 * (1 - Math.max(0, (p - 0.5) * 2)));
      humanMat.opacity = 0;
    } else if (branch === 'nearmiss') {
      aiMat.opacity = 0.7 * (1 - p) * (0.5 + 0.5 * Math.sin(p * 20));
      const hh = Math.max(0, (p - 0.7) / 0.3);
      humanMat.opacity = hh;
      human.scale.setScalar(0.7 + 0.3 * hh);
    } else {
      aiMat.opacity = 0.4 * (1 - p);
      const hh = Math.max(0, (p - 0.45) / 0.55);
      humanMat.opacity = hh;
      human.scale.setScalar(0.7 + 0.3 * hh);
    }
  };
  applyProgress(0);

  return {
    object: group,
    update(dt: number, t: number): void {
      group.rotation.y += dt * 0.18;
      mat.uniforms.uTime!.value = t;
      if (progress < 1) applyProgress(Math.min(1, progress + dt / 4));
    },
    setProgress(p: number): void {
      applyProgress(p);
    },
    dispose(): void {
      for (const d of disposables) d.dispose();
    },
  };
}
