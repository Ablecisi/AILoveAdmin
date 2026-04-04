import http from './http'

export function adminLogin(username, password) {
  return http.post('/admin/api/v1/auth/login', { username, password })
}
