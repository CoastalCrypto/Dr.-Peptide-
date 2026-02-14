export const colors = {
  background: '#1B3A5C',
  surface: '#152E48',
  surfaceHighlight: '#1E4268',
  primary: '#2E75B6',
  primaryForeground: '#FFFFFF',
  secondary: '#0F243A',
  accent: '#4CC9F0',
  success: '#06D6A0',
  warning: '#FFD166',
  error: '#EF476F',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0C4DE',
  textTertiary: '#6C8CA5',
  border: 'rgba(46, 117, 182, 0.3)',
  overlay: 'rgba(27, 58, 92, 0.8)',
  dosageHighlight: '#4CC9F0',
};

export const typography = {
  display: { fontSize: 48, lineHeight: 56, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  bodyBase: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, textTransform: 'uppercase' as const, letterSpacing: 1 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const DISCLAIMER = 'PepTrack Pro is intended for informational and personal tracking purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting any peptide or medication regimen.';
