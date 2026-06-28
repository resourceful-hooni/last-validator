# CREDITS — 에셋 출처·라이선스

「마지막 검증자」의 모든 에셋은 **순수 창작물 또는 CC0/OFL**이며, 외부 영상·사진·음악·유료 폰트·캐릭터·로고·실존 인물 자산을 포함하지 않는다. (공모전 '순수 창작·타인 저작권/초상권 비침해' 요건)

## 그래픽 / 일러스트
- 모든 시각 요소(대시보드, KPI, vCap 바, 뇌 CT 추상, 시계, 역추적 화살표, 스코어보드, 파비콘, OG 이미지)는 **자작 SVG 또는 CSS/Canvas 생성**. 외부 이미지 0.
- `public/favicon.svg`, `public/apple-touch-icon.svg` — 자작 SVG(검증 점 모티프).
- `public/og.png` — `assets-src/og.svg`(자작)를 `npm run render-og`로 래스터화한 1200×630 미리보기. (래스터화 도구 `sharp`는 빌드 의존성일 뿐 산출물에 포함되지 않음.)

## 폰트
- 현재 빌드는 **시스템 폰트 스택**만 사용한다(임베드 없음). 따라서 별도 폰트 라이선스 의무 없음.
  - ko: Pretendard*, Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR
  - en: Inter*, Helvetica Neue, Arial
  - zh: Noto Sans SC, PingFang SC, Microsoft YaHei
  - ja: Noto Sans JP, Hiragino Sans, Yu Gothic, Meiryo
  - (*Pretendard·Inter·Noto는 OFL. 추후 셀프호스트로 임베드할 경우 OFL 라이선스 파일을 `public/fonts/`에 동봉하고 여기에 명시한다.)

## 사운드
- (Phase 7 예정) 전부 **CC0/퍼블릭도메인** 또는 Web Audio 합성. 추가 시 파일명·출처·라이선스를 여기에 기록한다.

## 라이브러리
- GSAP (그린삭 표준 'No Charge' 라이선스, 무료 범위 사용) — https://gsap.com
- Vite, TypeScript (MIT/오픈소스)

---
_마지막 업데이트: Phase 0_
