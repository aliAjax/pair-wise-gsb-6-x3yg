import { useState } from 'react';
import { X } from 'lucide-react';
import { actions } from '../store';

export function NewPairModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const submit = () => {
    if (!title.trim()) return;
    actions.createPair(title);
    onClose();
  };
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-row">
          <h2>新建配对</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={15} /></button>
        </div>
        <label>配对名称
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="例如：Quiet confidence"
          />
        </label>
        <p className="modal-note">新配对从草稿模板开始，通过三条断点规则后才能发布冻结。</p>
        <div className="modal-actions">
          <button className="outline" onClick={onClose}>取消</button>
          <button className="primary" onClick={submit} disabled={!title.trim()}>创建草稿</button>
        </div>
      </div>
    </div>
  );
}
