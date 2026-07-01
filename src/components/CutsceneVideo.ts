/**
 * CutsceneVideo.ts — 비인터랙티브 시네마틱 컷신(자작 렌더 영상) 재생.
 * 인트로·2036 전환에 사용. 스킵 버튼, onEnded, 로드 실패 시 'error' → 호출부가 라이브 폴백.
 * 자산은 자작 Remotion 렌더(public/video/*.mp4) — 외부 저작권 0.
 */
import { t } from '../i18n';
import { prefersReducedMotion } from '../engine/motion';
import './cutscene.css';

export type CutsceneResult = 'ended' | 'skipped' | 'error';

/** 모바일/세로 뷰포트 여부 → 세로(9:16) 컷신 변형 사용 */
function isMobileViewport(): boolean {
  return window.innerWidth < 700 || window.innerHeight > window.innerWidth;
}

/** public/video/<name>[-mobile].mp4 경로(배포 base·기기 반영) */
export function cutsceneUrl(name: string): string {
  const suffix = isMobileViewport() ? '-mobile' : '';
  return `${import.meta.env.BASE_URL}video/${name}${suffix}.mp4`;
}

export interface CutsceneHandle {
  el: HTMLElement;
  done: Promise<CutsceneResult>;
  /** 즉시 정리(씬 이탈 등) */
  dispose(): void;
}

export function playCutscene(src: string): CutsceneHandle {
  const el = document.createElement('div');
  el.className = 'cutscene';

  const video = document.createElement('video');
  video.className = 'cutscene__video';
  video.src = src;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'auto');

  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'cutscene__skip';
  skip.textContent = t('ui.skip');

  el.append(video, skip);
  // 항상 body에 부착 — 씬 컨테이너의 transform(등장 애니메이션)에 fixed가 깨지지 않도록.
  document.body.appendChild(el);

  let done = false;
  let resolveFn!: (r: CutsceneResult) => void;
  const promise = new Promise<CutsceneResult>((res) => (resolveFn = res));

  const finish = (r: CutsceneResult): void => {
    if (done) return;
    done = true;
    window.clearTimeout(guard);
    el.classList.add('is-leaving');
    window.setTimeout(
      () => {
        el.remove();
        resolveFn(r);
      },
      prefersReducedMotion() ? 0 : 340,
    );
  };

  video.addEventListener('ended', () => finish('ended'));
  video.addEventListener('error', () => finish('error'));
  skip.addEventListener('click', () => finish('skipped'));

  // 자동재생(음소거)은 대부분 허용. 실패해도 스킵/ended로 처리.
  void video.play().catch(() => {
    /* 제스처 필요 시 사용자가 스킵 가능 */
  });

  // 안전망: 로드 실패 또는 자동재생 차단(로드됐지만 재생 안 됨) → error(폴백/진행)
  const guard = window.setTimeout(() => {
    if (!done && (video.readyState < 2 || (video.paused && video.currentTime === 0))) finish('error');
  }, 2500);

  return {
    el,
    done: promise,
    dispose: () => finish('skipped'),
  };
}
