# CREDITS — 에셋 출처·라이선스

「마지막 검증자」의 모든 에셋은 **자작(순수 창작)이거나 CC0/OFL, 또는 상업 사용이 허용된 오픈 라이선스 도구로 자체 생성한 산출물**(예: Apache-2.0 오픈웨이트 모델로 합성한 낭독 오디오)이며, 외부 영상·사진·음악·유료 폰트·캐릭터·로고·실존 인물 자산을 포함하지 않는다. (공모전 '순수 창작·타인 저작권/초상권 비침해' 요건)

## 그래픽 / 일러스트
- 모든 시각 요소(대시보드, KPI, vCap 바, 뇌 CT 추상, 시계, 역추적 화살표, 스코어보드, 파비콘, OG 이미지)는 **자작 SVG 또는 CSS/Canvas 생성**. 외부 이미지 0.
- `public/favicon.svg`, `public/apple-touch-icon.svg` — 자작 SVG(검증 점 모티프).
- `public/og.png` — `assets-src/og.svg`(자작)를 `npm run render-og`로 래스터화한 1200×630 미리보기. (래스터화 도구 `sharp`는 빌드 의존성일 뿐 산출물에 포함되지 않음.)
- `public/video/{intro,finale}.mp4`(가로 1920×1080) + `{intro,finale}-mobile.mp4`(세로 1080×1920) — **자작 Remotion 컴포지션**(`trailer/src/Intro.tsx`·`Finale.tsx`, 방향 반응형)을 렌더한 비인터랙티브 컷신. 외부 영상·음원 0(무음). 뷰포트에 따라 가로/세로 변형 서빙. 인트로/명제 finale에 임베드, reduced-motion·로드실패 시 라이브 폴백. 컷신은 항상 body 부착. (2036 전환 S8은 라이브 3D.)

## 폰트
- **셀프호스트 자작 서브셋(OFL 1.1)** — 실제 사용 글자만 서브셋해 `public/fonts/`에 동봉(원본 대비 초경량, 로케일별 1파일만 로드). 스택 맨 앞에 두고 시스템 폰트를 폴백으로 유지.
  - **Pretendard** (ko·en) — `public/fonts/pretendard-subset.woff2` (Variable wght, ~104KB). OFL 1.1. 라이선스: `public/fonts/OFL-Pretendard.txt`. 출처: https://github.com/orioncactus/pretendard
  - **Noto Sans SC** (zh) — `public/fonts/noto-sc-subset.woff2` (Variable wght, ~180KB). © Google, OFL 1.1. 라이선스: `public/fonts/OFL-Noto.txt`. 출처: https://github.com/notofonts/noto-cjk
  - **Noto Sans JP** (ja) — `public/fonts/noto-jp-subset.woff2` (Variable wght, ~198KB). © Google, OFL 1.1. 라이선스: `public/fonts/OFL-Noto.txt`.
  - 서브셋 생성: `node scripts/subset-fonts.mjs` (원본 TTF는 `assets-src/fonts/`, gitignore). 카피 수정 시 재실행.
  - 폴백(임베드 안 함, 시스템): Apple SD Gothic Neo·Malgun Gothic·Inter·PingFang SC·Hiragino Sans·Yu Gothic·Meiryo·system-ui.
  - 서브셋 미보유 글리프(한자주기 老·非, 일부 로케일의 ↺ 리플레이 화살표)는 시스템 폰트로 자연 폴백(누락·두부현상 없음).

## 사운드
- **효과음·앰비언트: Web Audio API 실시간 합성**(`src/engine/audio.ts`) — 외부 오디오 파일 0.
  - 앰비언트 험(저주파 사인 합성), KPI '딩', 보존 '둔탁', S4 험 끊김, S8 모니터 비프+드론, 엔딩 저음 임팩트.
  - 기본 재생(첫 사용자 제스처에 오디오 컨텍스트 활성) + 우측 상단 음소거 토글. 모든 연출에 자막·시각 대체 존재.
- **감정 낭독(영어 한정): Kokoro TTS(Apache-2.0 오픈웨이트)로 자작 생성**한 mp3(`public/audio/narration/en/`, 총 ~1.4MB).
  - 본 작품의 영어 카피(`src/locales/en.json`)를 오프라인 합성(`scripts/generate-narration.mjs`, 보이스 `af_heart`, mp3 인코딩 `@breezystack/lamejs`). 상업 TTS·타인 음성 0.
  - **한국어/중/일: 브라우저 Web Speech(OS 음성) 런타임 낭독**(`src/engine/narration.ts`) — mood별 rate/pitch로 절제된 낭독. **임베드 에셋 0·저작권 안전**(사용자 기기 OS 음성, 시스템 폰트와 동일 성격). 자연스러움은 기기 의존, 해당 언어 음성이 없으면 무음 스킵.
  - 공통: 옵트인 토글(기본 OFF, 전 로케일)·음소거 연동·자막(화면 텍스트) 상시. en 클립은 씬별 지연 로드.
  - 라이선스: Kokoro 모델 **Apache-2.0**(오픈웨이트, 상업 사용 가능; 원문 `public/audio/narration/LICENSE-Apache-2.0.txt`, 출처·보이스 `public/audio/narration/NOTICE.txt`). CC0/OFL은 아니며 **생성물은 자작 사운드**로 취급. Web Speech는 런타임 OS 기능(에셋 없음).

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
_마지막 업데이트: 폰트 셀프호스트(OFL 서브셋) 임베드_
