/**
 * script.ts — STORYBOARD(S0~S12)의 구조·분기를 타입드 데이터로 미러.
 * 정본 카피는 보유하지 않는다(하드코딩 금지). 모든 텍스트는 **i18n 키**로 가리키고,
 * 렌더 시 t(key)로 해석한다. (TECH_SPEC §11/§12, I18N.md)
 *
 * 데이터 본체(DECISIONS 등)는 Phase 1에서 채운다. 이 파일은 타입·상수 스텁이다.
 */

export type Branch = 'tragedy' | 'nearmiss' | 'averted';
export type Pick = 'A' | 'B';

/** KPI 인덱스: 0=판독 처리량, 1=비용 절감, 2=AI 일치율, 3=환자 대기 */
export type KpiIndex = 0 | 1 | 2 | 3;

/** 선택지(키 참조). 정본 라벨은 locales에 있다. */
export interface Choice {
  /** 'efficient'(효율 우선·A) | 'preserve'(역량 보존·B) — ui.tag.* 키로 해석 */
  tag: 'efficient' | 'preserve';
  textKey: string; // 선택지 제목 키 (예: 's1.a.text')
  subKey: string; // 선택지 서브 키
  feedbackKey: string; // 선택 후 피드백 키
  efficient: boolean; // true=효율(A) / false=보존(B)
  kpi: KpiIndex; // 점등/호박 대상 KPI 인덱스
  killVbar?: boolean; // S4-A에서만 true (경보 꺼짐)
}

/** ACT1 결정 장면(S1~S5) */
export interface DecisionScene {
  id: 's1' | 's2' | 's3' | 's4' | 's5';
  metaKey: string;
  titleKey: string;
  bodyKey: string; // <em>/<gn>/<rd> 강조 허용
  a: Choice; // 효율(A)
  b: Choice; // 보존(B)
}

/** KPI 라벨 키 (ui.kpi.*) — 인덱스 정렬: 처리량/비용/일치율/대기 */
export const KPI_LABEL_KEYS = [
  'ui.kpi.throughput',
  'ui.kpi.cost',
  'ui.kpi.agreement',
  'ui.kpi.wait',
] as const;

/** S6 표시 수치 (STORYBOARD §분기로직): 운영효율 = 20 + eff*16, 비용 = 8 + eff*5 */
export const scoreEfficiency = (eff: number): number => 20 + eff * 16;
export const scoreCost = (eff: number): number => 8 + eff * 5;

/** 제출 직전 실제 제안서/노션 링크로 교체. 빈 문자열이면 CTA 버튼 숨김. */
export const PROPOSAL_URL = '';

/** 결정→KPI 매핑: 처리량=S1, 비용=S2, 일치율=S3, 잔여(환자대기)=S4·S5 (STORYBOARD §분기로직) */
function decision(
  id: DecisionScene['id'],
  kpi: KpiIndex,
  killVbar = false,
): DecisionScene {
  return {
    id,
    metaKey: `${id}.meta`,
    titleKey: `${id}.title`,
    bodyKey: `${id}.body`,
    a: {
      tag: 'efficient',
      textKey: `${id}.a.text`,
      subKey: `${id}.a.sub`,
      feedbackKey: `${id}.a.feedback`,
      efficient: true,
      kpi,
      ...(killVbar ? { killVbar: true } : {}),
    },
    b: {
      tag: 'preserve',
      textKey: `${id}.b.text`,
      subKey: `${id}.b.sub`,
      feedbackKey: `${id}.b.feedback`,
      efficient: false,
      kpi,
    },
  };
}

export const DECISIONS: DecisionScene[] = [
  decision('s1', 0),
  decision('s2', 1),
  decision('s3', 2),
  decision('s4', 3, true), // S4-A: 경보 꺼짐(vbarKilled)
  decision('s5', 3),
];

/** 분기별 엔딩 카피 키 (S9 본문/타이틀, S10 평결) — S9/S10 구현 시 사용 */
export const ENDING_KEYS: Record<Branch, { s9Title: string; s9Body: string; verdict: string }> = {
  tragedy: { s9Title: 's9.tragedy.title', s9Body: 's9.tragedy.body', verdict: 's10.verdict.tragedy' },
  nearmiss: { s9Title: 's9.nearmiss.title', s9Body: 's9.nearmiss.body', verdict: 's10.verdict.nearmiss' },
  averted: { s9Title: 's9.averted.title', s9Body: 's9.averted.body', verdict: 's10.verdict.averted' },
};
