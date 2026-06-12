// IDIP design tokens — "Bold venue": near-black, glanceable, one electric accent.
import { TextStyle } from 'react-native';

export const COLORS = {
  // Surfaces
  bg: '#0A0A0B',
  surface: '#161618',
  surfaceHigh: '#1F1F23',
  border: '#2A2A2E',
  borderStrong: '#3A3A40',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  onColor: '#FFFFFF',

  // Brand accent (electric)
  accent: '#5B8CFF',
  accentPressed: '#3F6FE0',
  accentSoft: '#18233E',

  // Decision colors (match backend ALLOW/REVIEW/DENY)
  allow: '#22C55E',
  review: '#F59E0B',
  deny: '#EF4444',
  allowDeep: '#0B3D22',
  reviewDeep: '#3E2C06',
  denyDeep: '#3E1010',
} as const;

export type Decision = 'ALLOW' | 'REVIEW' | 'DENY';

export const DECISION = {
  ALLOW: { color: COLORS.allow, deep: COLORS.allowDeep, label: 'Allow', icon: 'check' },
  REVIEW: { color: COLORS.review, deep: COLORS.reviewDeep, label: 'Review', icon: 'alert' },
  DENY: { color: COLORS.deny, deep: COLORS.denyDeep, label: 'Deny', icon: 'x' },
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

export const TYPE: Record<string, TextStyle> = {
  display: { fontSize: 44, fontWeight: '800', letterSpacing: -1, color: COLORS.textPrimary },
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textPrimary },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: COLORS.textPrimary },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: COLORS.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: '500', color: COLORS.textTertiary },
  mono: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
};
