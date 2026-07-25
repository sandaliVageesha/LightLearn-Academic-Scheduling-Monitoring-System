// Recharts needs literal color values (SVG attributes / inline styles), so
// these can't be Tailwind dark: classes — components read the right set via
// useTheme().
export const CHART_COLORS = {
  light: {
    tick:     '#6B7080',
    grid:     'rgba(18,20,28,0.06)',
    axisLine: 'rgba(18,20,28,0.08)',
    cursor:   'rgba(0,160,245,0.06)',
  },
  dark: {
    tick:     '#8B93A7',
    grid:     'rgba(255,255,255,0.08)',
    axisLine: 'rgba(255,255,255,0.12)',
    cursor:   'rgba(0,160,245,0.14)',
  },
};
