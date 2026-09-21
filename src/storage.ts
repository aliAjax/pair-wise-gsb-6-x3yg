// 数据层（存储部分）：草稿、发布版、修订链分键持久化，任一槽损坏互不污染。

import { defaultDraft, seedPairs } from './model/constants';
import type {
  DraftState,
  Pair,
  PairMeta,
  Snapshot,
  Version,
} from './model/types';

const K_META = 'bt-pairs-v1';
const K_DRAFTS = 'bt-drafts-v1';
const K_PUBLISHED = 'bt-published-v1';
const K_VERSIONS = 'bt-versions-v1';
const K_SELECTED = 'bt-selected-v1';

/** 版本与快照在加载后立即重新冻结：冻结属性不依赖内存对象身份，刷新依然成立 */
function refreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(refreeze);
    Object.freeze(value);
  }
  return value;
}

function readStorage<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // 单槽损坏不应波及其他槽
  }
}

function writeStorage(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* 配额或隐私模式下静默：内存中的工作流不受影响 */
  }
}

export interface PersistedBench {
  pairs: Pair[];
  selectedId: number;
}

/** 只冻结发布快照与历史版本；草稿必须保持可变 */
function freezePair(p: Pair): Pair {
  return {
    ...p,
    published: p.published ? refreeze(structuredClone(p.published)) : null,
    versions: p.versions.map((v) => refreeze(structuredClone(v))),
  };
}

/** 读取四个独立槽并重建；首启（全部为空）写入种子 */
export function loadBench(storage?: Storage): PersistedBench {
  const s = storage ?? globalThis.localStorage;
  const metas = readStorage<PairMeta[]>(s, K_META);
  if (metas === null) {
    const pairs = seedPairs().map(freezePair);
    persistAll(pairs, pairs[0]?.id ?? 0, s);
    return { pairs, selectedId: pairs[0]?.id ?? 0 };
  }

  const drafts = readStorage<Record<number, DraftState>>(s, K_DRAFTS) ?? {};
  const published = readStorage<Record<number, Snapshot>>(s, K_PUBLISHED) ?? {};
  const versions = readStorage<Record<number, Version[]>>(s, K_VERSIONS) ?? {};
  const selectedId = readStorage<number>(s, K_SELECTED);

  const fallback = defaultDraft();
  const pairs: Pair[] = metas.map((m) => {
    const repaired: DraftState = drafts[m.id] ?? {
      ...structuredClone(fallback),
      revisionReason: '',
      baseVersionId: null,
    };
    return freezePair({
      ...m,
      draft: repaired,
      published: published[m.id] ?? null,
      versions: versions[m.id] ?? [],
    });
  });

  const validSelection = pairs.some((p) => p.id === selectedId)
    ? (selectedId as number)
    : pairs[0]?.id ?? 0;

  return { pairs, selectedId: validSelection };
}

/** 四槽分别写入：草稿的改动不会覆盖发布版与修订链，反之亦然 */
export function persistAll(pairs: Pair[], selectedId: number, storage?: Storage): void {
  const s = storage ?? globalThis.localStorage;
  const metas: PairMeta[] = pairs.map(({ id, title, heading, body, category, favorite }) => ({
    id,
    title,
    heading,
    body,
    category,
    favorite,
  }));
  const drafts: Record<number, DraftState> = {};
  const publishedSlot: Record<number, Snapshot> = {};
  const versionsSlot: Record<number, Version[]> = {};
  for (const p of pairs) {
    drafts[p.id] = p.draft;
    if (p.published) publishedSlot[p.id] = p.published;
    if (p.versions.length) versionsSlot[p.id] = p.versions;
  }
  writeStorage(s, K_META, metas);
  writeStorage(s, K_DRAFTS, drafts);
  writeStorage(s, K_PUBLISHED, publishedSlot);
  writeStorage(s, K_VERSIONS, versionsSlot);
  writeStorage(s, K_SELECTED, selectedId);
}
