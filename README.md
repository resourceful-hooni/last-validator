# 「마지막 검증자」 — 다국어 인터랙티브 시네마틱 경험 · 기획 문서 묶음

> 2026 KAIST AI × 실패 아이디어 공모전 **보완 자료**를 만들기 위한 개발 사양서.
> 이 폴더의 문서들을 **Claude Code**에 넘겨 그대로 구현하도록 설계되었습니다.
> **서비스 언어: 한국어 · English · 中文(简体) · 日本語 (4개 언어, P0)**

## 한 줄 비전
플레이어가 2026년의 합리적 선택을 내릴 때마다 대시보드가 **초록불**로 켜지지만, 화면 구석의 '독립 검증 역량'은 조용히 무너지고 — 2036년, 그 대가를 **영화처럼** 마주하는, **4개 언어** 인터랙티브 시네마틱 경험.

## 무엇을 만드는가
**선택지로 진행되지만 각 장면이 모션그래픽 영상처럼 재생되는**, 모바일·데스크톱 반응형 웹 경험(약 3~5분). **ko/en/zh/ja 4개 언어 전환 지원.** 외부 링크(GitHub Pages / Vercel)로 제출.

---

## 개발 / 빌드 / 배포 (구현)
> 스택: **Vite + TypeScript(strict) + GSAP** · 100% 정적 · 데이터 주도 씬 엔진 · i18n 키 기반(정본 ko).

```bash
npm install
npm run dev            # 개발 서버 (http://localhost:5173)
npm run build          # 타입체크 + dist/ 생성
npm run preview        # 빌드 미리보기
npm run check-locales  # 4개 로케일 키 일치 검사 (누락 0)
# 에셋 재생성: npm run extract-locales (TRANSLATIONS.md→locales) · npm run render-og (og.svg→og.png)
```

### 폴더 구조 (구현)
```
src/main.ts            # 부트스트랩 (i18n → 상단바 → 프리로더 → 씬 엔진)
src/engine/            # SceneEngine · state(단일 출처) · motion(reduced-motion 일원화)
src/scenes/            # 씬 모듈 (현재 demo*; Phase 2+에서 s0~s12로 확장)
src/components/        # TopBar(음소거+LangSwitcher) · Preloader …
src/i18n/ · src/locales/  # t()/setLocale · richText 안전 파서 · ko/en/zh/ja JSON
src/data/script.ts     # STORYBOARD 구조·분기 (키 참조)
src/styles/            # tokens.css(디자인 토큰) · base.css
public/                # 자작 SVG 파비콘 · og.png · CREDITS.md
```

### 배포 — GitHub Pages (GitHub Actions)
1. 새 GitHub 레포 생성 후 이 폴더를 push (기본 브랜치 `main`).
2. 레포 **Settings → Pages → Source = "GitHub Actions"** 선택.
3. push 시 `.github/workflows/deploy.yml`가 클라우드에서 `npm ci → check-locales → build` 후 Pages로 배포.
   `vite.config.ts`의 `base: './'` 덕분에 `https://<user>.github.io/<repo>/`에서 레포명과 무관하게 동작(로컬 Node 없어도 배포됨).

### 구현 진행 상태
- ✅ **Phase 0~7 전부 완료** — S0~S12 전체 경험 동작(ACT1 5결정 + 분기 3종 엔딩), 4개 언어, 사운드 합성, 접근성/성능 폴리시.
  - 0 셋업 · 0.5 메타/OG/프리로더 · 1 엔진/상태 · 1.5 i18n(ko/en/zh/ja)
  - 2 대시보드 · 3 ACT1 5결정 · 4 결산/리빌 · 5 2036 분기 3종 · 6 엔딩 · 7 사운드·접근성·성능
- 제출 전: `PROPOSAL_URL`(현재 빈 값→CTA 숨김)을 실제 제안서 링크로 교체.
- 접근성: OS reduced-motion 자동 대응 + `?reduce=1` 강제 토글, 키보드 진행, 기본 음소거.

코드 라이선스: [MIT](LICENSE). 에셋 출처: [`public/CREDITS.md`](public/CREDITS.md).

---

## 문서 지도
| 파일 | 무엇 | 누가 본다 |
|---|---|---|
| `PRD.md` | 제품 요구사항 (비전·목표·기능·제약·성공기준) | 전체 |
| `STORYBOARD.md` | **콘텐츠 정본(ko)** — 장면별 화면·모션·카피·**i18n 키**·분기 | 구현/카피 |
| `I18N.md` | **다국어 사양** — 로케일·언어별 폰트·전환 UX·텍스트 변동·톤 | 전체 |
| `TRANSLATIONS.md` | **4개 언어 전체 번역**(ko/en/zh/ja JSON, 모든 키) | 구현/번역 |
| `TECH_SPEC.md` | 아키텍처·스택·씬 엔진·i18n 구현·에셋·호스팅·(옵션)영상 | 개발 |
| `DESIGN_SYSTEM.md` | 색·언어별 타이포·모션·컴포넌트·사운드 | 디자인/개발 |
| `TASKS.md` | 단계별 구현 계획 + 단계별 완료 기준(DoD) | 개발 |
| `CLAUDE.md` | Claude Code 에이전트 운영 지침(절대 규칙·DoD) | 에이전트 |
| `KICKOFF_PROMPT.md` | **Claude Code에 그대로 붙여넣는 첫 지시문** | 핸드오프 |

## Claude Code에 넘기는 법
1. 이 폴더 전체를 새 레포 루트에 둔다 (`CLAUDE.md`가 루트에 있어야 함).
2. Claude Code에 **`KICKOFF_PROMPT.md`의 블록을 그대로 붙여넣는다**.
3. 콘텐츠 질문은 `STORYBOARD.md`+`TRANSLATIONS.md`, 다국어는 `I18N.md`, 디자인은 `DESIGN_SYSTEM.md`, 기술은 `TECH_SPEC.md`를 우선 참조.
4. 각 Phase 끝에서 **4개 언어 × 모바일/데스크톱** 동작 확인 후 다음 Phase로.

## 절대 규칙 (요약)
- **다국어:** 모든 UI 텍스트는 **키 기반**(하드코딩 금지). ko/en/zh/ja 4개 로케일, 언어별 폰트, 정본=ko(STORYBOARD), 번역=TRANSLATIONS.md.
- **저작권:** 외부 영상·음악·폰트·이미지·캐릭터 **금지**. CC0/OFL/자작 SVG·생성 에셋만. (공모전 '순수 창작물' 요건과 직결)
- **반응형:** 모바일 우선, 데스크톱 대응. `prefers-reduced-motion` 지원 필수. 텍스트 길이 변동에 깨지지 않는 레이아웃.
- **참고용 위치:** 심사는 1페이지 제안서 중심. 첫 화면/링크 상단에 "제안서와 함께 보세요" 명시.

## 산출물
- (필수) 정적 웹 빌드(4개 언어) → GitHub Pages / Vercel 링크 ('모든 사용자 열람 가능')
- (옵션) 약 60~90초 **MP4 트레일러**(언어별 또는 ko/en) → YouTube 링크
