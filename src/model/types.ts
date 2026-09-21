// 模型层：断点令牌实验台的领域类型（不含任何存储、校验或界面逻辑）

export type BreakpointId = 'desktop' | 'tablet' | 'mobile';
export type ElementId = 'heading' | 'body';
export type MetricId = 'fontSize' | 'lineHeight' | 'letterSpacing';

/** 单个元素（标题/正文）在三个指标上的取值；草稿期允许 null（断点缺口） */
export interface MetricCells {
  fontSize: number | null;
  lineHeight: number | null;
  letterSpacing: number | null;
}

export type ElementTokens = Record<ElementId, MetricCells>;
export type TokenSet = Record<BreakpointId, ElementTokens>;

export interface FontChoice {
  heading: string;
  body: string;
}

/** 发布快照：所有令牌都已解析为数字且冻结 */
export interface Snapshot {
  fonts: FontChoice;
  tokens: TokenSet;
}

/** 草稿：独立于发布版存在；baseVersionId 记录草稿派生自哪个冻结版本 */
export interface DraftState {
  fonts: FontChoice;
  tokens: TokenSet;
  revisionReason: string;
  baseVersionId: number | null;
}

/** 一次发布即一个不可变版本，串联成修订链 */
export interface Version {
  id: number;
  seq: number;
  reason: string;
  createdAt: number;
  snapshot: Snapshot;
}

export interface PairMeta {
  id: number;
  title: string;
  heading: string;
  body: string;
  category: string;
  favorite: boolean;
}

export interface Pair extends PairMeta {
  draft: DraftState;
  published: Snapshot | null;
  versions: Version[];
}

/** 校验规则码：三条发布规则 + 修订原因工作流守卫 */
export type RuleCode =
  | 'CONTINUITY'
  | 'NO_REVERSE'
  | 'HEADING_MIN_BODY'
  | 'REASON_REQUIRED';
