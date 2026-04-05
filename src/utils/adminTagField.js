/**
 * 解析后端 traits/interests 等：支持 JSON 数组或中英文逗号分隔
 * @param {string|null|undefined} raw
 * @returns {string[]}
 */
export function parseTagLikeString(raw) {
  if (raw == null) return []
  const s = String(raw).trim()
  if (!s) return []
  if (s.startsWith('[')) {
    try {
      const j = JSON.parse(s)
      if (!Array.isArray(j)) return []
      return j.map((x) => String(x).trim()).filter(Boolean)
    } catch {
      return []
    }
  }
  return s.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
}

/** 存库：统一为 JSON 字符串数组 */
export function serializeTagsAsJson(arr) {
  const list = (arr || []).map((x) => String(x).trim()).filter(Boolean)
  return JSON.stringify(list)
}
