// 模型层：令牌展示 / 比较 / CSS 导出的纯函数工具

import { BREAKPOINTS, METRICS } from './constants';
import type { DraftState, MetricId, Pair, Snapshot } from './types';

export function formatValue(metric: MetricId, v: number | null): string {
  const def = METRICS.find((m) => m.id === metric)!;
  if (v === null || Number.isNaN(v)) return '—';
  return `${v.toFixed(def.decimals)}${def.unit}`;
}

/** 沿 桌面→平板→手机 的方向：1 放宽 / -1 收窄 / 0 持平 / null 缺项 */
export function trendArrow(values: (number | null)[]): string {
  if (values.some((v) => v === null)) return '';
  const nums = values as number[];
  if (nums[1] > nums[0] || nums[2] > nums[1]) return '↘';
  if (nums[1] < nums[0] || nums[2] < nums[1]) return '↙';
  return '→';
}

function fontsEqual(a: DraftState['fonts'], b: DraftState['fonts']): boolean {
  return a.heading === b.heading && a.body === b.body;
}

function tokensEqual(a: DraftState['tokens'], b: DraftState['tokens']): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 草稿相对其派生版本（无发布版时相对初始模板）是否有未发布改动 */
export function isDirty(pair: Pair): boolean {
  if (!pair.published) return true; // 从未发布的配对，草稿天然待发布
  const base = pair.versions.find((v) => v.id === pair.draft.baseVersionId)?.snapshot ?? pair.published;
  return !fontsEqual(pair.draft.fonts, base.fonts) || !tokensEqual(pair.draft.tokens, base.tokens);
}

export function draftBaseline(pair: Pair): Snapshot | null {
  return (
    pair.versions.find((v) => v.id === pair.draft.baseVersionId)?.snapshot ??
    pair.published ??
    null
  );
}

function ruleLines(snapshot: Snapshot, bpId: 'desktop' | 'tablet' | 'mobile', indent: string): string {
  const t = snapshot.tokens[bpId];
  return [
    `${indent}.heading { font-family: '${snapshot.fonts.heading}'; font-size: ${t.heading.fontSize}px; line-height: ${t.heading.lineHeight}; letter-spacing: ${t.heading.letterSpacing}px; }`,
    `${indent}.body    { font-family: '${snapshot.fonts.body}'; font-size: ${t.body.fontSize}px; line-height: ${t.body.lineHeight}; letter-spacing: ${t.body.letterSpacing}px; }`,
  ].join('\n');
}

export function exportCss(snapshot: Snapshot, title: string): string {
  const [, t, m] = BREAKPOINTS;
  return [
    `/* ${title} · 断点令牌快照 · ${new Date().toISOString()} */`,
    '/* 桌面：默认规则（无媒体查询，作为基准层） */',
    ruleLines(snapshot, 'desktop', ''),
    `@media (max-width: ${t.maxWidth}px) {\n${ruleLines(snapshot, 'tablet', '  ')}\n}`,
    `@media (max-width: ${m.maxWidth}px) {\n${ruleLines(snapshot, 'mobile', '  ')}\n}`,
  ].join('\n\n');
}

export function downloadText(filename: string, text: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/css' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
