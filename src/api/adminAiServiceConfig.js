import http from './http'

/**
 * 管理端：AI 大模型与 BERT 情绪接口配置（读写 app_config，服务端运行时生效）。
 */
export function fetchAiServiceConfig() {
  return http.get('/admin/api/v1/ai-service-config')
}

export function putAiServiceConfig(body) {
  return http.put('/admin/api/v1/ai-service-config', body)
}
