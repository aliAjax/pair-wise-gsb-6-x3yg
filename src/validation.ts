// 校验层：纯函数，无存储与界面依赖。草稿任意时刻可非法；仅发布前整体校验，
// 任一规则不过则整批拒绝（不发布、不冻结、草稿原样保留）。

import { BREAKPOINTS, ELEMENTS, METRICS } from './model/constants';
import type {
  BreakpointId,
  DraftState,
  ElementId,
  MetricId,
  RuleCode,
  Snapshot,
  TokenSet,
} from './model/types';

export interface Violation {
  rule: RuleCode;
  /** 命中的单元格坐标，供界面高亮；连续性缺口以外的规则可能跨断点 */
  element: ElementId;
  metric: MetricId;
  /** 涉及的断点：缺口为单个；反向为后两个；标题压正文为单个 */
  breakpoints: BreakpointId[];
  /** 旧值：已发布基准值序列或单值；从未发布时为 null */
  oldValues: (number | null)[] | null;
  /** 新值：草稿当前值序列或单值；缺口位置为 null */
  newValues: (number | null)[];
  /** 对照旧值：标题压正文时为正文旧值，其余场景为空 */
  oldCompareValues?: (number | null)[] | null;
  message: string;
  ruleLabel: string;
}

export const RULE_LABELS: Record<RuleCode, string> = {
  CONTINUITY: '断点顺序连续',
  NO_REVERSE: '同项指标随屏宽收窄不得反向',
  HEADING_MIN_BODY: '标题字号不得小于正文',
  REASON_REQUIRED: '修订需填写原因',
};

export const metricLabel = (id: MetricId): string =>
  METRICS.find((m) => m.id === id)?.label ?? id;
export const elementLabel = (id: ElementId): string =>
  ELEMENTS.find((e) => e.id === id)?.label ?? id;
export const breakpointLabel = (id: BreakpointId): string =>
  BREAKPOINTS.find((b) => b.id === id)?.label ?? id;

const fmt = (v: number | null, metric: MetricId): string => {
  if (v === null) return '（空）';
  const def = METRICS.find((x) => x.id === metric)!;
  return `${v.toFixed(def.decimals)}${def.unit}`;
};

/** 连续性：三个断点缺一不可（断点顺序由固定列保证，缺口即顺序断裂） */
function checkContinuity(tokens: TokenSet): Violation[] {
  const out: Violation[] = [];
  for (const el of ELEMENTS) {
    for (const bp of BREAKPOINTS) {
      for (const metric of METRICS) {
        const v = tokens[bp.id][el.id][metric.id];
        if (v === null || Number.isNaN(v)) {
          out.push({
            rule: 'CONTINUITY',
            element: el.id,
            metric: metric.id,
            breakpoints: [bp.id],
            oldValues: null,
            newValues: [null],
            ruleLabel: RULE_LABELS.CONTINUITY,
            message: `${breakpointLabel(bp.id)} · ${elementLabel(el.id)}「${metric.label}」缺项：桌面 / 平板 / 手机必须连续，不得留空。`,
          });
        }
      }
    }
  }
  return out;
}

/**
 * 不得反向：对每个「元素 × 指标」，沿 桌面→平板→手机 的三段序列必须
 * 单调（一路收窄或一路放宽，允许持平）。先降后升 / 先升后降即为反向。
 */
function checkNoReverse(tokens: TokenSet): Violation[] {
  const out: Violation[] = [];
  const seq = BREAKPOINTS.map((b) => b.id);
  for (const el of ELEMENTS) {
    for (const metric of METRICS) {
      const vals = seq.map((bp) => tokens[bp][el.id][metric.id]);
      if (vals.some((v) => v === null || Number.isNaN(v))) continue; // 连续性规则已报
      const numbers = vals as number[];
      const d1 = numbers[1] - numbers[0];
      const d2 = numbers[2] - numbers[1];
      if (d1 * d2 < 0) {
        out.push({
          rule: 'NO_REVERSE',
          element: el.id,
          metric: metric.id,
          breakpoints: ['tablet', 'mobile'],
          oldValues: null,
          newValues: numbers,
          ruleLabel: RULE_LABELS.NO_REVERSE,
          message:
            `${elementLabel(el.id)}「${metric.label}」从 ${fmt(numbers[0], metric.id)} → ${fmt(numbers[1], metric.id)} → ${fmt(numbers[2], metric.id)}：` +
            `${d1 < 0 ? '先收窄后放宽' : '先放宽后收窄'}，屏宽收窄过程中出现反向。`,
        });
      }
    }
  }
  return out;
}

/** 标题字号不得小于正文（逐断点） */
function checkHeadingMinBody(tokens: TokenSet): Violation[] {
  const out: Violation[] = [];
  for (const bp of BREAKPOINTS) {
    const h = tokens[bp.id].heading.fontSize;
    const b = tokens[bp.id].body.fontSize;
    if (h === null || b === null || Number.isNaN(h) || Number.isNaN(b)) continue;
    if (h < b) {
      out.push({
        rule: 'HEADING_MIN_BODY',
        element: 'heading',
        metric: 'fontSize',
        breakpoints: [bp.id],
        oldValues: null,
        newValues: [h, b],
        ruleLabel: RULE_LABELS.HEADING_MIN_BODY,
        message: `${breakpointLabel(bp.id)}：标题字号 ${h}px 小于正文 ${b}px。`,
      });
    }
  }
  return out;
}

/** 发布修订时必须填写原因；首次发布不需要 */
export function checkReason(draft: DraftState): Violation[] {
  if (draft.baseVersionId !== null && !draft.revisionReason.trim()) {
    return [
      {
        rule: 'REASON_REQUIRED',
        element: 'heading',
        metric: 'fontSize',
        breakpoints: [],
        oldValues: null,
        newValues: [],
        ruleLabel: RULE_LABELS.REASON_REQUIRED,
        message: '已发布过的配对进行修订，必须先填写「修订原因」才能再次发布。',
      },
    ];
  }
  return [];
}

export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
}

/** 发布前整体校验：返回全部命中项，供逐项提示旧值 / 新值 / 规则 */
export function validateDraft(draft: DraftState): ValidationResult {
  const violations = [
    ...checkContinuity(draft.tokens),
    ...checkNoReverse(draft.tokens),
    ...checkHeadingMinBody(draft.tokens),
  ];
  return { ok: violations.length === 0, violations };
}

/**
 * 用已发布快照回填旧值，使拒绝提示逐项呈现「旧值 → 新值 · 规则」。
 * 首次发布（无快照）时旧值为空。
 */
export function withBaseline(result: ValidationResult, baseline: Snapshot | null): Violation[] {
  if (!baseline) return result.violations;
  return result.violations.map((v) => {
    const oldValues = v.breakpoints.length
      ? v.breakpoints.map((bp) => baseline.tokens[bp][v.element][v.metric])
      : null;
    let oldCompareValues: (number | null)[] | null | undefined;
    if (v.rule === 'HEADING_MIN_BODY') {
      oldCompareValues = v.breakpoints.map((bp) => baseline.tokens[bp].body[v.metric]);
    }
    return { ...v, oldValues, oldCompareValues };
  });
}

/** 发布整体校验（含修订原因守卫与旧值回填），数据层据此决定整批拒绝或冻结 */
export function validateForPublish(
  draft: DraftState,
  baseline: Snapshot | null,
): Violation[] {
  const reasonViolations = checkReason(draft);
  const result = validateDraft(draft);
  return [...withBaseline(result, baseline), ...reasonViolations];
}
