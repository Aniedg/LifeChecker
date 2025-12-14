export const colors = {
  // Background
  background: '#0f0f1a',
  backgroundSecondary: '#1a1a2e',
  backgroundTertiary: '#252542',
  
  // Surface cards
  surface: '#1e1e32',
  surfaceLight: '#2a2a45',
  surfaceBorder: '#3a3a5a',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b8',
  textMuted: '#6b6b85',
  
  // Accent colors
  primary: '#6366f1', // indigo
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Domain colors
  sleep: '#818cf8',    // indigo
  mental: '#c084fc',   // purple
  energy: '#fbbf24',   // amber
  nutrition: '#34d399', // emerald
  movement: '#fb923c', // orange
  social: '#f472b6',   // pink
  
  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Trend colors
  improving: '#22c55e',
  stable: '#6b7280',
  declining: '#ef4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};

export function getDomainColor(domainId: string): string {
  switch (domainId) {
    case 'sleep': return colors.sleep;
    case 'mental': return colors.mental;
    case 'energy': return colors.energy;
    case 'nutrition': return colors.nutrition;
    case 'movement': return colors.movement;
    case 'social': return colors.social;
    default: return colors.primary;
  }
}

export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving': return colors.improving;
    case 'declining': return colors.declining;
    default: return colors.stable;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  if (score >= 25) return colors.warning;
  return colors.error;
}

