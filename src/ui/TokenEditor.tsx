import { BREAKPOINTS, ELEMENTS, FONTS, METRICS } from '../model/constants';
import { formatValue, trendArrow } from '../model/tokens';
import { actions } from '../store';
import type { BreakpointId, ElementId, MetricId, Pair } from '../model/types';
import type { Violation } from '../validation';

type Key = `${ElementId}:${MetricId}:${BreakpointId}`;
const key = (e: ElementId, m: MetricId, b: BreakpointId): Key => `${e}:${m}:${b}`;

export function TokenEditor({
  pair,
  violations,
}: {
  pair: Pair;
  violations: Violation[];
}) {
  const { draft, id } = pair;

  // 命中冲突的单元格索引（跨断点规则会同时点亮涉及的列）
  const badCells = new Set<Key>();
  for (const v of violations) {
    if (!v.breakpoints.length) continue;
    for (const bp of v.breakpoints) badCells.add(key(v.element, v.metric, bp));
    if (v.rule === 'HEADING_MIN_BODY') {
      for (const bp of v.breakpoints) badCells.add(key('body', 'fontSize', bp));
    }
  }

  const edit = (bp: BreakpointId, el: ElementId, metric: MetricId, raw: string) => {
    actions.setToken(id, bp, el, metric, raw.trim() === '' ? null : Number(raw));
  };

  return (
    <div className="controls token-editor">
      <div className="control-head">
        <div>
          <span>断点令牌</span>
          <h3>桌面 · 平板 · 手机</h3>
        </div>
        <div className="legend">
          <span><i className="lg-arrow" />单调（允许持平）</span>
          <span><i className="lg-bad" />冲突单元格</span>
        </div>
      </div>

      <div className="font-row">
        <label>标题字体
          <select value={draft.fonts.heading} onChange={(e) => actions.setFont(id, 'heading', e.target.value)}>
            {FONTS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label>正文字体
          <select value={draft.fonts.body} onChange={(e) => actions.setFont(id, 'body', e.target.value)}>
            {FONTS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
      </div>

      <div className="token-table">
        <div className="tt-row tt-head">
          <div>元素 / 指标</div>
          {BREAKPOINTS.map((b) => (
            <div key={b.id}>
              <b>{b.label}</b>
              <small>≤{b.maxWidth}px</small>
            </div>
          ))}
        </div>

        {ELEMENTS.map((el) =>
          METRICS.map((metric, mi) => {
            const vals = BREAKPOINTS.map((b) => draft.tokens[b.id][el.id][metric.id]);
            const arrows = BREAKPOINTS.slice(0, 2).map((b, i) => {
              const a = vals[i];
              const c = vals[i + 1];
              if (a === null || c === null) return '';
              if (c < a) return '↙';
              if (c > a) return '↘';
              return '→';
            });
            return (
              <div className="tt-row" key={`${el.id}-${metric.id}`}>
                <div className="tt-label">
                  {mi === 0 && <b className={`tt-element ${el.id}`}>{el.label}</b>}
                  <span>{metric.label}</span>
                </div>
                {BREAKPOINTS.map((b, i) => (
                  <div className="tt-cell-wrap" key={b.id}>
                    {i > 0 && <em className={vals[i] === null || vals[i - 1] === null ? 'dim' : ''}>{arrows[i - 1]}</em>}
                    <input
                      className={badCells.has(key(el.id, metric.id, b.id)) ? 'tt-cell bad' : 'tt-cell'}
                      type="number"
                      min={metric.min}
                      max={metric.max}
                      step={metric.step}
                      value={vals[i] ?? ''}
                      placeholder="空"
                      onChange={(e) => edit(b.id, el.id, metric.id, e.target.value)}
                    />
                    <small className="tt-unit">{metric.unit || '×'} · {formatValue(metric.id, vals[i])}</small>
                  </div>
                ))}
              </div>
            );
          }),
        )}

        <div className="tt-hint">
          方向提示 <b>{trendArrow([
            draft.tokens.desktop.heading.fontSize,
            draft.tokens.tablet.heading.fontSize,
            draft.tokens.mobile.heading.fontSize,
          ])}</b>
          ：↙ 收窄、↘ 放宽、→ 持平。同项指标必须一路同向，先收后放（或先放后收）即冲突。
        </div>
      </div>
    </div>
  );
}
