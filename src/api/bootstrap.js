import http from './http'

/**
 * 公开接口，与移动端共用；开发环境下走 Vite 代理。
 */
export function fetchBootstrap() {
  return http.get('/api/app/bootstrap')
}
