import http from './http'
import { types } from './adminData'

/** 下拉选项展示：仅昵称；无昵称时用登录名 */
export function formatUserOptionLabel(u) {
  if (!u) return ''
  const n = (u.name || '').trim()
  if (n) return n
  return u.username || `用户${u.id}`
}

/** 表格等：根据已加载用户列表显示昵称 */
export function resolveUserNickname(id, userOptions) {
  if (id == null || id === '') return '—'
  const uid = typeof id === 'string' ? Number(id) : id
  const u = userOptions.find((x) => x.id === uid || String(x.id) === String(id))
  return u ? formatUserOptionLabel(u) : `#${id}`
}

/** 类型下拉：{ id, name }[] */
export async function loadTypeOptions() {
  const { data } = await types.list()
  if (data?.code === 1 && Array.isArray(data.data)) {
    return data.data.map((t) => ({ id: t.id, name: t.name }))
  }
  return []
}

/**
 * 用户下拉（分页拉取合并，用于选择归属用户 / 作者）
 * @param {number} maxTotal 最多条数上限
 */
export async function loadUserOptions(maxTotal = 500) {
  const pageSize = 100
  const out = []
  let page = 1
  while (out.length < maxTotal) {
    const { data } = await http.get('/admin/api/v1/users', {
      params: { page, size: pageSize },
    })
    if (data?.code !== 1 || !data.data?.records) break
    const rec = data.data.records
    for (const u of rec) {
      out.push({
        id: u.id,
        username: u.username,
        name: u.name,
      })
    }
    if (rec.length < pageSize) break
    page += 1
  }
  return out
}

/** 文章简要：{ id, title }[] */
export async function loadArticleOptions(maxTotal = 300) {
  const pageSize = 50
  const out = []
  let page = 1
  while (out.length < maxTotal) {
    const { data } = await http.get('/admin/api/v1/articles', {
      params: { page, size: pageSize },
    })
    if (data?.code !== 1 || !data.data?.records) break
    const rec = data.data.records
    for (const a of rec) {
      out.push({ id: a.id, title: a.title || '' })
    }
    if (rec.length < pageSize) break
    page += 1
  }
  return out
}

/** 帖子简要：{ id, label }[] */
export async function loadPostOptions(maxTotal = 300) {
  const pageSize = 50
  const out = []
  let page = 1
  while (out.length < maxTotal) {
    const { data } = await http.get('/admin/api/v1/posts', {
      params: { page, size: pageSize },
    })
    if (data?.code !== 1 || !data.data?.records) break
    const rec = data.data.records
    for (const p of rec) {
      const c = (p.content || '').replace(/\s+/g, ' ').trim().slice(0, 40)
      out.push({
        id: p.id,
        label: c ? `#${p.id} ${c}` : `#${p.id}`,
      })
    }
    if (rec.length < pageSize) break
    page += 1
  }
  return out
}
