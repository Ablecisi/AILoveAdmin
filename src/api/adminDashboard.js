import http from './http'

function readTotal(res) {
  const d = res?.data
  if (d?.code === 1 && d.data && d.data.total != null) {
    return Number(d.data.total) || 0
  }
  return null
}

/**
 * 并行拉取各模块分页接口的 total（兼容旧用法）
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

/**
 * 驾驶舱聚合：全量规模、14 日 DAU、兴趣关系图等
 */
export async function fetchDashboardOverview() {
  const { data } = await http.get('/admin/api/v1/dashboard/overview')
  if (data?.code === 1 && data.data) return data.data
  throw new Error(data?.msg || '驾驶舱数据加载失败')
}
