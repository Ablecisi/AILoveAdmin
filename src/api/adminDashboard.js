import http from './http'

function readTotal(res) {
  const d = res?.data
  if (d?.code === 1 && d.data && d.data.total != null) {
    return Number(d.data.total) || 0
  }
  return null
}

/**
 * 并行拉取各模块分页接口的 total，用于驾驶舱 KPI（单条失败返回 null）
 */
export async function fetchDashboardTotals() {
  const specs = [
    ['users', '/admin/api/v1/users', { page: 1, size: 1 }],
    ['characters', '/admin/api/v1/ai-characters', { page: 1, size: 1 }],
    ['articles', '/admin/api/v1/articles', { page: 1, size: 1 }],
    ['comments', '/admin/api/v1/comments', { page: 1, size: 1 }],
    ['conversations', '/admin/api/v1/conversations', { page: 1, size: 1 }],
    ['messages', '/admin/api/v1/messages', { page: 1, size: 1 }],
  ]
  const settled = await Promise.allSettled(specs.map(([, url, params]) => http.get(url, { params })))
  const out = {}
  specs.forEach(([key], i) => {
    const r = settled[i]
    out[key] = r.status === 'fulfilled' ? readTotal(r.value) : null
  })
  return out
}
