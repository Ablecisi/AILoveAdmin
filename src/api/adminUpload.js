import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE ?? ''

/**
 * 上传图片到后台，返回库内路径（如 /uploads/2026/04/xxx.jpg）
 */
export async function uploadAdminImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  const headers = {}
  const token = useAuthStore().token
  if (token) headers.Authorization = `Bearer ${token}`
  const url = `${baseURL.replace(/\/$/, '')}/admin/api/v1/uploads/image`
  const res = await fetch(url, { method: 'POST', headers, body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.msg || res.statusText || '上传失败')
  }
  if (data?.code === 1 && data.data?.url) return data.data.url
  throw new Error(data?.msg || '上传失败')
}
