import { Download, PenLine, RotateCcw, Send, Snowflake } from 'lucide-react';
import { downloadText, exportCss, isDirty } from '../model/tokens';
import { actions } from '../store';
import type { Pair } from '../model/types';

export function DraftDock({ pair }: { pair: Pair }) {
  const isRevision = pair.published !== null;
  const dirty = isDirty(pair);

  const exportSnapshot = () => {
    if (!pair.published) return;
    downloadText(
      `${pair.title.replace(/\s+/g, '-').toLowerCase()}-v${pair.versions.length}.css`,
      exportCss(pair.published, pair.title),
    );
  };

  return (
    <div className="dock">
      <div className="dock-status">
        {pair.published ? (
          <span className="chip frozen"><Snowflake size={12} />已发布 v{pair.versions.length}（冻结）</span>
        ) : (
          <span className="chip draft"><PenLine size={12} />未发布草稿</span>
        )}
        {dirty ? <span className="chip dirty">草稿有未发布改动</span> : <span className="chip clean">草稿与发布版一致</span>}
      </div>

      <div className="dock-reason">
        <label>
          {isRevision ? '修订原因（发布修订必填）' : '修订原因（首次发布后，再次调整时必填）'}
          <input
            value={pair.draft.revisionReason}
            disabled={!isRevision}
            placeholder={isRevision ? '例如：手机端标题收窄过多，行高放宽 0.05' : '首次发布无需填写'}
            onChange={(e) => actions.setReason(pair.id, e.target.value)}
          />
        </label>
      </div>

      <div className="dock-actions">
        <button className="outline" onClick={() => actions.resetDraft(pair.id)}>
          <RotateCcw size={13} />重置草稿
        </button>
        <button className="outline" onClick={exportSnapshot} disabled={!pair.published}>
          <Download size={13} />导出冻结 CSS
        </button>
        <button className="primary" onClick={() => actions.publish(pair.id)}>
          <Send size={13} />{isRevision ? '发布修订' : '发布 v1'}
        </button>
      </div>
    </div>
  );
}
