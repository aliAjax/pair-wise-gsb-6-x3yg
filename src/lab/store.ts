import type {DraftEntry, PublishedEntry, PublishedVersion, RevisionEntry, TokenSet} from './types';

// Drafts, published snapshots and revision chains live under separate keys
// so a refresh never mixes the three lanes.
const KEYS = {
  drafts: 'type-lab:drafts',
  published: 'type-lab:published',
  revisions: 'type-lab:revisions',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep the in-memory state */
  }
}

export const loadDrafts = (): Record<number, DraftEntry> => read(KEYS.drafts, {});
export const saveDrafts = (d: Record<number, DraftEntry>): void => write(KEYS.drafts, d);

export const loadPublished = (): Record<number, PublishedEntry> => read(KEYS.published, {});
export const savePublished = (p: Record<number, PublishedEntry>): void => write(KEYS.published, p);

export const loadRevisions = (): Record<number, RevisionEntry[]> => read(KEYS.revisions, {});
export const saveRevisions = (r: Record<number, RevisionEntry[]>): void => write(KEYS.revisions, r);

export function defaultTokens(): TokenSet {
  return {
    desktop: {heading: {fontSize: 46, lineHeight: 1.25, letterSpacing: -0.5}, body: {fontSize: 15, lineHeight: 1.65, letterSpacing: 0}},
    tablet: {heading: {fontSize: 37, lineHeight: 1.2, letterSpacing: -0.5}, body: {fontSize: 14, lineHeight: 1.6, letterSpacing: 0}},
    mobile: {heading: {fontSize: 29, lineHeight: 1.15, letterSpacing: -0.5}, body: {fontSize: 14, lineHeight: 1.55, letterSpacing: 0}},
  };
}

export function cloneTokens(tokens: TokenSet): TokenSet {
  return JSON.parse(JSON.stringify(tokens)) as TokenSet;
}

export function latestVersion(entry?: PublishedEntry): PublishedVersion | null {
  if (!entry || entry.versions.length === 0) return null;
  return entry.versions[entry.versions.length - 1];
}
