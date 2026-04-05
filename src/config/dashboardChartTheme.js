/** @typedef {{ palette: string[], text: string, line: { series: string, areaTop: string, areaBottom: string, axis: string }, bar: { gradStart: string, gradEnd: string }, splitLine: string, radar: { line: string, item: string, splitLine: string }, graphLabel: string, graphEmpty: string }} ChartVisuals */

function hexToRgb(hex) {
  let h = (hex || '').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return { r: 192, g: 38, b: 211 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r, g, b) {
  const c = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function mixHex(a, b, t) {
  const A = hexToRgb(a)
  const B = typeof b === 'string' ? hexToRgb(b) : b
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t)
}

function clone(v) {
  return v ? JSON.parse(JSON.stringify(v)) : v
}

/** 与当前「跟随外观主题」算法一致，生成完整驾驶舱用色 */
export function visualsFromLayoutColors(colors) {
  const p = colors?.primary || '#c026d3'
  const a = colors?.accent || '#f472b6'
  const ht = colors?.headerText || '#1e1b2e'
  return {
    palette: [
      p,
      a,
      mixHex(p, '#ffffff', 0.42),
      mixHex(a, '#ffffff', 0.38),
      mixHex(p, a, 0.45),
      mixHex(p, '#e8e0f5', 0.35),
      mixHex(a, '#fde8f3', 0.4),
      mixHex(p, '#cbd5e1', 0.25),
    ],
    text: mixHex(ht, '#6b7280', 0.35),
    line: {
      series: p,
      areaTop: mixHex(p, '#ffffff', 0.75),
      areaBottom: mixHex(p, '#ffffff', 0.95),
      axis: mixHex(p, '#e9d5ff', 0.4),
    },
    bar: { gradStart: a, gradEnd: p },
    splitLine: mixHex(p, '#e5e7eb', 0.55),
    radar: {
      line: p,
      item: a,
      splitLine: mixHex(p, '#e5e7eb', 0.55),
    },
    graphLabel: mixHex(p, '#374151', 0.4),
    graphEmpty: mixHex(p, '#9ca3af', 0.5),
  }
}

/** 5 套预制方案（与全局主题独立） */
export const DASHBOARD_CHART_PRESET_META = [
  { id: 'romance', name: '恋恋紫粉', desc: '粉紫渐变，偏运营感' },
  { id: 'ocean', name: '深海青蓝', desc: '冷色清爽' },
  { id: 'forest', name: '森意绿境', desc: '自然、平静' },
  { id: 'sunset', name: '日落暖橙', desc: '高对比暖色' },
  { id: 'graphite', name: '石墨霓虹', desc: '暗底高亮边' },
]

export const DASHBOARD_CHART_PRESETS = {
  romance: {
    palette: ['#c026d3', '#f472b6', '#e9d5ff', '#fbcfe8', '#a855f7', '#ddd6fe', '#fda4af', '#c4b5fd'],
    text: '#4b5563',
    line: {
      series: '#c026d3',
      areaTop: '#f0abfc',
      areaBottom: '#faf5ff',
      axis: '#e9d5ff',
    },
    bar: { gradStart: '#f472b6', gradEnd: '#7c3aed' },
    splitLine: '#e9d5ff',
    radar: { line: '#a21caf', item: '#db2777', splitLine: '#e9d5ff' },
    graphLabel: '#6b21a8',
    graphEmpty: '#a78bfa',
  },
  ocean: {
    palette: ['#0284c7', '#06b6d4', '#7dd3fc', '#67e8f9', '#0369a1', '#bae6fd', '#22d3ee', '#0e7490'],
    text: '#475569',
    line: {
      series: '#0284c7',
      areaTop: '#7dd3fc',
      areaBottom: '#f0f9ff',
      axis: '#bae6fd',
    },
    bar: { gradStart: '#06b6d4', gradEnd: '#1d4ed8' },
    splitLine: '#cbd5e1',
    radar: { line: '#0369a1', item: '#0891b2', splitLine: '#e2e8f0' },
    graphLabel: '#0c4a6e',
    graphEmpty: '#94a3b8',
  },
  forest: {
    palette: ['#15803d', '#22c55e', '#86efac', '#4ade80', '#166534', '#bbf7d0', '#65a30d', '#14532d'],
    text: '#3f6212',
    line: {
      series: '#15803d',
      areaTop: '#86efac',
      areaBottom: '#f7fee7',
      axis: '#bbf7d0',
    },
    bar: { gradStart: '#22c55e', gradEnd: '#14532d' },
    splitLine: '#d9f99d',
    radar: { line: '#166534', item: '#4ade80', splitLine: '#ecfccb' },
    graphLabel: '#365314',
    graphEmpty: '#a3e635',
  },
  sunset: {
    palette: ['#ea580c', '#f97316', '#fdba74', '#fb923c', '#c2410c', '#fed7aa', '#f59e0b', '#b45309'],
    text: '#78350f',
    line: {
      series: '#ea580c',
      areaTop: '#fdba74',
      areaBottom: '#fff7ed',
      axis: '#fed7aa',
    },
    bar: { gradStart: '#fb923c', gradEnd: '#9a3412' },
    splitLine: '#fde68a',
    radar: { line: '#c2410c', item: '#f59e0b', splitLine: '#ffedd5' },
    graphLabel: '#9a3412',
    graphEmpty: '#fcd34d',
  },
  graphite: {
    palette: ['#6366f1', '#a855f7', '#94a3b8', '#cbd5e1', '#4f46e5', '#c4b5fd', '#64748b', '#e2e8f0'],
    text: '#64748b',
    line: {
      series: '#6366f1',
      areaTop: '#a5b4fc',
      areaBottom: '#f8fafc',
      axis: '#cbd5e1',
    },
    bar: { gradStart: '#a855f7', gradEnd: '#312e81' },
    splitLine: '#e2e8f0',
    radar: { line: '#4338ca', item: '#c026d3', splitLine: '#f1f5f9' },
    graphLabel: '#334155',
    graphEmpty: '#94a3b8',
  },
}

export function defaultChartCustomVisuals() {
  return clone(DASHBOARD_CHART_PRESETS.romance)
}

function mergeLine(base, patch) {
  return { ...base, ...(patch || {}) }
}

function mergeRadar(base, patch) {
  return { ...base, ...(patch || {}) }
}

function mergeBar(base, patch) {
  return { ...base, ...(patch || {}) }
}

/** 将部分自定义 patch 补全到基准 visuals 上 */
export function mergeVisualsPartial(base, patch) {
  if (!patch || typeof patch !== 'object') return clone(base)
  const pal = Array.isArray(base.palette) ? [...base.palette] : []
  if (Array.isArray(patch.palette)) {
    for (let i = 0; i < pal.length; i++) {
      if (patch.palette[i]) pal[i] = patch.palette[i]
    }
  }
  return {
    palette: pal,
    text: patch.text ?? base.text,
    line: mergeLine(base.line, patch.line),
    bar: mergeBar(base.bar, patch.bar),
    splitLine: patch.splitLine ?? base.splitLine,
    radar: mergeRadar(base.radar, patch.radar),
    graphLabel: patch.graphLabel ?? base.graphLabel,
    graphEmpty: patch.graphEmpty ?? base.graphEmpty,
  }
}

/**
 * @param {import('pinia').Store} themeStore useThemeStore() 实例
 * @returns {ChartVisuals}
 */
export function resolveChartVisuals(themeStore) {
  const dc = themeStore.dashboardCharts
  const colors = themeStore.colors
  if (dc.mode === 'follow') {
    return visualsFromLayoutColors(colors)
  }
  if (dc.mode === 'preset') {
    const p = DASHBOARD_CHART_PRESETS[dc.preset]
    return p ? clone(p) : visualsFromLayoutColors(colors)
  }
  return mergeVisualsPartial(clone(DASHBOARD_CHART_PRESETS.romance), dc.custom || {})
}

export function applyPresetToCustom(themeStore, presetId) {
  const p = DASHBOARD_CHART_PRESETS[presetId]
  if (!p) return
  themeStore.dashboardCharts.custom = clone(p)
}
