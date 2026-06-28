# KICKOFF_PROMPT — Claude Code에 그대로 붙여넣는 첫 지시문

> 아래 블록을 복사해 Claude Code(레포 루트에서)에 붙여넣으세요. 이 폴더(7개 .md)가 레포 루트에 있어야 합니다.

---

너는 이 레포의 기획 문서를 그대로 구현하는 개발자다. 먼저 `CLAUDE.md`와 `PRD.md`를 정독하고, `STORYBOARD.md`(콘텐츠 정본)·`TECH_SPEC.md`·`DESIGN_SYSTEM.md`·`TASKS.md`를 참조해 작업한다.

만들 것: 「마지막 검증자」 — 선택지로 진행되지만 각 장면이 모션그래픽 영상처럼 재생되는, 모바일·데스크톱 반응형 시네마틱 웹 경험(약 3–5분). **서비스 언어 4개: 한국어·English·中文(简体)·日本語(P0).** 100% 정적 빌드. (2026 KAIST AI×실패 공모전 보완 자료)

절대 규칙(위반 금지):
1) 저작권: 외부 영상·사진·음악·유료 폰트·캐릭터·로고·실존 인물 자산 금지. 자작 SVG/벡터·CSS/Canvas 생성·CC0/OFL만. 출처는 `public/CREDITS.md`에 기록.
2) 카피 고정: `STORYBOARD.md`의 한국어 텍스트를 임의 변경하지 말 것. 개선은 `// COPY-SUGGESTION:` 주석으로만.
3) 인물 추상화: 김재민·박지훈은 이름·실루엣·상징만. 사실적 얼굴/사진 금지. "등장인물·기관은 가상" 고지 유지.
4) 반응형·접근성: 모바일 세로 우선, 데스크톱 대응, `prefers-reduced-motion` 지원, 빠른 점멸 금지, 오디오 기본 음소거+토글.
5) 정적·무서버. 계정/DB 없음.
6) 다국어: 모든 UI 텍스트는 키 기반(하드코딩 금지). ko/en/zh/ja 4개 로케일, 언어별 폰트, 정본=ko(STORYBOARD), 번역=TRANSLATIONS.md. 상세는 I18N.md.

기술: Vite + TypeScript(strict) + GSAP(무료 범위, 또는 motion one). 씬은 데이터 주도(`src/data/script.ts` = STORYBOARD 미러, 타입은 TECH_SPEC §11). 상태는 `src/engine/state.ts` 단일 출처(vCap/eff/greens/vbarKilled, 분기: vCap<35 비극 / 35~69 near-miss / ≥70 회피).

지금 할 일:
1) `TASKS.md`의 **Phase 0**(셋업) → **Phase 0.5**(메타·OG·프리로더) → **Phase 1**(씬 엔진+상태) → **Phase 1.5**(i18n 기반: 로케일 시스템·4개 locales·언어 전환)까지 구현한다.
2) 각 Phase의 DoD를 만족시키고, 모바일(390px)·데스크톱(1280px)에서 동작을 확인한다.
3) 진행하며 내린 결정은 커밋 메시지/주석에 남긴다. 막히면 콘텐츠=STORYBOARD, 디자인=DESIGN_SYSTEM, 기술=TECH_SPEC을 우선한다.
4) Phase 1까지 끝나면 멈추고, 무엇을 만들었는지와 다음 Phase 계획을 요약 보고한다.

먼저 레포를 스캔하고 구현 계획(파일 목록·순서)을 짧게 제시한 뒤 코딩을 시작해라.
