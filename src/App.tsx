import {useEffect, useState} from 'react';
import {BookOpen, ChevronDown, Download, Grid3X3, Heart, Plus, Settings2, SlidersHorizontal, Star, Trash2, Type} from 'lucide-react';
import {BREAKPOINTS, BP_LABEL} from './lab/types';
import type {Breakpoint} from './lab/types';
import {useLabStore} from './lab/useLabStore';
import type {Violation} from './lab/validate';
import TokenLab from './components/TokenLab';

type Pair = {id: number; title: string; heading: string; body: string; category: string; favorite: boolean};

const fonts = ['Fraunces', 'DM Sans', 'Space Grotesk', 'Newsreader', 'IBM Plex Sans', 'Playfair Display'];
const seed: Pair[] = [
  {id: 1, title: 'Editorial calm', heading: 'A slower way to see', body: 'Good typography creates space for ideas to breathe. Pair a confident display face with a quiet, generous text face.', category: 'Editorial', favorite: true},
  {id: 2, title: 'Studio notes', heading: 'Make room for the unexpected', body: 'A thoughtful pairing can add rhythm to even the simplest interface. Try contrast in shape, not just size.', category: 'Portfolio', favorite: false},
  {id: 3, title: 'Field guide', heading: 'Small details, lasting impressions', body: 'Typography is the voice of a page. Find a combination that feels clear, warm and distinctly yours.', category: 'Brand', favorite: false},
];

const BP_WIDTH: Record<Breakpoint, string> = {desktop: '100%', tablet: '76%', mobile: '48%'};
const BP_MEDIA: Record<Breakpoint, number | null> = {desktop: null, tablet: 1024, mobile: 640};

export default function App() {
  const [pairs, setPairs] = useState<Pair[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('type-pairs') || '') || seed;
    } catch {
      return seed;
    }
  });
  const [selected, setSelected] = useState(1);
  const [headingFont, setHeadingFont] = useState('Fraunces');
  const [bodyFont, setBodyFont] = useState('DM Sans');
  const [weight, setWeight] = useState(600);
  const [bp, setBp] = useState<Breakpoint>('desktop');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [notice, setNotice] = useState('');
  const lab = useLabStore();

  const current = pairs.find(p => p.id === selected) || pairs[0];
  const tokens = lab.getTokens(current.id);
  const live = tokens[bp];

  useEffect(() => localStorage.setItem('type-pairs', JSON.stringify(pairs)), [pairs]);
  useEffect(() => {
    setViolations([]);
    setNotice('');
  }, [selected]);

  const create = () => {
    if (!newTitle.trim()) return;
    const id = Date.now();
    setPairs(ps => [...ps, {id, title: newTitle.trim(), heading: 'Your new headline', body: 'Start with a sentence that lets your type pairing show its character.', category: 'Untitled', favorite: false}]);
    setSelected(id);
    setNewTitle('');
    setShowAdd(false);
  };

  const toggleFav = () => setPairs(ps => ps.map(p => (p.id === selected ? {...p, favorite: !p.favorite} : p)));

  const publish = (reason: string) => {
    const res = lab.publish(current.id, reason);
    if (res.ok) {
      setViolations([]);
      setNotice(`Published v${res.version} — snapshot frozen.`);
    } else if ('reasonRequired' in res) {
      setViolations([]);
      setNotice('A reason is required to revise a published pairing.');
    } else {
      setViolations(res.violations);
      setNotice('');
    }
  };

  const restore = (version: number) => {
    if (lab.restoreAsDraft(current.id, version)) {
      setViolations([]);
      setNotice(`v${version} restored into the draft — publish to make it live.`);
    }
  };

  const exportCss = () => {
    const css = BREAKPOINTS.map(b => {
      const t = tokens[b];
      const rules = `.heading { font-family: '${headingFont}'; font-size: ${t.heading.fontSize}px; font-weight: ${weight}; line-height: ${t.heading.lineHeight}; letter-spacing: ${t.heading.letterSpacing}px; }\n.body { font-family: '${bodyFont}'; font-size: ${t.body.fontSize}px; line-height: ${t.body.lineHeight}; letter-spacing: ${t.body.letterSpacing}px; }`;
      const mq = BP_MEDIA[b];
      return mq ? `@media (max-width: ${mq}px) {\n${rules}\n}` : rules;
    }).join('\n\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`/* ${current.title} — breakpoint tokens */\n${css}\n`], {type: 'text/css'}));
    a.download = 'type-tokens.css';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="app">
      <aside>
        <div className="brand"><div className="brand-mark"><Type size={18}/></div><div><b>Type Pairer</b><small>FIND YOUR VOICE</small></div></div>
        <div className="nav-section">
          <span>LIBRARY</span>
          <button className="nav active"><Grid3X3 size={16}/>All pairings <b>{pairs.length}</b></button>
          <button className="nav"><Heart size={16}/>Favorites <b>{pairs.filter(p => p.favorite).length}</b></button>
        </div>
        <div className="saved">
          <div className="saved-head"><span>COLLECTIONS</span><button onClick={() => setShowAdd(true)}><Plus size={14}/></button></div>
          <button className="collection"><i style={{background: '#e8b7a0'}}/>Editorial <b>4</b></button>
          <button className="collection"><i style={{background: '#9fc9be'}}/>Portfolio <b>3</b></button>
          <button className="collection"><i style={{background: '#b4add8'}}/>Brand voice <b>5</b></button>
        </div>
        <div className="aside-foot">
          <button className="nav"><Settings2 size={16}/>Preferences</button>
          <div className="profile"><div className="avatar">YL</div><div><b>Yuki Lin</b><small>Design workspace</small></div><ChevronDown size={14}/></div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <div className="crumb">TYPE LIBRARY / <b>PAIRING STUDIO</b></div>
            <h1>Find the right conversation.</h1>
            <p>Explore combinations, tune the details, and save what feels like you.</p>
          </div>
          <div className="actions">
            <button className="outline" onClick={exportCss}><Download size={15}/>Copy CSS</button>
            <button className="primary" onClick={() => setShowAdd(true)}><Plus size={16}/>New pairing</button>
          </div>
        </header>
        <div className="layout">
          <section className="gallery">
            <div className="gallery-head">
              <div><h2>Saved pairings</h2><span>{pairs.length} compositions</span></div>
              <div className="view-toggle"><button className="on"><Grid3X3 size={14}/></button><button><BookOpen size={14}/></button></div>
            </div>
            <div className="pair-list">
              {pairs.map(p => (
                <button key={p.id} className={selected === p.id ? 'pair selected' : 'pair'} onClick={() => setSelected(p.id)}>
                  <div className="pair-top"><span>{p.category}</span><Heart size={15} fill={p.favorite ? '#e88769' : 'none'} color={p.favorite ? '#e88769' : '#aeb5b7'}/></div>
                  <strong style={{fontFamily: p.id === 1 ? 'Fraunces' : 'Georgia'}}>{p.heading}</strong>
                  <p style={{fontFamily: p.id === 1 ? 'DM Sans' : 'Arial'}}>{p.body}</p>
                  <div className="pair-foot"><span>{p.title}</span><small>Open canvas →</small></div>
                </button>
              ))}
            </div>
          </section>
          <section className="studio">
            <div className="studio-head">
              <div><span>PAIRING CANVAS</span><h2>{current.title}</h2></div>
              <button className="favorite" onClick={toggleFav}><Star size={16} fill={current.favorite ? '#e5a35e' : 'none'} color={current.favorite ? '#e5a35e' : '#98a4a7'}/></button>
            </div>
            <div className="canvas">
              <div className="canvas-bar">
                <span>PREVIEW · {BP_LABEL[bp].toUpperCase()}</span>
                <div>
                  {BREAKPOINTS.map(b => (
                    <button key={b} className={bp === b ? 'on' : ''} onClick={() => setBp(b)}>{BP_LABEL[b]}</button>
                  ))}
                </div>
              </div>
              <div className="preview" style={{maxWidth: BP_WIDTH[bp]}}>
                <span className="preview-kicker">A NOTE ON TYPE</span>
                <h3 style={{fontFamily: headingFont, fontSize: `${live.heading.fontSize}px`, fontWeight: weight, letterSpacing: `${live.heading.letterSpacing}px`, lineHeight: live.heading.lineHeight}}>{current.heading}</h3>
                <p style={{fontFamily: bodyFont, fontSize: `${live.body.fontSize}px`, lineHeight: live.body.lineHeight, letterSpacing: `${live.body.letterSpacing}px`}}>{current.body}</p>
                <div className="preview-rule"/>
                <span className="preview-meta">PAIRING 0{current.id} · {current.category.toUpperCase()}</span>
              </div>
            </div>
            <div className="controls">
              <div className="control-head">
                <div><span>TYPE CONTROLS</span><h3>Fine tune your pairing</h3></div>
                <SlidersHorizontal size={17}/>
              </div>
              <div className="font-row">
                <label>Heading font<select value={headingFont} onChange={e => setHeadingFont(e.target.value)}>{fonts.map(f => <option key={f}>{f}</option>)}</select></label>
                <label>Body font<select value={bodyFont} onChange={e => setBodyFont(e.target.value)}>{fonts.map(f => <option key={f}>{f}</option>)}</select></label>
              </div>
              <div className="range-row">
                <label>Weight <b>{weight}</b><input type="range" min="300" max="800" step="100" value={weight} onChange={e => setWeight(Number(e.target.value))}/></label>
              </div>
            </div>
            <TokenLab
              tokens={tokens}
              published={lab.published[current.id]}
              revisions={lab.revisions[current.id] ?? []}
              violations={violations}
              notice={notice}
              onChange={t => {lab.updateTokens(current.id, t); setNotice('');}}
              onPublish={publish}
              onRestore={restore}
              onDismissViolations={() => setViolations([])}
            />
            <div className="studio-foot">
              <button className="delete" onClick={() => {setPairs(ps => ps.filter(p => p.id !== selected)); setSelected(pairs.find(p => p.id !== selected)?.id || 0);}}><Trash2 size={15}/>Delete pairing</button>
              <button className="save" onClick={() => localStorage.setItem('type-pairs', JSON.stringify(pairs))}><span className="check">✓</span>Saved locally</button>
            </div>
          </section>
        </div>
      </main>
      {showAdd && (
        <div className="backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New pairing</h2>
            <label>Pairing name<input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Quiet confidence"/></label>
            <div className="modal-actions">
              <button className="outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary" onClick={create}>Create pairing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
