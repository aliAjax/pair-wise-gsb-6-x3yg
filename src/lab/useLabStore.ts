import {useEffect, useState} from 'react';
import type {DraftEntry, PublishedEntry, PublishedVersion, RevisionEntry, TokenSet} from './types';
import {cloneTokens, defaultTokens, latestVersion, loadDrafts, loadPublished, loadRevisions, saveDrafts, savePublished, saveRevisions} from './store';
import {validateTokenSet} from './validate';
import type {Violation} from './validate';

export type PublishResult = {ok: true; version: number} | {ok: false; violations: Violation[]} | {ok: false; reasonRequired: true};

export interface LabStore {
  drafts: Record<number, DraftEntry>;
  published: Record<number, PublishedEntry>;
  revisions: Record<number, RevisionEntry[]>;
  getTokens: (pairId: number) => TokenSet;
  updateTokens: (pairId: number, tokens: TokenSet) => void;
  publish: (pairId: number, reason: string) => PublishResult;
  restoreAsDraft: (pairId: number, version: number) => boolean;
}

export function useLabStore(): LabStore {
  const [drafts, setDrafts] = useState<Record<number, DraftEntry>>(loadDrafts);
  const [published, setPublished] = useState<Record<number, PublishedEntry>>(loadPublished);
  const [revisions, setRevisions] = useState<Record<number, RevisionEntry[]>>(loadRevisions);

  useEffect(() => saveDrafts(drafts), [drafts]);
  useEffect(() => savePublished(published), [published]);
  useEffect(() => saveRevisions(revisions), [revisions]);

  const getTokens = (pairId: number): TokenSet => drafts[pairId]?.tokens ?? defaultTokens();

  const updateTokens = (pairId: number, tokens: TokenSet) => {
    setDrafts(d => ({...d, [pairId]: {pairId, tokens, updatedAt: Date.now()}}));
  };

  const publish = (pairId: number, reason: string): PublishResult => {
    const tokens = cloneTokens(getTokens(pairId));
    const violations = validateTokenSet(tokens);
    if (violations.length > 0) return {ok: false, violations}; // whole batch rejected, draft untouched

    const prev = latestVersion(published[pairId]);
    if (prev && !reason.trim()) return {ok: false, reasonRequired: true};

    const version = (prev?.version ?? 0) + 1;
    const snapshot: PublishedVersion = {version, tokens, publishedAt: Date.now()};
    setPublished(p => ({...p, [pairId]: {pairId, versions: [...(p[pairId]?.versions ?? []), snapshot]}}));

    if (prev) {
      const revision: RevisionEntry = {
        id: `${pairId}-v${version}-${Date.now()}`,
        pairId,
        fromVersion: prev.version,
        toVersion: version,
        reason: reason.trim(),
        createdAt: Date.now(),
      };
      setRevisions(r => ({...r, [pairId]: [...(r[pairId] ?? []), revision]}));
    }
    return {ok: true, version};
  };

  const restoreAsDraft = (pairId: number, version: number): boolean => {
    const target = published[pairId]?.versions.find(v => v.version === version);
    if (!target) return false;
    updateTokens(pairId, cloneTokens(target.tokens));
    return true;
  };

  return {drafts, published, revisions, getTokens, updateTokens, publish, restoreAsDraft};
}
