// Grungy Gym Vibe — Dark, edgy, neon accents
export const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceHighlight: '#2A2A2A',
  primary: '#FF3B30',
  primaryForeground: '#FFFFFF',
  secondary: '#141414',
  accent: '#39FF14',
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#666666',
  border: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.85)',
  dosageHighlight: '#39FF14',
};

export const FONT_MARKER = 'PermanentMarker_400Regular';

export const typography = {
  display: { fontSize: 48, lineHeight: 56, fontWeight: '800' as const, fontFamily: 'PermanentMarker_400Regular', letterSpacing: 1 },
  h1: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const, fontFamily: 'PermanentMarker_400Regular', letterSpacing: 0.5 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, fontFamily: 'PermanentMarker_400Regular' },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, fontFamily: 'PermanentMarker_400Regular' },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  bodyBase: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, textTransform: 'uppercase' as const, letterSpacing: 1.5 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const DISCLAIMER = 'PepTrack Pro is for informational and personal tracking purposes only. Not a substitute for professional medical advice. Always consult a qualified healthcare provider.';
