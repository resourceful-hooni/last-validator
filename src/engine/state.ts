/**
 * state.ts — 단일 출처(single source of truth). (TECH_SPEC §4, STORYBOARD §분기로직)
 *
 * 규칙:
 *   시작: vCap=100, eff=0, greens=[F,F,F,F], vbarKilled=false
 *   효율(A): eff++, vCap = max(0, vCap-20), 해당 KPI 초록; S4-A면 4개 전부 초록 + vbarKilled=true
 *   보존(B): vCap 유지, 해당 KPI 호박
 *   결말: vCap<35 tragedy / 35~69 nearmiss / >=70 averted
 */
import type { Branch, Choice, KpiIndex, Pick } from '../data/script';

export type KpiStatus = 'neutral' | 'green' | 'amber';

class GameState {
  vCap = 100;
  eff = 0;
  greens: boolean[] = [false, false, false, false];
  ambers: boolean[] = [false, false, false, false];
  vbarKilled = false;
  /** 결정별 선택 기록 (리플레이/역추적 참조용) */
  readonly picks: Partial<Record<string, Pick>> = {};

  /**
   * 선택 적용. decisionId는 's1'~'s5', choice는 선택된 분기 데이터.
   * S4 효율 선택은 남은 KPI까지 일괄 초록(올 초록 연출)으로 처리한다.
   */
  applyChoice(decisionId: string, pick: Pick, choice: Choice): void {
    this.picks[decisionId] = pick;
    if (choice.efficient) {
      this.eff += 1;
      this.vCap = Math.max(0, this.vCap - 20);
      this.greens[choice.kpi] = true;
      this.ambers[choice.kpi] = false;
      if (decisionId === 's4') {
        // S4-A: 남은 KPI까지 전부 초록 (만족의 정점)
        this.greens = [true, true, true, true];
        this.ambers = [false, false, false, false];
      }
      if (choice.killVbar) this.vbarKilled = true;
    } else {
      // 보존(B): vCap 유지, 해당 KPI 호박
      if (!this.greens[choice.kpi]) this.ambers[choice.kpi] = true;
    }
  }

  kpiStatus(i: KpiIndex): KpiStatus {
    if (this.greens[i]) return 'green';
    if (this.ambers[i]) return 'amber';
    return 'neutral';
  }

  endingBranch(): Branch {
    return this.vCap < 35 ? 'tragedy' : this.vCap < 70 ? 'nearmiss' : 'averted';
  }

  /** 리플레이 — 완전 초기화 */
  reset(): void {
    this.vCap = 100;
    this.eff = 0;
    this.greens = [false, false, false, false];
    this.ambers = [false, false, false, false];
    this.vbarKilled = false;
    for (const k of Object.keys(this.picks)) delete this.picks[k];
  }
}

/** 전역 단일 인스턴스 */
export const state = new GameState();
