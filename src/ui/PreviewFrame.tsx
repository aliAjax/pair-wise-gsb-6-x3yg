import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { BREAKPOINTS } from '../model/constants';
import type { BreakpointId, DraftState, PairMeta } from '../model/types';

const ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

export function PreviewFrame({
  meta,
  draft,
  active,
  onSelect,
}: {
  meta: PairMeta;
  draft: DraftState;
  active: BreakpointId;
  onSelect: (bp: BreakpointId) => void;
}) {
  const bp = BREAKPOINTS.find((b) => b.id === active)!;
  const t = draft.tokens[active];
  const hStyle = {
    fontFamily: draft.fonts.heading,
    fontSize: t.heading.fontSize ?? undefined,
    lineHeight: t.heading.lineHeight ?? undefined,
    letterSpacing: t.heading.letterSpacing === null ? undefined : `${t.heading.letterSpacing}px`,
  };
  const bStyle = {
    fontFamily: draft.fonts.body,
    fontSize: t.body.fontSize ?? undefined,
    lineHeight: t.body.lineHeight ?? undefined,
    letterSpacing: t.body.letterSpacing === null ? undefined : `${t.body.letterSpacing}px`,
  };

  return (
    <div className="canvas">
      <div className="canvas-bar">
        <span>PREVIEW · ≤{bp.maxWidth}PX</span>
        <div>
          {BREAKPOINTS.map((b) => {
            const Icon = ICONS[b.id];
            return (
              <button
                key={b.id}
                className={active === b.id ? 'bp-on' : ''}
                onClick={() => onSelect(b.id)}
              >
                <Icon size={11} /> {b.id === 'desktop' ? 'Desktop' : b.id === 'tablet' ? 'Tablet' : 'Mobile'}
              </button>
            );
          })}
        </div>
      </div>
      <div className="preview-scroll">
        <div className="preview" style={{ maxWidth: bp.frame }}>
          <span className="preview-kicker">A NOTE ON TYPE</span>
          <h3 style={hStyle}>{meta.heading}</h3>
          <p style={bStyle}>{meta.body}</p>
          <div className="preview-rule" />
          <span className="preview-meta">{meta.category.toUpperCase()} · {draft.fonts.heading} + {draft.fonts.body}</span>
        </div>
      </div>
    </div>
  );
}
