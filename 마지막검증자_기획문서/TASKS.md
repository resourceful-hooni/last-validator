# TASKS — 구현 계획 (Phase별 · Claude Code용)

원칙: **Phase 0부터 순서대로**. 각 Phase 끝에서 DoD(완료 기준)를 통과해야 다음으로. 콘텐츠는 STORYBOARD, 디자인은 DESIGN_SYSTEM, 기술은 TECH_SPEC을 정본으로.

---

## Phase 0 · 프로젝트 셋업
- [ ] Vite + TypeScript(strict) 초기화, `index.html` 기본.
- [ ] GSAP 설치(무료 범위) 또는 동등 OSS(motion one) 선택·기록.
- [ ] `styles/tokens.css`에 DESIGN_SYSTEM 색·타이포 토큰 반영. `base.css`.
- [ ] 폴더 구조(TECH_SPEC §3) 생성. `data/script.ts` 타입 정의 스텁.
- [ ] `public/CREDITS.md` 생성(에셋 라이선스 기록 시작).
- **DoD:** `npm run dev`로 빈 페이지 + 토큰 적용 확인. 빌드 성공.

## Phase 1 · 씬 엔진 + 상태 + 데이터
- [ ] `engine/state.ts`: vCap/eff/greens/vbarKilled, `applyChoice`, `endingBranch`, `reset`(TECH_SPEC §4).
- [ ] `engine/SceneEngine.ts`: 씬 등록/전이(enter/exit), 컨테이너 마운트.
- [ ] `engine/motion.ts`: 페이드/슬라이드업/stagger/draw/카운트, **reduced-motion 분기**.
- [ ] `data/script.ts`: STORYBOARD의 S0~S12 카피·선택지·분기를 타입드 데이터로 미러.
- **DoD:** 더미 두 씬을 엔진으로 전환 가능. reduced-motion 토글 시 즉시표시. 상태 단위 동작 확인.

## Phase 2 · 인트로 + 대시보드(핵심 장치)
- [ ] `components/Dashboard.ts`, `KpiChip.ts`, `VCapBar.ts`, `ProgressBar.ts`.
- [ ] KPI 상태(중립/초록/호박/꺼짐) + 점등 글로우 펄스 애니메이션.
- [ ] VCapBar 감소 애니메이션 + 색 임계 + **'측정 안 함' 디밍 상태**.
- [ ] `scenes/s0_title.ts`: 시네마틱 타이틀(stagger) + 리드 + 시작 버튼.
- **DoD:** 인트로→대시보드 전환. 대시보드 상태를 수동 호출로 바꿔 애니메이션 확인(모바일/데스크톱).

## Phase 3 · ACT1 다섯 결정 씬
- [ ] `components/ChoiceCard.ts`, `SceneCaption.ts`, FeedbackCard.
- [ ] `scenes/s1..s5`: 셋업 모션 → 선택 → 결과 모션(KPI 변화/vCap/델타 칩) → 다음.
- [ ] **S4 핵심 연출**: 효율 선택 시 전 KPI 초록 점등 → 화면 초록빛 정점 → vCap '측정 안 함' 디밍 + 험 끊김.
- [ ] 진행바·ACT 뱃지 갱신, 연타 잠금.
- **DoD:** 5개 씬 양 분기 모두 정상. KPI/vCap 누적 정확. S4 경보-꺼짐 연출 체감됨. 카피 STORYBOARD와 일치.

## Phase 4 · 결산 + 검증역량 공개
- [ ] `scenes/s6_settlement.ts`: 초록 스코어보드(카운트업, eff 기반 수치) + "아무도 이 숫자는 보지 않았습니다".
- [ ] `scenes/s7_reveal.ts`: 대형 % **카운트다운** 리빌 + 색 임계 + 분기별 메시지.
- [ ] 전환(초록 수축→암전→시계 비프).
- **DoD:** eff에 따라 수치·vCap·메시지 정확. 리빌 임팩트 확인.

## Phase 5 · ACT2 2036 시네마틱(분기 3종)
- [ ] `scenes/s8_timejump.ts`: 연도 2026→2036 가속 + 모니터 톤 전환.
- [ ] `scenes/s9_er.ts`: 추상 뇌 CT(벡터) + AI 오버레이 윤곽선(사라짐/오류) + 골든타임 시계 + 구석 초록 대시보드. **vCap 분기 3종 카피/색**.
- **DoD:** 세 분기 각각 정상 재생. 비주얼이 자극·과장 없이 상징적. 시계/오버레이 모션 동작.

## Phase 6 · 엔딩(역추적 + 앵커 + 명제 + CTA)
- [ ] `scenes/s10_trace.ts`: 평결(분기별) + 4개 TraceRow(화살표 draw).
- [ ] `scenes/s11_anchors.ts`: 실제 신호 3행(타이프라이터/하이라이트).
- [ ] `scenes/s12_ending.ts`: 명제 2줄(둘째 빨강) + CTA(제안서 링크) + **리플레이(상태 완전 초기화)** + 고지.
- **DoD:** 분기별 평결 정확. 역추적/앵커 카피 일치. 리플레이 후 깨끗하게 재시작.

## Phase 7 · 폴리시(사운드·반응형·접근성·성능)
- [ ] `engine/audio.ts`: CC0/생성 사운드, **기본 음소거 + 토글**, 자막/시각 대체.
- [ ] 모바일(320~430px)·데스크톱 QA, 가로 스크롤 0, iOS dvh.
- [ ] reduced-motion 전 구간 점검. 키보드 진행. 포커스 링. 명도대비.
- [ ] 성능: transform/opacity 위주, 번들 점검(가능 시 씬 lazy import), 60fps.
- **DoD:** 품질 게이트(TECH_SPEC §8) 전부 통과.

## Phase 8 · (옵션) 트레일러 + 배포
- [ ] GitHub Pages/Vercel 배포, base 경로 처리, '모든 사용자 열람 가능' 확인.
- [ ] (옵션) `/trailer` Remotion: 60~90초 MP4(카피/디자인 공유) → `trailer.mp4`.
- [ ] README에 배포 링크·빌드법·CREDITS 정리.
- **DoD:** 공개 링크 동작(모바일/데스크톱). (옵션) MP4 렌더 성공.

---

## 전역 완료 정의(DoD, 모든 Phase 공통)
- 카피가 STORYBOARD와 100% 일치(오타·개선은 코멘트 제안).
- 저작권 금지 에셋 0(자작 SVG/CC0만, CREDITS.md 기록).
- 모바일·데스크톱 깨짐 0, reduced-motion 완주, 리플레이 초기화.
- 인물·기관은 가상·추상 표현만, 사실적 얼굴/사진 없음.

---

## Phase 0.5 · 메타 & 셸 (누락 보강 · Phase 1 전 또는 병행)
- [ ] `<head>` title/description/lang/theme-color, OG·Twitter 메타, 파비콘·apple-touch-icon(자작 SVG).
- [ ] OG 미리보기 이미지(1200×630) 자작 → `public/og.png`.
- [ ] **프리로더** 컴포넌트(폰트/오디오 준비 후 S0 진입).
- [ ] 폰트 `font-display:swap`+preload, 시스템 폴백.
- [ ] 음소거 토글(상단 우측), 오디오는 사용자 제스처 이후 활성.
- [ ] `PROPOSAL_URL` 상수 분리.
- **DoD:** 링크를 카카오톡/노션에 붙였을 때 미리보기 카드 정상. 로딩 중 빈 화면 없음. 폰트 깜빡임 최소.

## DoD 추가 항목(전역)
- [ ] OG/메타/파비콘 정상, 링크 미리보기 카드 표시
- [ ] 프리로더로 첫 화면 팝인 방지
- [ ] 오디오는 제스처 이후·기본 음소거·토글 동작
- [ ] PROPOSAL_URL 미설정 시에도 깨지지 않음(버튼 숨김/placeholder)

---

## Phase 1.5 · i18n 기반 (Phase 1 직후 · P0)
- [ ] `src/i18n/index.ts`: `t(key, params)`, `setLocale`, 폴백(ko)+누락 경고.
- [ ] `src/locales/{ko,en,zh,ja}.json`: `TRANSLATIONS.md` 그대로 변환. 키 집합 일치 검사 스크립트.
- [ ] `data/script.ts`를 **키 참조**로 전환(카피 직접 보유 금지).
- [ ] 강조 토큰(`<em>/<gn>/<rd>`) 안전 파서(화이트리스트).
- [ ] 로케일 자동감지(navigator.language)+`localStorage` 지속+URL 동기화.
- [ ] `components/LangSwitcher.ts`(자기표기 라벨, 키보드/aria).
- [ ] 언어별 폰트 로딩(preload+swap)+`<html lang>` 동적 교체.
- **DoD:** 4개 언어로 인트로~한 장면 전환, 진행 중 전환 시 텍스트·폰트 교체+상태 유지. 누락 키 0.

## i18n DoD 추가 항목(전역)
- [ ] 모든 사용자 텍스트가 키 기반(하드코딩 0)
- [ ] **4개 언어 × (320/390/768/1280)** 깨짐·잘림·가로스크롤 0
- [ ] 로케일별 폰트 정확 적용, FOUT 최소, hreflang/og:locale 설정
- [ ] reduced-motion에서 4개 언어 모두 완주
