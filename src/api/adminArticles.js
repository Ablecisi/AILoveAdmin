import http from './http'

export function fetchAdminArticles(params) {
  return http.get('/admin/api/v1/articles', { params })
}

export function fetchAdminArticle(id) {
  return http.get(`/admin/api/v1/articles/${id}`)
}

export function createAdminArticle(body) {
  return http.post('/admin/api/v1/articles', body)
}

export function updateAdminArticle(id, body) {
  return http.put(`/admin/api/v1/articles/${id}`, body)
}

export function deleteAdminArticle(id) {
  return http.delete(`/admin/api/v1/articles/${id}`)
}
