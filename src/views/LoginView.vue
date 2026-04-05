<script setup>
import {ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import {useAuthStore} from '@/stores/auth'
import {useThemeStore} from '@/stores/theme'
import {resolveMediaUrl} from '@/utils/mediaUrl'
import {ElMessage} from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const {brandTitle, brandSubtitle, logoUrl} = storeToRefs(theme)

const loginHeadline = computed(() => brandTitle.value || 'AI恋恋')
const loginSub = computed(() => brandSubtitle.value || '运营中枢')
const logoSrc = computed(() => (logoUrl.value ? resolveMediaUrl(logoUrl.value) : ''))

const username = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!username.value?.trim() || !password.value) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    await theme.hydrateThemeFromServer()
    ElMessage.success('登录成功')
    const redirect = route.query.redirect
    let path = null
    if (typeof redirect === 'string') {
      const m = redirect.match(/#(\/.*)$/)
      path = m ? m[1] : redirect.startsWith('/') ? redirect : null
    }
    router.replace(path || {name: 'dashboard'})
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg-blob" aria-hidden="true"/>
    <el-card class="login-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div v-if="logoSrc" class="login-logo-wrap">
            <img :src="logoSrc" alt="" class="login-logo"/>
          </div>
          <div v-else class="login-icon-fallback">💕</div>
          <div class="card-titles">
            <div class="card-title">{{ loginHeadline }}</div>
            <div class="card-sub">{{ loginSub }}</div>
          </div>
        </div>
      </template>
      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input
              :prefix-icon="'user'"
              v-model="username"
              placeholder="管理员账号"
              clearable
              autocomplete="username"
              />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
              :prefix-icon="'lock'"
              v-model="password"
              type="password"
              placeholder="密码"
              show-password
              autocomplete="current-password"
          />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" native-type="submit" style="width: 100%">
          登录
        </el-button>
      </el-form>
      <el-alert
          class="hint"
          type="info"
          :closable="false"
          title="默认账号 admin / admin123（首次启动由后端初始化，生产请立即改密）。"
      />
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-login-bg);
  padding: 24px;
  overflow: hidden;
}

.login-bg-blob {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(203, 194, 248) 0%, transparent 70%);
  top: -120px;
  right: -80px;
  pointer-events: none;
  filter: blur(2px);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: var(--admin-radius-lg);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: var(--admin-shadow-card), 0 0 10px 1px rgb(210, 194, 255);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.login-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(168, 85, 247, 0.1);
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.login-logo-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--admin-radius-md);
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  box-shadow: 0 4px 16px rgba(109, 40, 217, 0.12);
}

.login-logo {
  width: 150%;
  height: 150%;
  object-fit: contain;
}

.login-icon-fallback {
  width: 56px;
  height: 56px;
  border-radius: var(--admin-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(145deg, rgba(244, 114, 182, 0.2), rgba(168, 85, 247, 0.18));
}

.card-titles {
  min-width: 0;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: var(--admin-login-bg);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.card-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.submit-btn {
  margin-top: 8px;
}

.hint {
  margin-top: 20px;
}
</style>
