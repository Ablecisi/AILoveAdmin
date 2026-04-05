import { defineStore } from 'pinia'
import { ADMIN_MENU_DEFS } from '@/config/adminMenu'
import {
  defaultChartCustomVisuals,
  mergeVisualsPartial,
  DASHBOARD_CHART_PRESETS,
} from '@/config/dashboardChartTheme'

const STORAGE_KEY = 'ailove-admin-theme-v1'
/** 存于 app_config，换服务器后仍可恢复管理端外观与驾驶舱图表配置 */
export const ADMIN_THEME_REMOTE_KEY = 'admin.ui.theme'

let remotePersistTimer = null

function defaultColors() {
  return {
    sidebarBg: '#14101f',
    sidebarBorder: 'rgba(244, 114, 182, 0.14)',
    sidebarText: '#d4c4e8',
    sidebarTextMuted: 'rgba(212, 196, 232, 0.5)',
    sidebarActiveBg: 'rgba(244, 114, 182, 0.14)',
    sidebarActiveText: '#fce7f3',
    accent: '#f472b6',
    headerBg: 'rgba(255, 255, 255, 0.78)',
    headerBorder: 'rgba(168, 85, 247, 0.14)',
    headerText: '#1e1b2e',
    mainBg: 'linear-gradient(165deg, #faf6ff 0%, #f3ecfb 42%, #efe8f7 100%)',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    primary: '#fbd4ff',
  }
}

function defaultDashboardCharts() {
  return {
    /** follow: 跟随外观主色/强调色；preset: 五套预制；custom: 逐项覆盖 */
    mode: 'follow',
    preset: 'romance',
    custom: defaultChartCustomVisuals(),
  }
}

function mergeDashboardChartsState(patch) {
  const base = defaultDashboardCharts()
  if (!patch || typeof patch !== 'object') return base
  const mode = patch.mode
  const preset = patch.preset
  return {
    mode: mode === 'follow' || mode === 'preset' || mode === 'custom' ? mode : base.mode,
    preset: preset && DASHBOARD_CHART_PRESETS[preset] ? preset : base.preset,
    custom: mergeVisualsPartial(base.custom, patch.custom || {}),
  }
}

function defaultState() {
  const menuOrder = ADMIN_MENU_DEFS.map((m) => m.name)
  return {
    brandTitle: 'AI恋恋',
    brandSubtitle: '运营中枢',
    browserTitleSuffix: 'AI恋恋 运营后台',
    logoUrl: '',
    colors: defaultColors(),
    radiusSm: 10,
    radiusMd: 14,
    radiusLg: 20,
    /** none | soft | romantic */
    shadowPreset: 'romantic',
    menuOrder,
    menuTitleOverrides: {},
    /** route names hidden from sidebar */
    menuHidden: [],
    dashboardCharts: defaultDashboardCharts(),
    /** 是否把主题写入服务端 app_config（与 localStorage 双写） */
    syncThemeToServer: true,
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function mergeMenuOrder(savedOrder) {
  const names = ADMIN_MENU_DEFS.map((m) => m.name)
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return [...names]
  const seen = new Set()
  const out = []
  for (const n of savedOrder) {
    if (names.includes(n) && !seen.has(n)) {
      out.push(n)
      seen.add(n)
    }
  }
  for (const n of names) {
    if (!seen.has(n)) out.push(n)
  }
  return out
}

function deepMerge(base, patch) {
  const out = { ...base }
  if (!patch) return out
  for (const k of Object.keys(patch)) {
    if (k === 'colors' && patch.colors && typeof patch.colors === 'object') {
      out.colors = { ...base.colors, ...patch.colors }
    } else if (Array.isArray(patch[k])) {
      out[k] = [...patch[k]]
    } else if (patch[k] !== undefined) {
      out[k] = patch[k]
    }
  }
  return out
}

export const useThemeStore = defineStore('theme', {
  state: () => {
    const base = defaultState()
    const saved = loadPersisted()
    if (!saved) return base
    const merged = deepMerge(base, saved)
    merged.menuOrder = mergeMenuOrder(saved.menuOrder)
    merged.menuTitleOverrides =
      saved.menuTitleOverrides && typeof saved.menuTitleOverrides === 'object'
        ? { ...saved.menuTitleOverrides }
        : {}
    merged.menuHidden = Array.isArray(saved.menuHidden) ? [...saved.menuHidden] : []
    merged.colors = { ...defaultColors(), ...(saved.colors || {}) }
    merged.dashboardCharts = mergeDashboardChartsState(saved.dashboardCharts)
    if (typeof saved.syncThemeToServer === 'boolean') {
      merged.syncThemeToServer = saved.syncThemeToServer
    }
    return merged
  },

  getters: {
    shadowCss() {
      switch (this.shadowPreset) {
        case 'none':
          return 'none'
        case 'soft':
          return '0 4px 20px rgba(88, 28, 135, 0.07)'
        case 'romantic':
        default:
          return '0 8px 32px rgba(126, 34, 206, 0.1), 0 2px 8px rgba(244, 114, 182, 0.06)'
      }
    },

    cardShadowCss() {
      switch (this.shadowPreset) {
        case 'none':
          return 'none'
        case 'soft':
          return '0 2px 12px rgba(88, 28, 135, 0.06)'
        case 'romantic':
        default:
          return '0 4px 24px rgba(109, 40, 217, 0.08), 0 1px 4px rgba(236, 72, 153, 0.05)'
      }
    },

    resolvedMenuItems() {
      const order = mergeMenuOrder(this.menuOrder)
      const hidden = new Set(this.menuHidden)
      const items = []
      for (const name of order) {
        if (hidden.has(name)) continue
        const def = ADMIN_MENU_DEFS.find((m) => m.name === name)
        if (!def) continue
        const title = this.menuTitleOverrides[name] || def.defaultTitle
        items.push({
          name: def.name,
          path: def.path,
          index: def.path === '/' ? '/' : def.path,
          icon: def.icon,
          title,
        })
      }
      return items
    },
  },

  actions: {
    /** 仅写 localStorage，不触发服务端推送（用于拉取远程后回写） */
    persistLocalOnly() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serializePayload()))
      } catch (e) {
        console.warn('theme persist failed', e)
      }
    },

    serializePayload() {
      return {
        v: 1,
        brandTitle: this.brandTitle,
        brandSubtitle: this.brandSubtitle,
        browserTitleSuffix: this.browserTitleSuffix,
        logoUrl: this.logoUrl,
        colors: this.colors,
        radiusSm: this.radiusSm,
        radiusMd: this.radiusMd,
        radiusLg: this.radiusLg,
        shadowPreset: this.shadowPreset,
        menuOrder: this.menuOrder,
        menuTitleOverrides: this.menuTitleOverrides,
        menuHidden: this.menuHidden,
        dashboardCharts: this.dashboardCharts,
        syncThemeToServer: this.syncThemeToServer,
      }
    },

    persist() {
      this.persistLocalOnly()
      if (!this.syncThemeToServer) return
      if (remotePersistTimer) clearTimeout(remotePersistTimer)
      remotePersistTimer = setTimeout(() => {
        remotePersistTimer = null
        this.pushThemeToServer()
      }, 800)
    },

    async pushThemeToServer() {
      if (!this.syncThemeToServer) return
      try {
        const { putAppConfigValue } = await import('@/api/adminAppConfig')
        await putAppConfigValue(ADMIN_THEME_REMOTE_KEY, JSON.stringify(this.serializePayload()))
      } catch (e) {
        console.warn('[theme] push to server failed', e)
      }
    },

    /**
     * 登录后或进入后台时调用：以 app_config 中的 admin.ui.theme 为准合并到当前 store，并回写 localStorage。
     */
    async hydrateThemeFromServer() {
      try {
        const { fetchAdminAppConfig } = await import('@/api/adminAppConfig')
        const { data } = await fetchAdminAppConfig()
        if (data?.code !== 1 || !data.data) return
        const raw = data.data[ADMIN_THEME_REMOTE_KEY]
        if (!raw || typeof raw !== 'string') return
        const remote = JSON.parse(raw)
        if (!remote || typeof remote !== 'object') return
        this.applyRemotePayload(remote)
        this.applyDocumentVars()
        this.persistLocalOnly()
      } catch (e) {
        console.warn('[theme] hydrate from server failed', e)
      }
    },

    applyRemotePayload(remote) {
      const { v: _schema, ...rest } = remote || {}
      const base = defaultState()
      const merged = deepMerge(base, rest)
      merged.menuOrder = mergeMenuOrder(rest.menuOrder || merged.menuOrder)
      merged.menuTitleOverrides =
        rest.menuTitleOverrides && typeof rest.menuTitleOverrides === 'object'
          ? { ...rest.menuTitleOverrides }
          : {}
      merged.menuHidden = Array.isArray(rest.menuHidden) ? [...rest.menuHidden] : []
      merged.colors = { ...defaultColors(), ...(rest.colors || {}) }
      merged.dashboardCharts = mergeDashboardChartsState(rest.dashboardCharts)
      if (typeof rest.syncThemeToServer === 'boolean') {
        merged.syncThemeToServer = rest.syncThemeToServer
      }
      this.$patch(merged)
    },

    applyDocumentVars() {
      const root = document.documentElement
      const c = this.colors
      const set = (k, v) => root.style.setProperty(k, v)

      set('--admin-sidebar-bg', c.sidebarBg)
      set('--admin-sidebar-border', c.sidebarBorder)
      set('--admin-sidebar-text', c.sidebarText)
      set('--admin-sidebar-text-muted', c.sidebarTextMuted)
      set('--admin-sidebar-active-bg', c.sidebarActiveBg)
      set('--admin-sidebar-active-text', c.sidebarActiveText)
      set('--admin-accent', c.accent)
      set('--admin-header-bg', c.headerBg)
      set('--admin-header-border', c.headerBorder)
      set('--admin-header-text', c.headerText)
      set('--admin-main-bg', c.mainBg)
      set('--admin-card-bg', c.cardBg)
      set('--admin-radius-sm', `${this.radiusSm}px`)
      set('--admin-radius-md', `${this.radiusMd}px`)
      set('--admin-radius-lg', `${this.radiusLg}px`)
      set('--admin-shadow-layout', this.shadowCss)
      set('--admin-shadow-card', this.cardShadowCss)
      set('--el-color-primary', c.primary)

      const loginGrad = `linear-gradient(152deg, ${c.sidebarBg} 0%, #2d1b4e 52%, #3b0764 100%)`
      set('--admin-login-bg', loginGrad)
    },

    resetToDefaults() {
      const d = defaultState()
      this.$patch(d)
      this.persist()
      this.applyDocumentVars()
    },

    /** 仅恢复驾驶舱 ECharts 配色为出厂默认（跟随外观 + 恋恋预制数据），不影响侧栏/品牌等 */
    resetDashboardChartsToDefaults() {
      this.dashboardCharts = defaultDashboardCharts()
      this.persist()
    },

    async setLogoFromFile(file) {
      if (!file || !file.type?.startsWith('image/')) {
        throw new Error('请选择图片文件')
      }
      try {
        const { uploadAdminImage } = await import('@/api/adminUpload')
        this.logoUrl = await uploadAdminImage(file)
        this.persist()
        this.applyDocumentVars()
        return
      } catch {
        /* 接口不可用时退回本地 data URL（仅小图） */
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('上传失败且图片较大，请配置后端上传或使用图片地址')
      }
      const reader = new FileReader()
      await new Promise((resolve, reject) => {
        reader.onload = () => {
          this.logoUrl = reader.result
          this.persist()
          this.applyDocumentVars()
          resolve()
        }
        reader.onerror = () => reject(new Error('读取失败'))
        reader.readAsDataURL(file)
      })
    },

    clearLogo() {
      this.logoUrl = ''
      this.persist()
      this.applyDocumentVars()
    },

  },
})
