import http from './http'

export function fetchAdminComments(params) {
  return http.get('/admin/api/v1/comments', { params })
}

export function fetchAdminComment(id) {
  return http.get(`/admin/api/v1/comments/${id}`)
}

export function updateAdminComment(id, body) {
  return http.put(`/admin/api/v1/comments/${id}`, body)
}

export function deleteAdminComment(id) {
  return http.delete(`/admin/api/v1/comments/${id}`)
}

export function purgeAdminComment(id) {
  return http.delete(`/admin/api/v1/comments/${id}/purge`)
}
