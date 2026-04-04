import http from './http'

export function fetchAdminConversations(params) {
  return http.get('/admin/api/v1/conversations', { params })
}

export function fetchAdminMessages(params) {
  return http.get('/admin/api/v1/messages', { params })
}
