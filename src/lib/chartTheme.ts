export type Theme = 'light' | 'dark'

export function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

// Reads the active token values so ECharts options follow the current theme.
// Callers must rebuild options (re-render) when the theme changes.
export function chartColors() {
  return {
    axisLine: cssVar('--chart-axis-line', '#bcccdc'),
    axisLabel: cssVar('--chart-axis-label', '#627d98'),
    axisStrong: cssVar('--chart-axis-strong', '#334e68'),
    split: cssVar('--chart-split', '#e8eef4'),
    mapBorder: cssVar('--map-border', '#ffffff'),
    mapMissing: cssVar('--map-missing', '#d9e2ec'),
    teal: cssVar('--teal', '#087e8b'),
    blue: cssVar('--blue', '#2f6b9a'),
    amber: cssVar('--amber', '#d89b19'),
    coral: cssVar('--coral', '#c65d4b'),
    muted: cssVar('--chart-axis-label', '#627d98'),
  }
}

export function chartAxis() {
  const colors = chartColors()
  return { axisLine: { lineStyle: { color: colors.axisLine } }, axisLabel: { color: colors.axisLabel, fontSize: 11 }, splitLine: { lineStyle: { color: colors.split } } }
}

export function chartTip() {
  return { backgroundColor: '#102a43', borderColor: '#102a43', textStyle: { color: '#fff', fontSize: 12 } }
}

export function scoreColor(score: number | null): string {
  const colors = chartColors()
  return score == null ? colors.mapMissing : score < 50 ? colors.coral : score < 70 ? colors.amber : score < 85 ? colors.teal : colors.blue
}
