import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { actions } from '../store';
import type { BreakpointId, Pair } from '../model/types';
import type { Violation } from '../validation';
import { DraftDock } from './DraftDock';
import { PreviewFrame } from './PreviewFrame';
import { ReportPanel } from './ReportPanel';
import { TokenEditor } from './TokenEditor';
import { VersionHistory, VersionViewer } from './VersionHistory';

export function Studio({
  pair,
  violations,
  onDismissReport,
}: {
  pair: Pair;
  violations: Violation[];
  onDismissReport: () => void;
}) {
  const [bp, setBp] = useState<BreakpointId>('desktop');
  const [openVersion, setOpenVersion] = useState<number | null>(null);

  return (
    <section className="studio">
      <div className="studio-head">
        <div>
          <span>配对实验台</span>
          <input
            className="title-input"
            value={pair.title}
            onChange={(e) => actions.renamePair(pair.id, e.target.value)}
          />
          <div className="meta-edit">
            <input
              value={pair.heading}
              onChange={(e) => actions.setCopy(pair.id, { heading: e.target.value })}
              title="预览标题文案"
            />
            <input
              value={pair.category}
              onChange={(e) => actions.setCopy(pair.id, { category: e.target.value })}
              title="分类"
            />
          </div>
        </div>
        <div className="head-btns">
          <button className="favorite" onClick={() => actions.toggleFavorite(pair.id)}>
            <Star size={16} fill={pair.favorite ? '#e5a35e' : 'none'} color={pair.favorite ? '#e5a35e' : '#98a4a7'} />
          </button>
          <button className="delete" onClick={() => actions.deletePair(pair.id)}>
            <Trash2 size={14} /> 删除配对
          </button>
        </div>
      </div>

      <div className="bench-grid">
        <div className="bench-main">
          <PreviewFrame meta={pair} draft={pair.draft} active={bp} onSelect={setBp} />
          <ReportPanel violations={violations} onDismiss={onDismissReport} />
          <TokenEditor pair={pair} violations={violations} />
          <DraftDock pair={pair} />
        </div>
        <div className="bench-side">
          <VersionHistory pair={pair} onOpen={setOpenVersion} />
          <div className="rules-card">
            <b>发布前三条规则</b>
            <ol>
              <li><i>连续</i>桌面 / 平板 / 手机 18 个令牌不得缺项。</li>
              <li><i>不反向</i>同项指标沿屏宽收窄须一路同向（允许持平）。</li>
              <li><i>标题 ≥ 正文</i>每个断点标题字号不得小于正文。</li>
            </ol>
            <p>任一不过即整批拒绝，草稿保留并逐项列出旧值、新值与规则。</p>
          </div>
        </div>
      </div>

      <VersionViewer pair={pair} versionId={openVersion} onClose={() => setOpenVersion(null)} />
    </section>
  );
}
