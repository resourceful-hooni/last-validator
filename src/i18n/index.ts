/**
 * i18n/index.ts — 로케일 로더 + t() 리졸버 + setLocale. (TECH_SPEC §12, I18N.md)
 *
 * - 지원: ko·en·zh·ja, 정본/폴백 = ko.
 * - 결정: ?lang= → localStorage('locale') → navigator.language(ko/zh/ja 접두 매칭, 그 외 en).
 * - 지연 로딩: 요청 로케일만 동적 import. ko는 폴백용으로 항상 로드.
 * - setLocale: 텍스트·<html lang>·폰트 교체, localStorage 저장, URL 동기화, 진행 상태 유지.
 */

export const SUPPORTED = ['ko', 'en', 'zh', 'ja'] as const;
export type Locale = (typeof SUPPORTED)[number];
export const DEFAULT_LOCALE: Locale = 'ko';
export const FALLBACK_LOCALE: Locale = 'ko';

/** 언어 자기표기 라벨 (LangSwitcher용) */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

/** og:locale 매핑 */
export const OG_LOCALE: Record<Locale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

type Dict = Record<string, string>;
const loaded: Partial<Record<Locale, Dict>> = {};
let current: Locale = DEFAULT_LOCALE;

const listeners = new Set<(loc: Locale) => void>();

export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (SUPPORTED as readonly string[]).includes(v);
}

/** 로케일 우선순위 결정 */
export function detectLocale(): Locale {
  const url = new URLSearchParams(window.location.search).get('lang');
  if (isLocale(url)) return url;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem('locale');
  } catch {
    /* private mode */
  }
  if (isLocale(stored)) return stored;

  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ja')) return 'ja';
  return 'en';
}

async function loadLocale(loc: Locale): Promise<Dict> {
  if (loaded[loc]) return loaded[loc] as Dict;
  // Vite는 템플릿 리터럴 동적 import를 glob으로 번들한다.
  const mod = (await import(`../locales/${loc}.json`)) as { default: Dict };
  loaded[loc] = mod.default;
  return mod.default;
}

/** 부팅: 폴백(ko) + 결정된 로케일 로드 후 적용 */
export async function initI18n(): Promise<Locale> {
  const loc = detectLocale();
  await loadLocale(FALLBACK_LOCALE);
  await setLocale(loc, { silent: true, skipPersist: false });
  return loc;
}

export function getLocale(): Locale {
  return current;
}

/** 로케일 전환. 텍스트·<html lang>·폰트 교체 + 저장 + URL 동기화. 구독자에게 통지. */
export async function setLocale(
  loc: Locale,
  opts: { silent?: boolean; skipPersist?: boolean } = {},
): Promise<void> {
  if (!isLocale(loc)) loc = FALLBACK_LOCALE;
  await loadLocale(loc);
  if (loc !== FALLBACK_LOCALE) await loadLocale(FALLBACK_LOCALE);
  current = loc;

  // <html lang> → tokens.css의 html[lang] 폰트/줄높이 토큰이 따라온다.
  document.documentElement.lang = loc;

  // 영속화
  if (!opts.skipPersist) {
    try {
      localStorage.setItem('locale', loc);
    } catch {
      /* noop */
    }
  }
  // URL 동기화 (히스토리 오염 없이)
  const u = new URL(window.location.href);
  u.searchParams.set('lang', loc);
  window.history.replaceState({}, '', u);

  // og:locale 갱신
  document
    .querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', OG_LOCALE[loc]);

  if (!opts.silent) listeners.forEach((cb) => cb(loc));
}

/** 키 해석 + {param} 보간. 누락 시 ko 폴백 + 콘솔 경고. */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = loaded[current];
  const fb = loaded[FALLBACK_LOCALE];
  let s = dict?.[key];
  if (s === undefined) {
    s = fb?.[key];
    if (s === undefined) {
      console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    if (current !== FALLBACK_LOCALE) console.warn(`[i18n] fallback(ko) for: ${key} (${current})`);
  }
  if (params) {
    s = s.replace(/\{(\w+)\}/g, (_, p: string) =>
      params[p] !== undefined ? String(params[p]) : `{${p}}`,
    );
  }
  return s;
}

/** 로케일 변경 구독 (UI 재렌더 트리거). 해제 함수 반환. */
export function onLocaleChange(cb: (loc: Locale) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 배포 origin 기반 hreflang/canonical 동적 주입 (정적 HTML에서 제거한 것 보강). */
export function injectAlternateLinks(): void {
  const head = document.head;
  const base = window.location.origin + window.location.pathname;
  const add = (rel: string, hreflang: string | null, href: string) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    link.href = href;
    head.appendChild(link);
  };
  add('canonical', null, `${base}?lang=${current}`);
  for (const loc of SUPPORTED) add('alternate', loc, `${base}?lang=${loc}`);
  add('alternate', 'x-default', base);
}
