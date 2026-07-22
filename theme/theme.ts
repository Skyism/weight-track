// Design tokens — refined "training-log" minimalism.
// Light "paper" palette, signal-red accent used sparingly, monospaced figures.

export const colors = {
  bg: '#FAFAF8', // warm paper
  card: '#FFFFFF', // raised surface (flat, hairline only)
  border: '#E6E4DF', // hairline rules
  text: '#18181B', // ink
  textMuted: '#6B6B70', // secondary text
  faint: '#9A9A9E', // hints, placeholders, inactive
  primary: '#E5484D', // signal red — primary actions
  primaryText: '#FFFFFF',
  danger: '#E5484D', // destructive reuses the accent red
  success: '#18181B', // completed states are monochrome (ink), not green
  accent: '#E5484D', // PR markers
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 30,
};

export const letterSpacing = {
  tight: -0.2,
  normal: 0,
  wide: 0.8, // uppercase micro-labels
  wider: 1.4,
};

// Font family names as registered by expo-font (see app/_layout.tsx).
export const font = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  mono: 'SplineSansMono_400Regular',
  monoMedium: 'SplineSansMono_500Medium',
};
