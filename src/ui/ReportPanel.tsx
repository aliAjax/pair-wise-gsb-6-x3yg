import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { METRICS } from '../model/constants';
import type { Violation } from '../validation';

function vals(vs: (number | null)[] | null | undefined, metric?: (typeof METRICS)[number]): string {
  if (!vs || vs.length === 0) return '—';
  return vs
    .map((v) => {
      if (v === null) return '（空）';
      return metric ? `${v.toFixed(metric.decimals)}${metric.unit}` : String(v);
    })
    .join(' → ');
}

export function ReportPanel({
  violations,
  onDismiss,
}: {
  violations: Violation[];
  onDismiss: () => void;
}) {
  if (violations.length === 0) return null;
  return (
    <div className="report">
      <div className="report-head">
        <div>
          <ShieldAlert size={15} />
          <b>整批拒绝 · {violations.length} 项冲突</b>
        </div>
        <button onClick={onDismiss} aria-label="关闭"><X size={14} /></button>
      </div>
      <p className="report-sub">草稿原样保留，未发布、未冻结。逐项对照旧值与新值修正后再发布：</p>
      <ul>
        {violations.map((v, i) => {
          const metric = METRICS.find((m) => m.id === v.metric);
          return (
            <li key={i}>
              <AlertTriangle size={13} className="li-icon" />
              <div className="li-body">
                <div className="li-rule"><span>{v.ruleLabel}</span></div>
                <p>{v.message}</p>
                <div className="li-diff">
                  <span className="old">旧值（已发布）：{vals(v.oldValues, metric)}</span>
                  <span className="new">新值（草稿）：{vals(v.newValues, metric)}</span>
                  {v.oldCompareValues !== undefined && (
                    <span className="old">对照正文旧值：{vals(v.oldCompareValues, metric)}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
