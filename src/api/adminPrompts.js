import http from './http'

export function fetchPromptTemplates() {
  return http.get('/admin/api/v1/prompt-templates')
}

export function fetchPromptTemplate(id) {
  return http.get(`/admin/api/v1/prompt-templates/${id}`)
}

export function createPromptTemplate(body) {
  return http.post('/admin/api/v1/prompt-templates', body)
}

export function updatePromptTemplate(id, body) {
  return http.put(`/admin/api/v1/prompt-templates/${id}`, body)
}
