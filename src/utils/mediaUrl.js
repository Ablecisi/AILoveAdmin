const base = import.meta.env.VITE_API_BASE ?? ''

/**
 * 将库内相对路径（如 /uploads/...）或绝对 URL 转为可请求的地址
 */
export function resolveMediaUrl(path) {
  if (path == null) return ''
  const p = String(path).trim()
  if (!p) return ''
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('blob:')) return p
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  return `${b}${p.startsWith('/') ? p : `/${p}`}`
}
