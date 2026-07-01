// loadFonts.ts — 컷신 렌더 시 앱과 동일한 Pretendard(OFL 서브셋)를 로드.
// 렌더 머신에 Pretendard가 없어 폴백(Malgun)으로 렌더되던 문제 방지 → 앱 S0와 서체 일치.
import { staticFile, delayRender, continueRender } from 'remotion';

const handle = delayRender('Loading Pretendard');
const font = new FontFace(
  'Pretendard',
  `url(${staticFile('fonts/pretendard-subset.woff2')}) format('woff2')`,
  { weight: '100 900', style: 'normal' },
);
font
  .load()
  .then((loaded) => {
    document.fonts.add(loaded);
    continueRender(handle);
  })
  .catch((err) => {
    // 폰트 로드 실패해도 렌더는 진행(폴백)
    console.error('[loadFonts] Pretendard load failed', err);
    continueRender(handle);
  });
