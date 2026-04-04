import http from './http'

export function fetchAdminAppConfig() {
  return http.get('/admin/api/v1/app-config')
}

export function putAppConfigValue(key, value) {
  return http.put(`/admin/api/v1/app-config/${encodeURIComponent(key)}`, { value })
}
