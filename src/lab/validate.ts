import {BREAKPOINTS, METRICS, ROLES} from './types';
import type {Breakpoint, Metric, Role, TokenSet} from './types';

export type RuleId = 'breakpoint-order' | 'no-reversal' | 'heading-dominance';

export interface Violation {
  rule: RuleId;
  breakpoint: Breakpoint;
  role: Role;
  metric: Metric;
  oldValue: number | string;
  newValue: number | string;
}

export const RULE_TEXT: Record<RuleId, string> = {
  'breakpoint-order': 'Breakpoint sequence must be continuous: desktop → tablet → mobile.',
  'no-reversal': 'A metric must not increase as the screen narrows.',
  'heading-dominance': 'Heading size must not be smaller than body size.',
};

export function validateTokenSet(tokens: TokenSet): Violation[] {
  const violations: Violation[] = [];

  // 1. Breakpoint order must be continuous: exactly desktop → tablet → mobile.
  const keys = Object.keys(tokens);
  const continuous = keys.length === BREAKPOINTS.length && BREAKPOINTS.every((bp, i) => keys[i] === bp);
  if (!continuous) {
    violations.push({
      rule: 'breakpoint-order',
      breakpoint: 'desktop',
      role: 'heading',
      metric: 'fontSize',
      oldValue: keys.join(' → ') || '(empty)',
      newValue: BREAKPOINTS.join(' → '),
    });
  }

  // 2. The same metric must not reverse (increase) as the screen narrows.
  for (const role of ROLES) {
    for (const metric of METRICS) {
      for (let i = 1; i < BREAKPOINTS.length; i++) {
        const prev = tokens[BREAKPOINTS[i - 1]]?.[role]?.[metric];
        const cur = tokens[BREAKPOINTS[i]]?.[role]?.[metric];
        if (typeof prev !== 'number' || typeof cur !== 'number') continue;
        if (cur > prev) {
          violations.push({rule: 'no-reversal', breakpoint: BREAKPOINTS[i], role, metric, oldValue: prev, newValue: cur});
        }
      }
    }
  }

  // 3. Heading font size must not be smaller than body font size.
  for (const bp of BREAKPOINTS) {
    const heading = tokens[bp]?.heading?.fontSize;
    const body = tokens[bp]?.body?.fontSize;
    if (typeof heading !== 'number' || typeof body !== 'number') continue;
    if (heading < body) {
      violations.push({rule: 'heading-dominance', breakpoint: bp, role: 'heading', metric: 'fontSize', oldValue: body, newValue: heading});
    }
  }

  return violations;
}
