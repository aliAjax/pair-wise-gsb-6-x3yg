export type Breakpoint = 'desktop' | 'tablet' | 'mobile';
export type Role = 'heading' | 'body';
export type Metric = 'fontSize' | 'lineHeight' | 'letterSpacing';

export interface MetricSet {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export type TokenSet = Record<Breakpoint, Record<Role, MetricSet>>;

export interface DraftEntry {
  pairId: number;
  tokens: TokenSet;
  updatedAt: number;
}

export interface PublishedVersion {
  version: number;
  tokens: TokenSet;
  publishedAt: number;
}

export interface PublishedEntry {
  pairId: number;
  versions: PublishedVersion[];
}

export interface RevisionEntry {
  id: string;
  pairId: number;
  fromVersion: number;
  toVersion: number;
  reason: string;
  createdAt: number;
}

export const BREAKPOINTS: readonly Breakpoint[] = ['desktop', 'tablet', 'mobile'];
export const ROLES: readonly Role[] = ['heading', 'body'];
export const METRICS: readonly Metric[] = ['fontSize', 'lineHeight', 'letterSpacing'];

export const BP_LABEL: Record<Breakpoint, string> = {desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile'};
export const ROLE_LABEL: Record<Role, string> = {heading: 'Heading', body: 'Body'};
export const METRIC_LABEL: Record<Metric, string> = {fontSize: 'Font size', lineHeight: 'Line height', letterSpacing: 'Letter spacing'};
export const METRIC_UNIT: Record<Metric, string> = {fontSize: 'px', lineHeight: '', letterSpacing: 'px'};
