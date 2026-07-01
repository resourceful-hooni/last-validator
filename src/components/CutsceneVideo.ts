/**
 * CutsceneVideo.ts — 비인터랙티브 시네마틱 컷신(자작 렌더 영상) 재생.
 * 인트로·2036 전환에 사용. 스킵 버튼, onEnded, 로드 실패 시 'error' → 호출부가 라이브 폴백.
 * 자산은 자작 Remotion 렌더(public/video/*.mp4) — 외부 저작권 0.
 */
import { t } from '../i18n';
import { prefersReducedMotion } from '../engine/motion';
import './cutscene.css';

export type CutsceneResult = 'ended' | 'skipped' | 'error';

/** public/video/<name>.mp4 경로(배포 base 반영) */
export function cutsceneUrl(name: string): string {
  return `${import.meta.env.BASE_URL}video/${name}.mp4`;
}

export function playCutscene(src: string): { el: HTMLElement; done: Promise<CutsceneResult> } {
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

  // 안전망: 일정 시간 내 로드 실패 → error(라이브 폴백)
  const guard = window.setTimeout(() => {
    if (!done && video.readyState < 2) finish('error');
  }, 4000);

  return { el, done: promise };
}
