// 数据层（状态仓库）：所有状态变更的唯一入口。发布成功才冻结快照并追加修订；
// 校验失败整批拒绝，草稿原样保留。仓库不含任何 React 组件。
// createBench 可注入 storage，便于测试与隔离；默认使用 localStorage。

import { useSyncExternalStore } from 'react';
import { defaultDraft } from './model/constants';
import type {
  BreakpointId,
  DraftState,
  ElementId,
  FontChoice,
  MetricId,
  Pair,
  Snapshot,
  Version,
} from './model/types';
import { loadBench, persistAll } from './storage';
import { validateForPublish, type Violation } from './validation';

export interface Notice {
  id: number;
  tone: 'ok' | 'error' | 'info';
  text: string;
}

interface BenchState {
  pairs: Pair[];
  selectedId: number;
  /** 最近一次发布尝试被拒绝的逐项提示，仅挂在对应配对的草稿上 */
  rejections: Record<number, Violation[]>;
  notice: Notice | null;
}

export interface BenchActions {
  select(id: number): void;
  dismissRejections(id: number): void;
  createPair(title: string): void;
  deletePair(id: number): void;
  toggleFavorite(id: number): void;
  renamePair(id: number, title: string): void;
  setCopy(id: number, patch: Partial<Pick<Pair, 'heading' | 'body' | 'category'>>): void;
  setFont(id: number, which: keyof FontChoice, font: string): void;
  setToken(
    id: number,
    bp: BreakpointId,
    el: ElementId,
    metric: MetricId,
    value: number | null,
  ): void;
  setReason(id: number, reason: string): void;
  resetDraft(id: number): void;
  publish(id: number): boolean;
  restoreVersion(pairId: number, versionId: number): void;
}

export interface Bench {
  getState(): BenchState;
  subscribe(l: () => void): () => void;
  actions: BenchActions;
}

/** 冻结快照：发布后版本对象不可变，后续调整只能产生带原因的新修订 */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function createBench(storage?: Storage): Bench {
  const store = storage ??
    (typeof globalThis !== 'undefined' ? (globalThis as { localStorage?: Storage }).localStorage : undefined);
  if (!store) throw new Error('no storage available');
  const initial = loadBench(store);
  let state: BenchState = {
    pairs: initial.pairs,
    selectedId: initial.selectedId,
    rejections: {},
    notice: null,
  };

  const listeners = new Set<() => void>();
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  const emit = (): void => {
    persistAll(state.pairs, state.selectedId, store);
    listeners.forEach((l) => l());
  };

  const setState = (next: Partial<BenchState>): void => {
    state = { ...state, ...next };
    emit();
  };

  const notify = (tone: Notice['tone'], text: string): void => {
    if (noticeTimer) clearTimeout(noticeTimer);
    state = { ...state, notice: { id: Date.now() + Math.random(), tone, text } };
    emit();
    noticeTimer = setTimeout(() => {
      state = { ...state, notice: null };
      emit();
    }, 3200);
  };

  const updatePair = (id: number, fn: (p: Pair) => Pair): void => {
    setState({ pairs: state.pairs.map((p) => (p.id === id ? fn(p) : p)) });
  };

  /** 草稿一旦被修改，之前基于旧草稿生成的拒绝报告即过时，自动收起 */
  const clearRejection = (id: number): void => {
    if (!state.rejections[id]) return;
    const rejections = { ...state.rejections };
    delete rejections[id];
    state = { ...state, rejections };
  };

  const getPair = (id: number): Pair => {
    const p = state.pairs.find((x) => x.id === id) ?? state.pairs[0];
    if (!p) throw new Error('no pair');
    return p;
  };

  const toSnapshot = (draft: DraftState): Snapshot =>
    deepFreeze(structuredClone({ fonts: draft.fonts, tokens: draft.tokens }));

  const actions: BenchActions = {
    select(id: number): void {
      if (state.selectedId !== id) setState({ selectedId: id });
    },

    /** 关闭整批拒绝提示（仅清除提示，草稿与挂起值不变） */
    dismissRejections(id: number): void {
      if (!state.rejections[id]) return;
      const rejections = { ...state.rejections };
      delete rejections[id];
      setState({ rejections });
    },

    createPair(title: string): void {
      const t = title.trim();
      if (!t) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const dd = defaultDraft();
      const pair: Pair = {
        id,
        title: t,
        heading: '你的新标题',
        body: '用一段能体现字体性格的文字开始实验，在三个断点上逐项调校。',
        category: 'Untitled',
        favorite: false,
        draft: { ...structuredClone(dd), revisionReason: '', baseVersionId: null },
        published: null,
        versions: [],
      };
      setState({ pairs: [...state.pairs, pair], selectedId: id });
      notify('info', `已创建草稿「${t}」`);
    },

    deletePair(id: number): void {
      const target = getPair(id);
      const rest = state.pairs.filter((p) => p.id !== id);
      const selectedId = state.selectedId === id ? rest[0]?.id ?? 0 : state.selectedId;
      const rejections = { ...state.rejections };
      delete rejections[id];
      setState({ pairs: rest, selectedId, rejections });
      notify('info', `已删除「${target.title}」（含其发布版与修订链）`);
    },

    toggleFavorite(id: number): void {
      updatePair(id, (p) => ({ ...p, favorite: !p.favorite }));
    },

    renamePair(id: number, title: string): void {
      updatePair(id, (p) => ({ ...p, title }));
    },

    setCopy(id: number, patch: Partial<Pick<Pair, 'heading' | 'body' | 'category'>>): void {
      updatePair(id, (p) => ({ ...p, ...patch }));
    },

    setFont(id: number, which: keyof FontChoice, font: string): void {
      clearRejection(id);
      updatePair(id, (p) => ({
        ...p,
        draft: { ...p.draft, fonts: { ...p.draft.fonts, [which]: font } },
      }));
    },

    /** 编辑单个令牌单元格；任何草稿态（含非法态）都允许，校验只在发布前进行 */
    setToken(
      id: number,
      bp: BreakpointId,
      el: ElementId,
      metric: MetricId,
      value: number | null,
): void {
      clearRejection(id);
      updatePair(id, (p) => ({
        ...p,
        draft: {
          ...p.draft,
          tokens: {
            ...p.draft.tokens,
            [bp]: {
              ...p.draft.tokens[bp],
              [el]: { ...p.draft.tokens[bp][el], [metric]: value },
            },
          },
        },
      }));
    },

    setReason(id: number, reason: string): void {
      clearRejection(id);
      updatePair(id, (p) => ({ ...p, draft: { ...p.draft, revisionReason: reason } }));
    },

    /** 草稿恢复初始模板（不触碰发布版与修订链） */
    resetDraft(id: number): void {
      clearRejection(id);
      const dd = defaultDraft();
      updatePair(id, (p) => ({
        ...p,
        draft: {
          ...structuredClone(dd),
          revisionReason: '',
          baseVersionId: p.published ? p.versions[p.versions.length - 1]?.id ?? null : null,
        },
      }));
      notify('info', '草稿已重置为初始模板');
    },

    /**
     * 发布：整体校验 → 有冲突则整批拒绝（草稿原样、拒绝项逐条挂起）；
     * 通过则冻结快照、追加修订版本、草稿回到与发布版一致的工作副本。
     */
    publish(id: number): boolean {
      const pair = getPair(id);
      const violations = validateForPublish(pair.draft, pair.published);
      if (violations.length > 0) {
        setState({ rejections: { ...state.rejections, [id]: violations } });
        notify('error', `发布被拒绝：${violations.length} 项冲突，草稿已保留`);
        return false;
      }

      const snapshot = toSnapshot(pair.draft);
      const isRevision = pair.published !== null;
      const version: Version = {
        id:
          Math.max(
            1000,
            ...state.pairs.flatMap((p2) => p2.versions.map((v) => v.id)),
          ) + 1,
        seq: pair.versions.length + 1,
        reason: isRevision ? pair.draft.revisionReason.trim() : '首次发布',
        createdAt: Date.now(),
        snapshot,
      };
      Object.freeze(version);

      const nextDraft: DraftState = {
        fonts: structuredClone(snapshot.fonts),
        tokens: structuredClone(snapshot.tokens),
        revisionReason: '',
        baseVersionId: version.id,
      };

      updatePair(id, (p) => ({
        ...p,
        published: snapshot,
        versions: [...p.versions, version],
        draft: nextDraft,
      }));
      const rejections = { ...state.rejections };
      delete rejections[id];
      setState({ rejections });
      notify(
        'ok',
        isRevision ? `已发布修订 v${version.seq}，旧版本仍可查看与恢复` : '已发布 v1 并冻结快照',
      );
      return true;
    },

    /** 查看旧版后「恢复为草稿」：只覆盖草稿，发布版与修订链不变 */
    restoreVersion(pairId: number, versionId: number): void {
      const pair = getPair(pairId);
      const v = pair.versions.find((x) => x.id === versionId);
      if (!v) return;
      updatePair(pairId, (p) => ({
        ...p,
        draft: {
          fonts: structuredClone(v.snapshot.fonts),
          tokens: structuredClone(v.snapshot.tokens),
          revisionReason: `恢复自 v${v.seq}（${new Date(v.createdAt).toLocaleDateString('zh-CN')}）后的调整`,
          baseVersionId: v.id,
        },
      }));
      const rejections = { ...state.rejections };
      delete rejections[pairId];
      setState({ rejections });
      notify('ok', `v${v.seq} 已恢复为草稿；发布版与修订链未改动`);
    },
  };

  return {
    getState: () => state,
    subscribe(l: () => void): () => void {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    actions,
  };
}

// ---------- 默认单例（界面使用，惰性创建，便于 Node 环境导入本模块） ----------

let singleton: Bench | null = null;
const getBench = (): Bench => {
  if (!singleton) singleton = createBench();
  return singleton;
};

export function useBench(): BenchState {
  const b = getBench();
  return useSyncExternalStore(b.subscribe, b.getState, b.getState);
}

export const actions: BenchActions = new Proxy({} as BenchActions, {
  get(_t, prop: keyof Bench['actions']) {
    return getBench().actions[prop];
  },
});
