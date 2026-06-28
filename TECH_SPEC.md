# TECH_SPEC — 「마지막 검증자」 기술 사양

## 1. 핵심 결정: '영상형'을 어떻게 구현하나
실사 영상이 아니라 **코드로 연출하는 모션그래픽**으로 "영상이 흐르는" 느낌을 만든다.
- **권장(기본): 정적 웹 + 타임라인 애니메이션.** 각 장면 = GSAP 타임라인 + DOM/SVG/Canvas. 시네마틱 전환·타이포 stagger·계기판 글로우·CT 스캔·draw 애니메이션으로 영상감 확보. 인터랙티브 유지(선택 분기).
- **옵션(부가 산출물): Remotion(MP4).** 동일 카피/디자인으로 60~90초 **트레일러 영상**을 프로그램적으로 렌더 → YouTube 비공개 링크 제출용. 인터랙티브 본편과 별도 타깃.

> 결론: **본편 = 인터랙티브 시네마틱 웹**, **옵션 = Remotion 트레일러**. 둘은 디자인 토큰/카피를 공유한다.

## 2. 권장 스택
- 빌드: **Vite**
- 언어: **TypeScript (strict)**
- 애니메이션: **GSAP**(+ 필요 시 Flip, MotionPath, DrawSVG는 무료 대체 가능한 기법으로) — 라이선스 확인, 무료 범위 내 사용 또는 동등 OSS(motion one 등)로 대체 가능
- 렌더: **Vanilla TS + SVG/Canvas**(프레임워크 불필요). React 선호 시 React+TS도 허용하되 과한 의존성 지양.
- 스타일: CSS(변수 토큰) 또는 가벼운 CSS-in-TS. Tailwind는 선택(필수 아님).
- 사운드: Web Audio API 또는 `<audio>`; 에셋은 CC0/생성.
- (옵션) 트레일러: **Remotion**(React) — 별도 `trailer/` 워크스페이스.

대안(더 강한 시네마틱이 필요할 때): Canvas/WebGL — **Pixi.js**(2D 파티클/필터) 또는 **Three.js**(3D, 과함). 기본 요구엔 불필요.

## 3. 파일 구조 (제안)
```
/ (repo root)
  CLAUDE.md  PRD.md  STORYBOARD.md  TECH_SPEC.md  DESIGN_SYSTEM.md  TASKS.md  README.md
  index.html
  package.json  tsconfig.json  vite.config.ts
  /public            # 정적 에셋(자작 SVG, CC0 오디오)
  /src
    main.ts          # 부트스트랩, 씬 라우터 시작
    /engine
      SceneEngine.ts  # 씬 전환/타임라인 오케스트레이션(상태머신)
      state.ts        # vCap/eff/greens/vbarKilled 스토어 + 결말 분기
      motion.ts       # 공통 모션 헬퍼(페이드/stagger/draw), reduced-motion 분기
      audio.ts        # 사운드 매니저(음소거 토글, 기본 OFF)
    /scenes
      s0_title.ts ... s12_ending.ts   # STORYBOARD의 S0~S12 각 1파일
    /components
      Dashboard.ts  KpiChip.ts  VCapBar.ts  ChoiceCard.ts  SceneCaption.ts
      TraceRow.ts  AnchorCard.ts  ProgressBar.ts  Scoreboard.ts
    /data
      script.ts       # STORYBOARD의 카피/분기를 타입드 데이터로 (정본 미러)
    /styles
      tokens.css      # DESIGN_SYSTEM 토큰
      base.css
  /trailer (옵션)     # Remotion 프로젝트(별도)
```

## 4. 씬 엔진 설계
- **상태머신**: `SceneEngine`이 현재 씬 id를 보유, `next(id)` / `goByVCap()`로 전이. 각 씬 모듈은 `enter(container, ctx)` → GSAP 타임라인 생성, `exit()` → 정리.
- **데이터 주도**: 장면 카피·선택지·분기는 `data/script.ts`에 타입드 객체로. 씬 모듈은 데이터를 받아 렌더+애니메이트만. (STORYBOARD가 정본, script.ts는 그 미러.)
- **선택 처리**: ChoiceCard 클릭 → `state.applyChoice(sceneId, 'A'|'B')` → 대시보드 갱신(애니메이션) → 피드백 카드 → next.
- **결말 분기**: `state.endingBranch()` → 'tragedy'|'nearmiss'|'averted'.
- **트랜지션**: 씬 간 공통 트랜지션(화이트아웃/암전/모핑)을 `motion.ts`에 캡슐화.

```ts
// state.ts (요지)
export const state = {
  vCap: 100, eff: 0, greens: [false,false,false,false], vbarKilled: false,
  applyChoice(scene: number, pick: 'A'|'B') { /* eff++/vCap-=20/greens[..]=true/vbarKilled */ },
  endingBranch(): 'tragedy'|'nearmiss'|'averted' {
    return this.vCap < 35 ? 'tragedy' : this.vCap < 70 ? 'nearmiss' : 'averted';
  },
  reset() { /* 전체 초기화 (리플레이) */ }
};
```

## 5. 에셋 전략 (저작권 안전 · 필수)
- **이미지/일러스트:** 전부 **자작 SVG/벡터** 또는 CSS/Canvas 생성. 외부 사진·스톡·캐릭터 금지.
  - 핵심 비주얼: 추상 뇌 CT(벡터 단면 + 스캔라인 + AI 오버레이 윤곽선), 대시보드(코드로), 시계/골든타임(SVG), 역추적 화살표(SVG path draw), 스코어보드(코드로).
- **폰트:** 시스템 한국어 스택 기본. 임베드 시 **OFL/CC0만**(예: Pretendard OFL — 라이선스 표기). 유료 폰트 금지.
- **사운드:** **CC0/퍼블릭도메인** 또는 합성(Web Audio 톤 생성). 출처·라이선스를 `/public/CREDITS.md`에 기록.
- **금지:** 영화·게임·음악·브랜드 자산, 실존 인물 사진/음성, 무단 스톡.
- 모든 인물(김재민·박지훈)은 **이름·실루엣 등 추상 표현**만. 사실적 얼굴/사진 금지.

## 6. 반응형 · 성능 · 접근성
- **반응형:** 모바일 세로 우선. 컨테이너 max-width(약 680px) 중앙 정렬. `clamp()` 타이포. 터치 타깃 ≥44px. iOS는 `100dvh`/`-webkit-fill-available` 처리.
- **성능:** GSAP는 transform/opacity 위주(레이아웃 thrash 회피). 무거운 필터·대형 비트맵 지양. 초기 번들 작게(코드 스플릿: 씬 lazy import 가능). 목표 60fps.
- **접근성:**
  - `prefers-reduced-motion: reduce` → 모든 모션을 즉시 표시/짧은 페이드로 대체(서사 완결 보장).
  - 광과민: 빠른 깜빡임/스트로브 금지. 글로우는 부드럽게.
  - 텍스트 대비 충분(DESIGN_SYSTEM 토큰 준수). 오디오엔 시각 대체(자막/설명) + 기본 음소거.
  - 키보드: Enter/Space로 진행·선택 가능. 포커스 가시화.
- **견고성:** 연타 디바운스, 씬 전이 중 입력 잠금, 리플레이 시 타임라인·리스너 완전 정리.

## 7. 빌드 · 배포
- `npm i` → `npm run dev`(개발) → `npm run build`(→ `dist/`) → `npm run preview`.
- 배포: **GitHub Pages**(레포에 `dist`를 Pages로) 또는 **Vercel**(정적). base 경로 주의(Vite `base`).
- 산출 링크는 **'모든 사용자 열람 가능'**.
- (옵션) Remotion: `/trailer`에서 `npx remotion render` → `trailer.mp4`.

## 8. 품질 게이트(머지 전)
- 모바일(360px)·데스크톱(1280px) 양쪽 깨짐 0, 가로 스크롤 0.
- reduced-motion에서 S0~S12 완주 가능.
- 카피가 STORYBOARD와 100% 일치.
- 저작권 금지 에셋 0 (CREDITS.md로 검증).
- 리플레이 후 상태 완전 초기화.

---

## 9. 누락 보강 — 공유/첫인상/메타 (필수)
이 경험은 **심사위원에게 링크로 전달**되므로 아래는 P0다.
- **`<head>` 메타:** `<title>마지막 검증자 — 초록불의 함정</title>`, `lang="ko"`, `<meta name="description">`(제안서 명제 한 줄), theme-color.
- **Open Graph / Twitter Card:** `og:title`, `og:description`, `og:image`(자작 1200×630 SVG→PNG 미리보기), `og:type=website`, `twitter:card=summary_large_image`. → 카카오톡/노션/슬랙에 링크 붙일 때 **미리보기 카드**가 뜨도록(전달력에 직결).
- **파비콘:** 자작 SVG 파비콘(빨간 점/검증 모티프). apple-touch-icon 포함.
- **프리로더(로딩 화면) [P0]:** 폰트/오디오/초기 SVG 준비 전 빈 화면 노출 금지. 미니멀 로딩(브랜드 + 진행 인디케이터) 후 S0 진입. 첫인상 보호.
- **폰트 로딩:** 임베드 시 `font-display: swap` + preload. 한국어 텍스트 깜빡임(FOUT) 최소화. 시스템 폰트 폴백 보장.
- **오디오 정책:** 브라우저 자동재생 차단 → 오디오는 **시작 버튼(사용자 제스처) 이후에만** 활성. 기본 음소거 + 우측 상단 음소거 토글.
- **전역 컨트롤 위치:** 음소거 토글·진행바·(긴 장면) 스킵을 상단 바에 일관 배치.
- **CTA 링크 변수화:** '제안서 보기' 대상 URL은 `PROPOSAL_URL` 상수로 분리(제출 직전 실제 링크/노션 주소로 교체). 미설정 시 버튼 비표시 또는 placeholder.

## 10. 의존성 · 라이선스 · 테스트 매트릭스
- **권장 deps:** `vite`, `typescript`, `gsap`(무료 범위) 또는 `motion`(motion one, MIT). 선택 시 `popmotion`/`@motionone/dom` 대체 가능. (Remotion은 옵션 워크스페이스에서만.)
- **프로젝트 라이선스:** 팀 자작물에 `LICENSE`(예: MIT 또는 비공개) 명시. 에셋 라이선스는 `public/CREDITS.md`.
- **테스트 매트릭스(최소):** iOS Safari(아이폰), Android Chrome, 데스크톱 Chrome/Edge/Safari. 폭 320 / 390 / 768 / 1280. 다크 환경 기준.

## 11. 데이터 스키마 (src/data/script.ts — STORYBOARD 미러)
```ts
export type Branch = 'tragedy' | 'nearmiss' | 'averted';

export interface Choice {
  tag: '효율 우선' | '역량 보존';
  text: string;           // 선택지 제목
  sub: string;            // 선택지 서브
  efficient: boolean;     // true=효율(A) / false=보존(B)
  kpi: 0 | 1 | 2 | 3;     // 점등/호박 대상 KPI 인덱스(처리량·비용·일치율·대기)
  feedback: string;       // 선택 후 피드백 문장
  killVbar?: boolean;     // S4-A에서만 true (경보 꺼짐)
}

export interface DecisionScene {
  id: 's1'|'s2'|'s3'|'s4'|'s5';
  meta: string; title: string; body: string;  // body는 <em>/<gn>/<rd> 강조 허용
  a: Choice;  // 효율(A)
  b: Choice;  // 보존(B)
}

export interface EndingCopy {
  branch: Branch;
  act2Title: string; act2Body: string;  // S9
  verdict: string;                       // S10 평결
  revealMessage: string;                 // S7 메시지
}

// 표시 수치(S6): 운영효율 = 20 + eff*16, 비용 = 8 + eff*5
// 분기: vCap<35 tragedy / 35~69 nearmiss / >=70 averted
// i18n: 아래 string 필드는 실제 카피가 아니라 "키"를 담는다(예: titleKey:"s1.title"). 렌더 시 t(key)로 해석. 번역 전문은 TRANSLATIONS.md.
export const KPI_LABELS = ['판독 처리량','비용 절감','AI 일치율','환자 대기'] as const;
export const PROPOSAL_URL = ''; // 제출 직전 실제 제안서/노션 링크로 교체
```

## 12. 다국어(i18n) 아키텍처 (P0)
- **로케일 로더**: `src/i18n/index.ts` — 현재 로케일 보유, `t(key, params?)` 리졸버, `setLocale(loc)`(폰트+`<html lang>`+텍스트 교체, 진행 유지). 누락 키는 ko 폴백 + 콘솔 경고.
- **로케일 파일**: `src/locales/{ko,en,zh,ja}.json` ← `TRANSLATIONS.md` 그대로 변환. 동일 키 집합 필수(빌드 시 키 diff 검사 스크립트 권장).
- **지연 로딩**: 초기엔 결정 로케일만 로드, 전환 시 동적 import로 해당 로케일 로드(용량 절감).
- **데이터 결합**: `data/script.ts`는 카피 대신 **키**를 가리킨다. 예: `{ id:'s1', metaKey:'s1.meta', titleKey:'s1.title', a:{ textKey:'s1.a.text', ... } }`. 렌더 시 `t()`로 해석.
- **보간/강조**: `{value}`/`{n}` 치환. 강조 토큰 `<em>/<gn>/<rd>`는 안전 파서로 스타일 span 변환(XSS 방지: 허용 태그 화이트리스트).
- **폰트 로딩**: 로케일별 폰트 preload + `font-display:swap`. CJK는 서브셋/지연로딩으로 용량 관리.
- **라우팅/SEO**: `?lang=` 쿼리(간단) 또는 `/{locale}/` 경로(권장). `hreflang` 대체 링크 + `og:locale[:alternate]`. 정적 빌드로 각 로케일 진입 가능하게.
- **전환 컴포넌트**: `components/LangSwitcher.ts` — 자기표기 라벨, 키보드/aria, 현재 선택 표시.
- 자세한 규칙·폰트표·QA는 `I18N.md`.
