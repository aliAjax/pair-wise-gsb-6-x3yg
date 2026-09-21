import { useState } from 'react';
import { Eye, GitBranch, History, RotateCcw, Snowflake, X } from 'lucide-react';
import { BREAKPOINTS, ELEMENTS, METRICS } from '../model/constants';
import { formatValue } from '../model/tokens';
import { actions } from '../store';
import type { Pair, Version } from '../model/types';

function VersionTable({ version }: { version: Version }) {
  return (
    <div className="token-table frozen-table">
      <div className="tt-row tt-head">
        <div>元素 / 指标</div>
        {BREAKPOINTS.map((b) => <div key={b.id}><b>{b.label}</b><small>≤{b.maxWidth}px</small></div>)}
      </div>
      {ELEMENTS.map((el) =>
        METRICS.map((metric, mi) => (
          <div className="tt-row static" key={`${el.id}-${metric.id}`}>
            <div className="tt-label">
              {mi === 0 && <b className={`tt-element ${el.id}`}>{el.label}</b>}
              <span>{metric.label}</span>
            </div>
            {BREAKPOINTS.map((b) => (
              <div className="tt-cell-wrap" key={b.id}>
                <span className="tt-static">{formatValue(metric.id, version.snapshot.tokens[b.id][el.id][metric.id])}</span>
              </div>
            ))}
          </div>
        )),
      )}
    </div>
  );
}

export function VersionViewer({
  pair,
  versionId,
  onClose,
}: {
  pair: Pair;
  versionId: number | null;
  onClose: () => void;
}) {
  const version = pair.versions.find((v) => v.id === versionId) ?? null;
  const [confirm, setConfirm] = useState(false);
  if (!version) return null;

  const restore = () => {
    actions.restoreVersion(pair.id, version.id);
    setConfirm(false);
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <div>
            <span className="v-seq"><Snowflake size={13} /> v{version.seq} · 冻结快照</span>
            <h2>{pair.title}</h2>
            <small>{new Date(version.createdAt).toLocaleString('zh-CN')} · {version.snapshot.fonts.heading} + {version.snapshot.fonts.body}</small>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={16} /></button>
        </div>

        <div className="v-reason"><GitBranch size={13} />发布原因：{version.reason}</div>
        <VersionTable version={version} />

        <div className="modal-actions restore-row">
          {!confirm ? (
            <>
              <button className="outline" onClick={onClose}>关闭</button>
              <button className="primary" onClick={() => setConfirm(true)}>
                <RotateCcw size={14} />恢复为草稿
              </button>
            </>
          ) : (
            <>
              <span className="confirm-text">恢复只覆盖当前草稿，发布版与修订链不变。确认？</span>
              <button className="outline" onClick={() => setConfirm(false)}>取消</button>
              <button className="primary" onClick={restore}>确认恢复 v{version.seq}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function VersionHistory({ pair, onOpen }: { pair: Pair; onOpen: (id: number) => void }) {
  return (
    <div className="history">
      <div className="history-head">
        <History size={14} />
        <b>修订链</b>
        <span>{pair.versions.length} 个冻结版本</span>
      </div>
      {pair.versions.length === 0 ? (
        <p className="history-empty">尚未发布。通过校验后发布，将在此冻结 v1 快照。</p>
      ) : (
        <ol className="v-list">
          {[...pair.versions].reverse().map((v) => {
            const isBase = pair.draft.baseVersionId === v.id;
            return (
              <li key={v.id} className={isBase ? 'v-item base' : 'v-item'}>
                <div className="v-dot"><Snowflake size={11} /></div>
                <div className="v-info">
                  <div className="v-line">
                    <b>v{v.seq}</b>
                    {isBase && <span className="v-base-tag">草稿基准</span>}
                    <small>{new Date(v.createdAt).toLocaleString('zh-CN')}</small>
                  </div>
                  <p>{v.reason}</p>
                </div>
                <button className="icon-btn" onClick={() => onOpen(v.id)} aria-label={`查看 v${v.seq}`}>
                  <Eye size={14} />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
