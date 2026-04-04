import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin } from '@/api/adminAuth'

const STORAGE_KEY = 'ailove_admin_token'

/** 管理端 JWT（Bearer），由 POST /admin/api/v1/auth/login 签发 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(STORAGE_KEY) || '')

  const isLoggedIn = computed(() => Boolean(token.value))

  function setToken(t) {
    token.value = t || ''
    if (t) {
      localStorage.setItem(STORAGE_KEY, t)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function login(username, password) {
    const { data } = await adminLogin(username, password)
    if (data?.code !== 1 || !data?.data?.token) {
      throw new Error(data?.msg || '登录失败')
    }
    setToken(data.data.token)
  }

  function logout() {
    setToken('')
  }

  return {
    token,
    isLoggedIn,
    setToken,
    login,
    logout,
  }
})
