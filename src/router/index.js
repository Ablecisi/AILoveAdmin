import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ADMIN_MENU_DEFS } from '@/config/adminMenu'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '驾驶舱' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'characters',
        name: 'characters',
        component: () => import('@/views/CharactersView.vue'),
        meta: { title: 'AI 角色' },
      },
      {
        path: 'articles',
        name: 'articles',
        component: () => import('@/views/ArticlesView.vue'),
        meta: { title: '文章运营' },
      },
      {
        path: 'posts',
        name: 'posts',
        component: () => import('@/views/PostsView.vue'),
        meta: { title: '帖子管理' },
      },
      {
        path: 'interactions',
        name: 'interactions',
        component: () => import('@/views/InteractionsView.vue'),
        meta: { title: '互动关系' },
      },
      {
        path: 'emotion-logs',
        name: 'emotion-logs',
        component: () => import('@/views/EmotionLogsView.vue'),
        meta: { title: '情绪日志' },
      },
      {
        path: 'comments',
        name: 'comments',
        component: () => import('@/views/CommentsView.vue'),
        meta: { title: '评论管理' },
      },
      {
        path: 'dialogs',
        name: 'dialogs',
        component: () => import('@/views/DialogsView.vue'),
        meta: { title: '会话与消息' },
      },
      {
        path: 'prompts',
        name: 'prompts',
        component: () => import('@/views/PromptsView.vue'),
        meta: { title: 'Prompt 模板' },
      },
      {
        path: 'ai-service-config',
        name: 'ai-service-config',
        component: () => import('@/views/AiServiceConfigView.vue'),
        meta: { title: 'AI 服务配置' },
      },
      {
        path: 'data-maintenance',
        name: 'data-maintenance',
        component: () => import('@/views/DataMaintenanceView.vue'),
        meta: { title: '数据维护' },
      },
      {
        path: 'appearance',
        name: 'appearance',
        component: () => import('@/views/ThemeSettingsView.vue'),
        meta: { title: '外观与菜单' },
      },
      {
        path: 'app-config',
        name: 'app-config',
        component: () => import('@/views/AppConfigView.vue'),
        meta: { title: 'App 配置 / Bootstrap' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const theme = useThemeStore()
  const def = typeof to.name === 'string' ? ADMIN_MENU_DEFS.find((m) => m.name === to.name) : undefined
  const custom = typeof to.name === 'string' ? theme.menuTitleOverrides[to.name]?.trim() : ''
  const pageTitle = custom || def?.defaultTitle || to.meta?.title || ''
  const suffix = theme.browserTitleSuffix?.trim() || 'AI恋恋 运营后台'
  document.title = pageTitle ? `${pageTitle} · ${suffix}` : suffix
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.token && to.name === 'login') {
      next({ name: 'dashboard' })
      return
    }
    next()
    return
  }
  if (to.meta.requiresAuth && !auth.token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
