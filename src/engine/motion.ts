/**
 * motion.ts — 공통 모션 헬퍼 (GSAP). reduced-motion 분기를 여기 한 곳에 일원화한다.
 * (TECH_SPEC §6, DESIGN_SYSTEM §3)
 *
 * reduced-motion: 모든 모션 → 즉시 최종 상태(또는 ≤.15s 페이드), 카운트는 최종값 즉시.
 */
import { gsap } from 'gsap';

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * 사용자 강제 토글(접근성) — OS 설정과 별개로 모션을 끌 수 있다.
 * `?reduce=1` 또는 localStorage('forceReduce')='1'. (검증/저사양 기기에도 유용)
 */
function forcedReduce(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('reduce') === '1') return true;
    return localStorage.getItem('forceReduce') === '1';
  } catch {
    return false;
  }
}

export const prefersReducedMotion = (): boolean => mq.matches || forcedReduce();

/** 등장 ease / 전환 ease (DESIGN_SYSTEM §3) */
export const EASE_IN = 'power2.out';
export const EASE_IO = 'power2.inOut';

/** 페이드 + 슬라이드업(8px). reduced-motion 시 즉시 표시. */
export function fadeUp(
  targets: gsap.TweenTarget,
  opts: { delay?: number; duration?: number; y?: number; stagger?: number } = {},
): gsap.core.Tween {
  const { delay = 0, duration = 0.5, y = 8, stagger = 0 } = opts;
  if (prefersReducedMotion()) {
    return gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
  }
  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    { opacity: 1, y: 0, duration, delay, stagger, ease: EASE_IN, clearProps: 'transform' },
  );
}

/** 글자/줄 stagger 등장 (타이밍은 길이 비종속으로 캡) */
export function staggerIn(
  targets: gsap.TweenTarget,
  opts: { delay?: number; each?: number; max?: number } = {},
): gsap.core.Tween {
  const { delay = 0, each = 0.04, max = 0.6 } = opts;
  if (prefersReducedMotion()) {
    return gsap.set(targets, { opacity: 1, y: 0 });
  }
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 12 },
    {
      opacity: 1,
      y: 0,
      ease: EASE_IN,
      duration: 0.4,
      delay,
      stagger: { each, amount: Math.min(max, each * 12) },
      clearProps: 'transform',
    },
  );
}

/** SVG path draw (역추적 화살표 / CT 스캔선). reduced-motion 시 즉시 완성. */
export function drawPath(
  path: SVGPathElement,
  opts: { delay?: number; duration?: number } = {},
): gsap.core.Tween | void {
  const { delay = 0, duration = 0.7 } = opts;
  const len = path.getTotalLength();
  path.style.strokeDasharray = String(len);
  if (prefersReducedMotion()) {
    path.style.strokeDashoffset = '0';
    return;
  }
  path.style.strokeDashoffset = String(len);
  return gsap.to(path, { strokeDashoffset: 0, duration, delay, ease: EASE_IN });
}

/**
 * 숫자 카운트업/다운. reduced-motion 시 최종값 즉시.
 * @param render 매 프레임 호출(정수 표시 권장)
 */
export function countTo(
  from: number,
  to: number,
  render: (v: number) => void,
  opts: { duration?: number; delay?: number } = {},
): gsap.core.Tween {
  const { duration = 0.8, delay = 0 } = opts;
  if (prefersReducedMotion()) {
    render(to);
    return gsap.delayedCall(0, () => {});
  }
  const obj = { v: from };
  return gsap.to(obj, {
    v: to,
    duration,
    delay,
    ease: EASE_IN,
    onUpdate: () => render(obj.v),
    onComplete: () => render(to),
  });
}

/** 화이트아웃/암전 전환 오버레이. color: white|black. reduced-motion 시 짧게. */
export function flashTransition(
  color: 'white' | 'black' | 'green',
  onMid: () => void,
  opts: { hold?: number } = {},
): void {
  const colorMap = { white: '#ffffff', black: '#000000', green: '#34c77b' } as const;
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: colorMap[color],
    opacity: '0',
    zIndex: '5000',
    pointerEvents: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(overlay);

  const cleanup = () => overlay.remove();

  if (prefersReducedMotion()) {
    onMid();
    gsap.fromTo(
      overlay,
      { opacity: 0.6 },
      { opacity: 0, duration: 0.15, onComplete: cleanup },
    );
    return;
  }

  const { hold = 0.05 } = opts;
  const tl = gsap.timeline({ onComplete: cleanup });
  tl.to(overlay, { opacity: 1, duration: 0.4, ease: EASE_IO })
    .add(() => onMid())
    .to(overlay, { opacity: 0, duration: 0.6, delay: hold, ease: EASE_IO });
}

/**
 * 은은한 초록빛 정점(S4-A '만족의 정점'). 부드럽게 차오르고 빠지는 단발 — 점멸/스트로브 아님.
 * reduced-motion 시 호출하지 않는다(scene에서 분기).
 */
export function greenVeil(): void {
  const veil = document.createElement('div');
  Object.assign(veil.style, {
    position: 'fixed',
    inset: '0',
    background: 'radial-gradient(120% 80% at 50% 40%, rgba(52,199,123,0.28), rgba(52,199,123,0) 70%)',
    opacity: '0',
    zIndex: '400',
    pointerEvents: 'none',
  });
  document.body.appendChild(veil);
  gsap
    .timeline({ onComplete: () => veil.remove() })
    .to(veil, { opacity: 1, duration: 0.45, ease: 'power2.out' })
    .to(veil, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '+=0.1');
}

/** GSAP context를 만들어 씬 단위로 트윈을 격리·정리(리플레이 누수 0). */
export function createSceneContext(scope: Element): gsap.Context {
  return gsap.context(() => {}, scope);
}
