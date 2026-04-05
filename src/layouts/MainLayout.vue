<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { Brush } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const { brandTitle, brandSubtitle, logoUrl, colors } = storeToRefs(theme)

const logoSrc = computed(() => (logoUrl.value ? resolveMediaUrl(logoUrl.value) : ''))

const activeMenu = computed(() => route.path)

const menuItems = computed(() => theme.resolvedMenuItems)

const pageTitle = computed(() => {
  const name = route.name
  if (typeof name === 'string' && theme.menuTitleOverrides[name]?.trim()) {
    return theme.menuTitleOverrides[name].trim()
  }
  const hit = menuItems.value.find((m) => m.name === name)
  if (hit) return hit.title
  return route.meta?.title || ''
})

function navigate(index) {
  router.push(index === '/' ? { name: 'dashboard' } : index)
}

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}

function goAppearance() {
  router.push({ name: 'appearance' })
}
</script>

<template>
  <el-container class="layout-root">
    <el-aside width="232px" class="aside">
      <div class="brand">
        <div class="brand-mark">
          <img v-if="logoSrc" :src="logoSrc" alt="" class="brand-logo" />
          <div v-else class="brand-fallback" aria-hidden="true">
            <span class="heart">💕</span>
          </div>
        </div>
        <div class="brand-text">
          <div class="brand-title">{{ brandTitle }}</div>
          <div class="brand-sub">{{ brandSubtitle }}</div>
        </div>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          :background-color="colors.sidebarBg"
          :text-color="colors.sidebarText"
          :active-text-color="colors.sidebarActiveText"
          @select="navigate"
        >
          <el-menu-item v-for="item in menuItems" :key="item.name" :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
      <div class="aside-foot">
        <span class="foot-hint">AILove Admin</span>
      </div>
    </el-aside>
    <el-container class="right-col">
      <el-header class="header">
        <div class="header-left">
          <span class="crumb-dot" aria-hidden="true" />
          <span class="breadcrumb">{{ pageTitle }}</span>
        </div>
        <div class="header-actions">
          <el-tooltip content="外观与菜单" placement="bottom">
            <el-button class="ghost-btn" circle @click="goAppearance">
              <el-icon><Brush /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button type="danger" plain round size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <div class="main-inner">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-root {
  height: 100%;
  background: var(--admin-main-bg);
  box-shadow: var(--admin-shadow-layout);
}

.aside {
  display: flex;
  flex-direction: column;
  background: var(--admin-sidebar-bg);
  border-right: 1px solid var(--admin-sidebar-border);
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.06);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 18px;
  border-bottom: 1px solid var(--admin-sidebar-border);
}

.brand-mark {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--admin-radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: linear-gradient(145deg, rgba(244, 114, 182, 0.25), rgba(168, 85, 247, 0.2));
}

.heart {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.brand-text {
  min-width: 0;
}

.brand-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--admin-sidebar-active-text);
  letter-spacing: 0.04em;
  line-height: 1.25;
}

.brand-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-sidebar-text-muted);
}

.menu-scroll {
  flex: 1;
  padding: 10px 8px;
}

.menu {
  border-right: none;
  background: transparent !important;
  --el-menu-item-height: 48px;
}

.menu :deep(.el-menu-item) {
  border-radius: var(--admin-radius-sm);
  margin-bottom: 4px;
  font-weight: 500;
}

.menu :deep(.el-menu-item.is-active) {
  background: var(--admin-sidebar-active-bg) !important;
  box-shadow: inset 0 0 0 1px var(--admin-sidebar-active-bg);
}

.aside-foot {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--admin-sidebar-border);
}

.foot-hint {
  font-size: 11px;
  color: var(--admin-sidebar-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.right-col {
  min-width: 0;
  background: transparent;
}

.header {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: var(--admin-header-bg);
  border-bottom: 1px solid var(--admin-header-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.crumb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--admin-accent), var(--el-color-primary));
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(192, 38, 211, 0.2);
}

.breadcrumb {
  font-size: 17px;
  font-weight: 600;
  color: var(--admin-header-text);
  letter-spacing: 0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ghost-btn {
  border: 1px solid rgba(168, 85, 247, 0.25);
  background: rgba(255, 255, 255, 0.5);
  color: var(--el-color-primary);
}

.main {
  background: transparent;
  padding: 22px 24px 28px;
  min-height: calc(100vh - 58px);
}

.main-inner {
  max-width: 1440px;
  margin: 0 auto;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
