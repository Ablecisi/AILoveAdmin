import http from './http'

export function fetchAiCharacters(params) {
  return http.get('/admin/api/v1/ai-characters', { params })
}

export function fetchAiCharacter(id) {
  return http.get(`/admin/api/v1/ai-characters/${id}`)
}

export function createAiCharacter(body) {
  return http.post('/admin/api/v1/ai-characters', body)
}

export function updateAiCharacter(id, body) {
  return http.put(`/admin/api/v1/ai-characters/${id}`, body)
}

export function deleteAiCharacter(id) {
  return http.delete(`/admin/api/v1/ai-characters/${id}`)
}
