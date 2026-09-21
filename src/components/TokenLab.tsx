import {useState} from 'react';
import {AlertTriangle, Eye, History, Lock, RotateCcw} from 'lucide-react';
import {BREAKPOINTS, BP_LABEL, METRICS, METRIC_LABEL, METRIC_UNIT, ROLES, ROLE_LABEL} from '../lab/types';
import type {Breakpoint, Metric, PublishedEntry, RevisionEntry, Role, TokenSet} from '../lab/types';
import {RULE_TEXT} from '../lab/validate';
import type {Violation} from '../lab/validate';
import {latestVersion} from '../lab/store';

interface Props {
  tokens: TokenSet;
  published?: PublishedEntry;
  revisions: RevisionEntry[];
  violations: Violation[];
  notice: string;
  onChange: (tokens: TokenSet) => void;
  onPublish: (reason: string) => void;
  onRestore: (version: number) => void;
  onDismissViolations: () => void;
}

const METRIC_INPUT: Record<Metric, {min: number; max: number; step: number}> = {
  fontSize: {min: 10, max: 96, step: 1},
  lineHeight: {min: 0.8, max: 2.4, step: 0.05},
  letterSpacing: {min: -2, max: 6, step: 0.1},
};

const fmt = (metric: Metric, value: number | string) =>
  typeof value === 'number' ? `${value}${METRIC_UNIT[metric]}` : value;

function TokenTable({tokens, onMetric}: {tokens: TokenSet; onMetric?: (bp: Breakpoint, role: Role, metric: Metric, value: number) => void}) {
  const readOnly = !onMetric;
  return (
    <table className="token-grid">
      <thead>
        <tr>
          <th>Token</th>
          {BREAKPOINTS.map(bp => <th key={bp}>{BP_LABEL[bp]}</th>)}
        </tr>
      </thead>
      <tbody>
        {ROLES.map(role => (
          METRICS.map((metric, i) => (
            <tr key={`${role}-${metric}`}>
              <td>
                {i === 0 && <span className={`role-tag ${role}`}>{ROLE_LABEL[role]}</span>}
                {METRIC_LABEL[metric]}
              </td>
              {BREAKPOINTS.map(bp => (
                <td key={bp}>
                  {readOnly ? (
                    <span className="token-value">{fmt(metric, tokens[bp][role][metric])}</span>
                  ) : (
                    <input
                      type="number"
                      min={METRIC_INPUT[metric].min}
                      max={METRIC_INPUT[metric].max}
                      step={METRIC_INPUT[metric].step}
                      value={tokens[bp][role][metric]}
                      onChange={e => onMetric(bp, role, metric, Number(e.target.value))}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))
        ))}
      </tbody>
    </table>
  );
}

export default function TokenLab(props: Props) {
  const [reason, setReason] = useState('');
  const [viewing, setViewing] = useState<number | null>(null);
  const current = latestVersion(props.published);
  const versions = props.published?.versions ?? [];
  const viewingVersion = versions.find(v => v.version === viewing) ?? null;

  const setMetric = (bp: Breakpoint, role: Role, metric: Metric, value: number) => {
    props.onChange({...props.tokens, [bp]: {...props.tokens[bp], [role]: {...props.tokens[bp][role], [metric]: value}}});
  };

  const publish = () => {
    props.onPublish(reason);
    setReason('');
  };

  return (
    <div className="lab">
      <div className="lab-head">
        <div>
          <span>BREAKPOINT TOKENS</span>
          <h3>Token lab</h3>
        </div>
        <div className="lab-status">
          {current ? <span className="pill live"><Lock size={10}/> v{current.version} live · frozen</span> : <span className="pill">Unpublished draft</span>}
        </div>
      </div>

      <TokenTable tokens={props.tokens} onMetric={setMetric}/>

      {props.violations.length > 0 && (
        <div className="violations">
          <div className="violations-head">
            <AlertTriangle size={14}/>
            <b>Batch rejected — {props.violations.length} conflict{props.violations.length > 1 ? 's' : ''}. Draft kept as is.</b>
            <button onClick={props.onDismissViolations}>Dismiss</button>
          </div>
          {props.violations.map((v, i) => (
            <div className="violation" key={i}>
              <div className="violation-loc">
                <span className="rule-tag">{v.rule}</span>
                {BP_LABEL[v.breakpoint]} · {ROLE_LABEL[v.role]} · {METRIC_LABEL[v.metric]}
              </div>
              <div className="violation-values">
                <span>was <b>{fmt(v.metric, v.oldValue)}</b></span>
                <span className="arrow">→</span>
                <span>now <b>{fmt(v.metric, v.newValue)}</b></span>
              </div>
              <p>{RULE_TEXT[v.rule]}</p>
            </div>
          ))}
        </div>
      )}

      {props.notice && <p className="lab-notice">{props.notice}</p>}

      <div className="publish-row">
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={current ? 'Revision reason (required)…' : 'Release note (optional for v1)…'}
        />
        <button className="primary" onClick={publish}>
          {current ? `Publish revision v${current.version + 1}` : 'Publish v1'}
        </button>
      </div>

      {versions.length > 0 && (
        <div className="lab-block">
          <div className="lab-block-head"><Lock size={12}/><span>FROZEN SNAPSHOTS</span></div>
          {[...versions].reverse().map(v => (
            <div className="version-row" key={v.version}>
              <b>v{v.version}</b>
              <span>{new Date(v.publishedAt).toLocaleString()}</span>
              {v.version === current?.version && <em>live</em>}
              <div className="version-actions">
                <button onClick={() => setViewing(v.version)}><Eye size={12}/> View</button>
                <button onClick={() => props.onRestore(v.version)}><RotateCcw size={12}/> Restore as draft</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {props.revisions.length > 0 && (
        <div className="lab-block">
          <div className="lab-block-head"><History size={12}/><span>REVISION CHAIN</span></div>
          {[...props.revisions].reverse().map(r => (
            <div className="revision-row" key={r.id}>
              <b>v{r.fromVersion} → v{r.toVersion}</b>
              <span className="revision-reason">{r.reason}</span>
              <span className="revision-date">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {viewingVersion && (
        <div className="backdrop" onClick={() => setViewing(null)}>
          <div className="modal version-modal" onClick={e => e.stopPropagation()}>
            <h2>Snapshot v{viewingVersion.version} <small>read-only</small></h2>
            <TokenTable tokens={viewingVersion.tokens}/>
            <div className="modal-actions">
              <button className="outline" onClick={() => setViewing(null)}>Close</button>
              <button className="primary" onClick={() => {props.onRestore(viewingVersion.version); setViewing(null);}}>
                <RotateCcw size={13}/> Restore as draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
