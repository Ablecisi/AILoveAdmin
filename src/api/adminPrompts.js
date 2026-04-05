import http from './http'

/** @param {import('axios').AxiosRequestConfig['data']} body */
export function draftPromptTemplate(body) {
  return http.post('/admin/api/v1/prompt-templates/draft', body)
}

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
