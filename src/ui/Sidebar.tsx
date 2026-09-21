import { FlaskConical, Heart, Plus, Snowflake, Type } from 'lucide-react';
import { actions } from '../store';
import type { Pair } from '../model/types';

export function Sidebar({
  pairs,
  selectedId,
  onNew,
}: {
  pairs: Pair[];
  selectedId: number;
  onNew: () => void;
}) {
  return (
    <aside>
      <div className="brand">
        <div className="brand-mark"><FlaskConical size={17} /></div>
        <div>
          <b>Token Bench</b>
          <small>BREAKPOINT LAB</small>
        </div>
      </div>

      <div className="nav-section">
        <span>配对实验台</span>
        <div className="nav active"><Type size={15} />全部配对 <b>{pairs.length}</b></div>
        <div className="nav">
          <Heart size={15} />收藏 <b>{pairs.filter((p) => p.favorite).length}</b>
        </div>
        <div className="nav">
          <Snowflake size={15} />已冻结发布 <b>{pairs.filter((p) => p.published).length}</b>
        </div>
      </div>

      <div className="saved">
        <div className="saved-head">
          <span>PAIRINGS</span>
          <button onClick={onNew} aria-label="新建配对"><Plus size={14} /></button>
        </div>
        {pairs.map((p) => (
          <button
            key={p.id}
            className={selectedId === p.id ? 'pair-tab on' : 'pair-tab'}
            onClick={() => actions.select(p.id)}
          >
            <i className={p.published ? 'frozen' : 'draft'} title={p.published ? '已发布' : '草稿'} />
            <span>{p.title}</span>
            {p.published && <b>v{p.versions.length}</b>}
          </button>
        ))}
      </div>
    </aside>
  );
}
