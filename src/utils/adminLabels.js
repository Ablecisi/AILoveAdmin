/** AI 角色性别（与后台 0/1/2 一致） */
export function genderLabel(g) {
  if (g === 0) return '男'
  if (g === 1) return '女'
  if (g === 2) return '其他'
  return '—'
}

export function onlineTagType(online) {
  return online === 1 ? 'success' : 'info'
}

export function onlineLabel(online) {
  return online === 1 ? '在线' : '离线'
}

export function enabledTagType(status) {
  return status === 1 ? 'success' : 'danger'
}

export function enabledLabel(status) {
  return status === 1 ? '启用' : '停用'
}

export function messageTypeLabel(type) {
  if (type === 0) return '用户'
  if (type === 1) return 'AI'
  return type == null ? '—' : String(type)
}

export function boolYesNoTagType(v) {
  return v ? 'success' : 'info'
}

export function deletedLabel(deleted) {
  return deleted ? '已隐藏' : '正常'
}

/** 语气偏好等：表格里拆成标签展示（不改变原字符串语义） */
export function splitToneForDisplay(s) {
  if (s == null || !String(s).trim()) return []
  const str = String(s).trim()
  try {
    const j = JSON.parse(str)
    if (Array.isArray(j)) return j.map(String).filter(Boolean)
    if (j && typeof j === 'object') return []
  } catch {
    /* ignore */
  }
  return str.split(/[,，;；]/).map((x) => x.trim()).filter(Boolean)
}

/** 情绪统计 JSON 或文本 → 展示用标签文案 */
export function emotionStatsToLabels(s) {
  if (s == null || !String(s).trim()) return []
  const str = String(s).trim()
  try {
    const j = JSON.parse(str)
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      return Object.entries(j).map(([k, v]) => `${k}：${v}`)
    }
    if (Array.isArray(j)) return j.map(String)
  } catch {
    /* ignore */
  }
  return str.split(/[,，]/).map((x) => x.trim()).filter(Boolean)
}

/** 编辑画像：情绪统计 → 「键:值」标签列表 */
export function parseEmotionStatsToTagStrings(s) {
  if (s == null || !String(s).trim()) return []
  const str = String(s).trim()
  try {
    const j = JSON.parse(str)
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      return Object.entries(j).map(([k, v]) => `${k}:${v}`)
    }
  } catch {
    /* ignore */
  }
  return emotionStatsToLabels(s).map((x) => x.replace('：', ':'))
}

/** 保存画像：标签列表 → JSON 对象字符串 */
export function serializeEmotionStatsFromTagStrings(tags) {
  const o = {}
  for (const t of tags || []) {
    const m = /^([^:]+):(.+)$/.exec(String(t).trim())
    if (m) {
      const k = m[1].trim()
      const raw = m[2].trim()
      const num = Number(raw)
      o[k] = Number.isNaN(num) ? raw : num
    }
  }
  return Object.keys(o).length ? JSON.stringify(o) : ''
}

/** 用户画像情绪统计：标准键（与识别标签一致） */
export const EMOTION_STAT_KEYS = ['neutral', 'angry', 'happy', 'sad', 'fear', 'surprise']

export function emotionStatKeyLabel(key) {
  const k = String(key).toLowerCase()
  const map = {
    neutral: '平静',
    angry: '愤怒',
    happy: '愉快',
    sad: '悲伤',
    fear: '恐惧',
    surprise: '惊讶',
  }
  return map[k] || key
}

export function emotionStatTagType(key) {
  const k = String(key).toLowerCase()
  if (k === 'neutral') return 'info'
  if (k === 'angry') return 'danger'
  if (k === 'happy') return 'success'
  if (k === 'sad') return 'primary'
  if (k === 'fear') return 'warning'
  if (k === 'surprise') return 'info'
  return 'info'
}

/** 惊讶单独用紫色，避免与其它类型撞色 */
export function emotionStatTagColor(key) {
  const k = String(key).toLowerCase()
  if (k === 'surprise') return '#8e44ad'
  return undefined
}

export function emotionStatTagAttrs(key) {
  const c = emotionStatTagColor(key)
  if (c) return { color: c }
  return { type: emotionStatTagType(key) }
}

function emotionStatsToRawEntries(s) {
  if (s == null || !String(s).trim()) return []
  const str = String(s).trim()
  try {
    const j = JSON.parse(str)
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      const keys = Object.keys(j)
      const rank = (k) => {
        const i = EMOTION_STAT_KEYS.indexOf(k)
        return i === -1 ? 100 + k.charCodeAt(0) : i
      }
      keys.sort((a, b) => rank(a) - rank(b))
      return keys.map((k) => ({ key: k, value: j[k] }))
    }
  } catch {
    /* ignore */
  }
  return emotionStatsToLabels(s).map((t) => {
    const m = /^([^：:]+)[：:]\s*(.+)$/.exec(String(t).trim())
    return m ? { key: m[1].trim(), value: m[2].trim() } : { key: String(t), value: '' }
  })
}

/** 列表用：非零（或非空字符串）情绪条目 */
export function emotionStatsToDisplayEntries(s) {
  return emotionStatsToRawEntries(s).filter((e) => {
    if (e.value === null || e.value === undefined) return false
    if (typeof e.value === 'string' && e.value.trim() === '') return false
    const n = Number(e.value)
    if (!Number.isNaN(n) && n === 0) return false
    return true
  })
}

/** 编辑表单：JSON → 各键次数 */
export function parseEmotionStatsToCounts(s) {
  const o = Object.fromEntries(EMOTION_STAT_KEYS.map((k) => [k, 0]))
  if (s == null || !String(s).trim()) return o
  try {
    const j = JSON.parse(String(s).trim())
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      for (const k of EMOTION_STAT_KEYS) {
        if (j[k] != null && j[k] !== '') {
          const n = Number(j[k])
          o[k] = Number.isNaN(n) ? 0 : n
        }
      }
    }
  } catch {
    /* ignore */
  }
  return o
}

/** 存库：仅包含次数 > 0 的键；全 0 则为 "{}" */
export function serializeEmotionCountsToJson(counts) {
  const out = {}
  for (const k of EMOTION_STAT_KEYS) {
    const n = Number(counts[k])
    if (!Number.isNaN(n) && n > 0) out[k] = n
  }
  return Object.keys(out).length ? JSON.stringify(out) : '{}'
}
