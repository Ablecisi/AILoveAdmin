import http from './http'

export function fetchAdminPosts(params) {
  return http.get('/admin/api/v1/posts', { params })
}

export function fetchAdminPost(id) {
  return http.get(`/admin/api/v1/posts/${id}`)
}

export function createAdminPost(body) {
  return http.post('/admin/api/v1/posts', body)
}

export function updateAdminPost(id, body) {
  return http.put(`/admin/api/v1/posts/${id}`, body)
}

export function deleteAdminPost(id) {
  return http.delete(`/admin/api/v1/posts/${id}`)
}
