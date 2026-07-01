/**
 * grade.ts — 시네마틱 색보정 이펙트(임상 SF 룩). (계획 §2A, §5)
 * ASC-CDL(slope/offset/power) + 색온도 + 채도. 씬별 룩 프리셋을 부드럽게 전환.
 * 외부 LUT 파일 없이 셰이더로 처리(저작권/무에셋 안전).
 */
import { Effect } from 'postprocessing';
import { Uniform, Vector3 } from 'three';
import type * as THREE from 'three';

const frag = /* glsl */ `
uniform vec3 slope;
uniform vec3 offset;
uniform vec3 power;
uniform float sat;
uniform float temp;
uniform float lift;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  // 색온도(따뜻/차갑게)
  c.r += temp;
  c.b -= temp;
  // 리프트(그림자 톤)
  c += lift * (1.0 - c);
  // ASC CDL: (in * slope + offset)^power
  c = pow(max(vec3(0.0), c * slope + offset), power);
  // 채도
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, sat);
  outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
}
`;

export interface Look {
  slope: [number, number, number];
  offset: [number, number, number];
  power: [number, number, number];
  sat: number;
  temp: number;
  lift: number;
}

/** 임상 SF 룩 프리셋 (블레이드러너/빌뇌브식 차갑고 묵직) */
export const LOOKS: Record<string, Look> = {
  clinical: { slope: [0.94, 1.0, 1.09], offset: [-0.012, 0.0, 0.02], power: [1.06, 1.0, 0.97], sat: 0.9, temp: -0.025, lift: 0.015 },
  green: { slope: [0.88, 1.12, 0.95], offset: [0.0, 0.02, -0.005], power: [1.03, 0.94, 1.05], sat: 1.06, temp: -0.015, lift: 0.02 },
  amber: { slope: [1.09, 1.0, 0.88], offset: [0.02, 0.0, -0.02], power: [0.98, 1.0, 1.05], sat: 0.96, temp: 0.03, lift: 0.02 },
  red: { slope: [1.2, 0.83, 0.85], offset: [0.03, -0.014, -0.01], power: [0.95, 1.03, 1.03], sat: 0.98, temp: 0.022, lift: 0.016 },
  reveal: { slope: [1.0, 1.0, 1.02], offset: [0.0, 0.0, 0.0], power: [1.08, 1.05, 1.02], sat: 0.82, temp: -0.01, lift: 0.0 },
  cool: { slope: [0.92, 0.99, 1.12], offset: [-0.015, 0.0, 0.03], power: [1.08, 1.0, 0.95], sat: 0.88, temp: -0.035, lift: 0.02 },
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class GradeEffect extends Effect {
  private target: Look = LOOKS.clinical!;
  private cur: Look = structuredClone(LOOKS.clinical!);

  constructor() {
    super('GradeEffect', frag, {
      uniforms: new Map<string, Uniform>([
        ['slope', new Uniform(new Vector3(1, 1, 1))],
        ['offset', new Uniform(new Vector3(0, 0, 0))],
        ['power', new Uniform(new Vector3(1, 1, 1))],
        ['sat', new Uniform(1)],
        ['temp', new Uniform(0)],
        ['lift', new Uniform(0)],
      ]),
    });
    this.apply(this.cur);
  }

  setLook(name: keyof typeof LOOKS | Look, instant = false): void {
    const look = typeof name === 'string' ? LOOKS[name] ?? LOOKS.clinical! : name;
    this.target = look;
    if (instant) {
      this.cur = structuredClone(look);
      this.apply(this.cur);
    }
  }

  /** postprocessing이 매 프레임 호출 — 룩을 목표로 보간(부드러운 그레이드 전환). */
  override update(_renderer: THREE.WebGLRenderer, _inputBuffer: THREE.WebGLRenderTarget, deltaTime = 0): void {
    const k = 1 - Math.pow(0.02, Math.min(deltaTime, 0.05));
    for (let i = 0; i < 3; i++) {
      this.cur.slope[i] = lerp(this.cur.slope[i]!, this.target.slope[i]!, k);
      this.cur.offset[i] = lerp(this.cur.offset[i]!, this.target.offset[i]!, k);
      this.cur.power[i] = lerp(this.cur.power[i]!, this.target.power[i]!, k);
    }
    this.cur.sat = lerp(this.cur.sat, this.target.sat, k);
    this.cur.temp = lerp(this.cur.temp, this.target.temp, k);
    this.cur.lift = lerp(this.cur.lift, this.target.lift, k);
    this.apply(this.cur);
  }

  private apply(l: Look): void {
    (this.uniforms.get('slope')!.value as Vector3).set(...l.slope);
    (this.uniforms.get('offset')!.value as Vector3).set(...l.offset);
    (this.uniforms.get('power')!.value as Vector3).set(...l.power);
    this.uniforms.get('sat')!.value = l.sat;
    this.uniforms.get('temp')!.value = l.temp;
    this.uniforms.get('lift')!.value = l.lift;
  }
}
