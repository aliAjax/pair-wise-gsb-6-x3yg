import type {
  BreakpointId,
  ElementId,
  MetricCells,
  MetricId,
  Pair,
  TokenSet,
} from './types';

/** 断点顺序固定：桌面 → 平板 → 手机（随屏宽收窄），顺序必须连续 */
export const BREAKPOINTS: { id: BreakpointId; label: string; maxWidth: number; frame: number }[] = [
  { id: 'desktop', label: '桌面 Desktop', maxWidth: 1280, frame: 640 },
  { id: 'tablet', label: '平板 Tablet', maxWidth: 768, frame: 430 },
  { id: 'mobile', label: '手机 Mobile', maxWidth: 390, frame: 300 },
];

export const ELEMENTS: { id: ElementId; label: string }[] = [
  { id: 'heading', label: '标题' },
  { id: 'body', label: '正文' },
];

export const METRICS: {
  id: MetricId;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}[] = [
  { id: 'fontSize', label: '字号', unit: 'px', min: 10, max: 96, step: 1, decimals: 0 },
  { id: 'lineHeight', label: '行高', unit: '', min: 1, max: 2.2, step: 0.05, decimals: 2 },
  { id: 'letterSpacing', label: '字距', unit: 'px', min: -2, max: 6, step: 0.1, decimals: 1 },
];

export const FONTS = [
  'Fraunces',
  'DM Sans',
  'Space Grotesk',
  'Newsreader',
  'IBM Plex Sans',
  'Playfair Display',
];

const cell = (fontSize: number, lineHeight: number, letterSpacing: number): MetricCells => ({
  fontSize,
  lineHeight,
  letterSpacing,
});

const tokens = (
  hD: MetricCells, hT: MetricCells, hM: MetricCells,
  bD: MetricCells, bT: MetricCells, bM: MetricCells,
): TokenSet => ({
  desktop: { heading: hD, body: bD },
  tablet: { heading: hT, body: bT },
  mobile: { heading: hM, body: bM },
});

export function defaultDraft(): { fonts: { heading: string; body: string }; tokens: TokenSet } {
  return {
    fonts: { heading: 'Fraunces', body: 'DM Sans' },
    tokens: tokens(
      cell(46, 1.1, -0.5), cell(36, 1.15, -0.2), cell(28, 1.2, 0),
      cell(16, 1.65, 0), cell(15, 1.6, 0), cell(14, 1.55, 0.1),
    ),
  };
}

/** 种子数据：配对 1 已发布 v1；其余两套只有草稿，各自独立不串台 */
export function seedPairs(): Pair[] {
  const base = defaultDraft();
  return [
    {
      id: 1,
      title: 'Editorial calm',
      heading: 'A slower way to see',
      body: 'Good typography creates space for ideas to breathe. Pair a confident display face with a quiet, generous text face.',
      category: 'Editorial',
      favorite: true,
      draft: {
        ...structuredClone(base),
        revisionReason: '',
        baseVersionId: 1001,
      },
      published: {
        fonts: { ...base.fonts },
        tokens: structuredClone(base.tokens),
      },
      versions: [
        {
          id: 1001,
          seq: 1,
          reason: '首次发布',
          createdAt: Date.parse('2026-09-18T10:24:00'),
          snapshot: {
            fonts: { ...base.fonts },
            tokens: structuredClone(base.tokens),
          },
        },
      ],
    },
    {
      id: 2,
      title: 'Studio notes',
      heading: 'Make room for the unexpected',
      body: 'A thoughtful pairing can add rhythm to even the simplest interface. Try contrast in shape, not just size.',
      category: 'Portfolio',
      favorite: false,
      draft: {
        fonts: { heading: 'Space Grotesk', body: 'DM Sans' },
        tokens: tokens(
          cell(40, 1.15, 0), cell(32, 1.2, 0.2), cell(26, 1.25, 0.4),
          cell(15, 1.5, 0.1), cell(14, 1.55, 0.1), cell(13, 1.6, 0.2),
        ),
        revisionReason: '',
        baseVersionId: null,
      },
      published: null,
      versions: [],
    },
    {
      id: 3,
      title: 'Field guide',
      heading: 'Small details, lasting impressions',
      body: 'Typography is the voice of a page. Find a combination that feels clear, warm and distinctly yours.',
      category: 'Brand',
      favorite: false,
      draft: {
        fonts: { heading: 'Newsreader', body: 'IBM Plex Sans' },
        tokens: tokens(
          cell(44, 1.2, 0), cell(34, 1.2, 0), cell(27, 1.25, 0),
          cell(16, 1.7, 0), cell(15, 1.7, 0), cell(14, 1.65, 0),
        ),
        revisionReason: '',
        baseVersionId: null,
      },
      published: null,
      versions: [],
    },
  ];
}

export function emptyTokens(): TokenSet {
  const blank = (): MetricCells => ({ fontSize: null, lineHeight: null, letterSpacing: null });
  return {
    desktop: { heading: blank(), body: blank() },
    tablet: { heading: blank(), body: blank() },
    mobile: { heading: blank(), body: blank() },
  };
}
