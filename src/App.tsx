import { useState } from 'react';
import { CheckCircle2, FlaskConical, Plus, XCircle } from 'lucide-react';
import { actions, useBench } from './store';
import { NewPairModal } from './ui/NewPairModal';
import { Sidebar } from './ui/Sidebar';
import { Studio } from './ui/Studio';

export default function App() {
  const bench = useBench();
  const [showNew, setShowNew] = useState(false);
  const current = bench.pairs.find((p) => p.id === bench.selectedId) ?? bench.pairs[0];
  const violations = current ? bench.rejections[current.id] ?? [] : [];

  return (
    <div className="app bench-app">
      <Sidebar pairs={bench.pairs} selectedId={bench.selectedId} onNew={() => setShowNew(true)} />

      <main>
        <header>
          <div>
            <div className="crumb">TYPE LIBRARY / <b>BREAKPOINT TOKEN BENCH</b></div>
            <h1>在三个屏宽上实验你的配对。</h1>
            <p>每套配对分别维护桌面、平板、手机的字号、行高与字距；通过连续性、单调性与标题正文规则才能冻结发布。</p>
          </div>
          <div className="actions">
            <button className="primary" onClick={() => setShowNew(true)}><Plus size={15} />新建配对</button>
          </div>
        </header>

        {current ? (
          <Studio
            key={current.id}
            pair={current}
            violations={violations}
            onDismissReport={() => actions.dismissRejections(current.id)}
          />
        ) : (
          <div className="empty-state">
            <FlaskConical size={26} />
            <p>还没有配对，先新建一套草稿。</p>
            <button className="primary" onClick={() => setShowNew(true)}><Plus size={15} />新建配对</button>
          </div>
        )}
      </main>

      {showNew && <NewPairModal onClose={() => setShowNew(false)} />}

      {bench.notice && (
        <div className={`toast ${bench.notice.tone}`}>
          {bench.notice.tone === 'ok' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          <span>{bench.notice.text}</span>
        </div>
      )}
    </div>
  );
}
