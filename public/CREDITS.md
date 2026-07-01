# CREDITS — 에셋 출처·라이선스

「마지막 검증자」의 모든 에셋은 **순수 창작물 또는 CC0/OFL**이며, 외부 영상·사진·음악·유료 폰트·캐릭터·로고·실존 인물 자산을 포함하지 않는다. (공모전 '순수 창작·타인 저작권/초상권 비침해' 요건)

## 그래픽 / 일러스트
- 모든 시각 요소(대시보드, KPI, vCap 바, 뇌 CT 추상, 시계, 역추적 화살표, 스코어보드, 파비콘, OG 이미지)는 **자작 SVG 또는 CSS/Canvas 생성**. 외부 이미지 0.
- `public/favicon.svg`, `public/apple-touch-icon.svg` — 자작 SVG(검증 점 모티프).
- `public/og.png` — `assets-src/og.svg`(자작)를 `npm run render-og`로 래스터화한 1200×630 미리보기. (래스터화 도구 `sharp`는 빌드 의존성일 뿐 산출물에 포함되지 않음.)
- `public/video/intro.mp4`·`timejump.mp4` — **자작 Remotion 컴포지션**(`trailer/src/Intro.tsx`·`Timejump.tsx`)을 렌더한 비인터랙티브 컷신. 외부 영상·음원 0(무음). 인트로/2036 전환에 임베드, reduced-motion·로드실패 시 라이브 폴백.

## 폰트
- 현재 빌드는 **시스템 폰트 스택**만 사용한다(임베드 없음). 따라서 별도 폰트 라이선스 의무 없음.
  - ko: Pretendard*, Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR
  - en: Inter*, Helvetica Neue, Arial
  - zh: Noto Sans SC, PingFang SC, Microsoft YaHei
  - ja: Noto Sans JP, Hiragino Sans, Yu Gothic, Meiryo
  - (*Pretendard·Inter·Noto는 OFL. 추후 셀프호스트로 임베드할 경우 OFL 라이선스 파일을 `public/fonts/`에 동봉하고 여기에 명시한다.)

## 사운드
- 전부 **Web Audio API 실시간 합성**(`src/engine/audio.ts`) — 외부 오디오 파일 0, 저작권 안전.
  - 앰비언트 험(저주파 사인 합성), KPI '딩', 보존 '둔탁', S4 험 끊김, S8 모니터 비프+드론, 엔딩 저음 임팩트.
  - 기본 음소거 + 우측 상단 토글, 사용자 제스처(시작 버튼) 이후에만 활성. 모든 연출에 시각 대체 존재.

## 3D (WebGL) · 시네마틱 렌더링
- 모든 지오메트리·셰이더 **자작·절차적**: 배경 파티클, 반투명 메시 뇌, **레이마칭 볼류메트릭 CT 뇌(GLSL)**, 색보정 이펙트. 외부 3D 모델·텍스처·HDRI·LUT 파일 0.
- 환경맵은 three `RoomEnvironment`(절차 생성) 기반 IBL — 외부 HDRI 없음.
- 포스트프로세싱: 톤매핑(AgX)·블룸·피사계심도·비네팅·필름그레인·색수차·SMAA.
- 품질 티어(고=볼류메트릭/저=경량) 자동 + FPS 자동 강등. reduced-motion·WebGL 미지원 시 2D 폴백.

## 라이브러리
- GSAP (그린삭 표준 'No Charge' 라이선스, 무료 범위 사용) — https://gsap.com
- Three.js (MIT) — WebGL 렌더링
- Vite, TypeScript (MIT/오픈소스)

---
_마지막 업데이트: Phase 0_
