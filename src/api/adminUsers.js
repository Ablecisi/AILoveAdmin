import http from './http'

export function fetchAdminUsers(params) {
  return http.get('/admin/api/v1/users', { params })
}

export function fetchAdminUser(id) {
  return http.get(`/admin/api/v1/users/${id}`)
}

export function createAdminUser(body) {
  return http.post('/admin/api/v1/users', body)
}

export function updateAdminUser(id, body) {
  return http.put(`/admin/api/v1/users/${id}`, body)
}

export function deleteAdminUser(id) {
  return http.delete(`/admin/api/v1/users/${id}`)
}
