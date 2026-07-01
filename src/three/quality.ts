/**
 * quality.ts — 렌더 품질 티어 감지 + FPS 자동 강등. (계획 §3)
 * 데스크톱 최고화질 우선, 모바일/저사양 자동 경량. ?quality=high|mid|low 로 강제(튜닝).
 */
import type * as THREE from 'three';

export type Tier = 'high' | 'mid' | 'low';

function urlOverride(): Tier | null {
  try {
    const q = new URLSearchParams(location.search).get('quality');
    if (q === 'high' || q === 'mid' || q === 'low') return q;
  } catch {
    /* noop */
  }
  return null;
}

/** GPU/기기 휴리스틱으로 초기 티어 결정. */
export function detectTier(renderer: THREE.WebGLRenderer): Tier {
  const forced = urlOverride();
  if (forced) return forced;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 560;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;

  let rendererStr = '';
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
  } catch {
    /* noop */
  }

  const software = /swiftshader|software|llvmpipe|basic render/.test(rendererStr);
  const discrete = /nvidia|geforce|rtx|gtx|radeon rx|radeon pro|apple m\d/.test(rendererStr);

  if (software) return 'low';
  if (coarse || small) return mem >= 6 && cores >= 6 ? 'mid' : 'low';
  if (discrete && cores >= 8) return 'high';
  if (cores >= 8 && mem >= 8) return 'high';
  return 'mid';
}

/** DPR 상한(티어별). */
export const TIER_DPR: Record<Tier, number> = { high: 1.6, mid: 1.3, low: 1.0 };

/** 프레임타임 샘플링 → 지속적 저FPS 시 강등 콜백. */
export class FpsMonitor {
  private samples: number[] = [];
  private last = 0;
  private cooldown = 0;
  fps = 60;

  constructor(
    private readonly onDrop: () => void,
    private readonly targetFps = 45,
  ) {}

  tick(now: number): void {
    if (this.last) {
      const dt = now - this.last;
      if (dt > 0 && dt < 1000) {
        this.samples.push(dt);
        if (this.samples.length > 90) this.samples.shift();
      }
    }
    this.last = now;
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    if (this.samples.length >= 60) {
      const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
      this.fps = 1000 / avg;
      if (this.fps < this.targetFps) {
        this.onDrop();
        this.samples = [];
        this.cooldown = 120; // 강등 후 안정화 대기
      }
    }
  }

  reset(): void {
    this.samples = [];
    this.cooldown = 60;
  }
}
