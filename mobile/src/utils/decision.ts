// Decision/theme helpers — the ResultScreen color IS the decision.
export type Decision = 'ALLOW' | 'REVIEW' | 'DENY';

export const THEME = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
} as const;

export const DECISION_COLORS: Record<Decision, string> = {
  ALLOW: '#22c55e',
  REVIEW: '#f59e0b',
  DENY: '#ef4444',
};

export interface Thresholds {
  allowMax: number;
  reviewMax: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { allowMax: 30, reviewMax: 70 };

export function decisionFromScore(
  score: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Decision {
  if (score <= thresholds.allowMax) return 'ALLOW';
  if (score <= thresholds.reviewMax) return 'REVIEW';
  return 'DENY';
}

export function decisionColor(decision: Decision): string {
  return DECISION_COLORS[decision];
}

export function decisionLabel(decision: Decision): string {
  return decision;
}
