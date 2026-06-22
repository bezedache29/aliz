const palette = {
  slate950: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  green500: '#22C55E',
  green600: '#16A34A',
  green400: '#4ADE80',
  red500: '#EF4444',
  red600: '#DC2626',
  amber500: '#F59E0B',
  amber600: '#D97706',
  blue500: '#3B82F6',
  violet500: '#8B5CF6',
  violet400: '#A78BFA',
} as const

export const colors = {
  light: {
    background: palette.slate50,
    surface: palette.white,
    surfaceElevated: palette.slate100,
    border: palette.slate200,
    textPrimary: palette.slate950,
    textSecondary: palette.slate600,
    textMuted: palette.slate400,
    primary: palette.green600,
    primaryLight: palette.green500,
    danger: palette.red600,
    warning: palette.amber600,
    info: palette.blue500,
    tertiary: palette.violet500,
  },
  dark: {
    background: palette.slate950,
    surface: palette.slate800,
    surfaceElevated: palette.slate700,
    border: palette.slate600,
    textPrimary: palette.slate50,
    textSecondary: palette.slate400,
    textMuted: palette.slate500,
    primary: palette.green500,
    primaryLight: palette.green400,
    danger: palette.red500,
    warning: palette.amber500,
    info: palette.blue500,
    tertiary: palette.violet400,
  },
} as const

export type ColorTokens = { [K in keyof typeof colors.light]: string }

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const

export const fontSize = {
  display: 48,
  heading1: 28,
  heading2: 22,
  heading3: 18,
  body: 16,
  caption: 13,
  label: 12,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '900' as const,
}

export const lineHeight = {
  display: 56,
  heading1: 36,
  heading2: 30,
  heading3: 26,
  body: 24,
  caption: 20,
  label: 18,
} as const
