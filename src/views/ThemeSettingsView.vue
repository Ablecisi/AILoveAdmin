<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { ADMIN_MENU_DEFS } from '@/config/adminMenu'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { ElMessage } from 'element-plus'

const theme = useThemeStore()
const { brandTitle, brandSubtitle, browserTitleSuffix, logoUrl, colors, radiusSm, radiusMd, radiusLg, shadowPreset } =
  storeToRefs(theme)

const logoInput = ref(null)

function triggerLogoPick() {
  logoInput.value?.click()
}

async function onLogoFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  try {
    await theme.setLogoFromFile(f)
    ElMessage.success('Logo 已更新')
  } catch (err) {
    ElMessage.error(err?.message || '上传失败')
  }
}

function onLogoUrlBlur() {
  theme.persist()
  theme.applyDocumentVars()
}

function onClearLogo() {
  theme.clearLogo()
  ElMessage.success('已清除')
}

function patchColor(key, val) {
  colors.value[key] = val
  theme.persist()
  theme.applyDocumentVars()
}

function onRadiiChange() {
  theme.persist()
  theme.applyDocumentVars()
}

function onShadowChange() {
  theme.persist()
  theme.applyDocumentVars()
}

function onBrandBlur() {
  theme.persist()
  theme.applyDocumentVars()
}

const menuRows = computed(() => {
  const order = theme.menuOrder.length ? theme.menuOrder : ADMIN_MENU_DEFS.map((m) => m.name)
  const merged = [...new Set([...order, ...ADMIN_MENU_DEFS.map((m) => m.name)])].filter((n) =>
    ADMIN_MENU_DEFS.some((d) => d.name === n),
  )
  return merged.map((name) => {
    const def = ADMIN_MENU_DEFS.find((m) => m.name === name)
    return {
      name,
      defaultTitle: def.defaultTitle,
      title: theme.menuTitleOverrides[name] ?? '',
      hidden: theme.menuHidden.includes(name),
    }
  })
})

function moveRow(name, dir) {
  const list = [...theme.menuOrder]
  if (!list.length) {
    theme.menuOrder = ADMIN_MENU_DEFS.map((m) => m.name)
  }
  const cur = theme.menuOrder.length ? [...theme.menuOrder] : ADMIN_MENU_DEFS.map((m) => m.name)
  const i = cur.indexOf(name)
  if (i < 0) return
  const j = i + dir
  if (j < 0 || j >= cur.length) return
  ;[cur[i], cur[j]] = [cur[j], cur[i]]
  theme.menuOrder = cur
  theme.persist()
}

function toggleHidden(name, hidden) {
  const set = new Set(theme.menuHidden)
  if (hidden) set.add(name)
  else set.delete(name)
  theme.menuHidden = [...set]
  theme.persist()
}

const titleDraft = reactive({})

function onMenuTitleBlur(name) {
  const v = (titleDraft[name] || '').trim()
  if (!v) {
    delete theme.menuTitleOverrides[name]
  } else {
    theme.menuTitleOverrides[name] = v
  }
  theme.persist()
}

function resetAll() {
  theme.resetToDefaults()
  Object.keys(titleDraft).forEach((k) => delete titleDraft[k])
  ElMessage.success('已恢复默认主题')
}

const colorPickerFields = [
  ['sidebarBg', '侧栏背景'],
  ['sidebarText', '侧栏文字'],
  ['sidebarActiveBg', '选中项背景'],
  ['sidebarActiveText', '选中项文字'],
  ['accent', '强调色'],
  ['headerBg', '顶栏背景'],
  ['headerText', '顶栏文字'],
  ['cardBg', '卡片背景'],
  ['primary', '主题主色（按钮）'],
]

watch(
  menuRows,
  () => {
    for (const row of menuRows.value) {
      if (titleDraft[row.name] === undefined) {
        titleDraft[row.name] = theme.menuTitleOverrides[row.name] || ''
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="theme-page">
    <el-card class="panel" shadow="never">
      <template #header>
        <div class="head">
          <div>
            <h2 class="h2">外观与菜单</h2>
            <p class="sub">自定义品牌、配色、圆角阴影与侧边栏顺序；设置保存在本机浏览器。</p>
          </div>
          <el-button type="danger" plain @click="resetAll">恢复默认</el-button>
        </div>
      </template>

      <el-tabs type="border-card" class="tabs">
        <el-tab-pane label="品牌与标题">
          <el-form label-width="140px" class="form-block" @submit.prevent>
            <el-form-item label="主标题">
              <el-input v-model="brandTitle" maxlength="32" show-word-limit @blur="onBrandBlur" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="brandSubtitle" maxlength="24" show-word-limit @blur="onBrandBlur" />
            </el-form-item>
            <el-form-item label="浏览器标题后缀">
              <el-input v-model="browserTitleSuffix" maxlength="40" show-word-limit @blur="onBrandBlur" />
            </el-form-item>
            <el-form-item label="Logo">
              <div class="logo-row">
                <div v-if="logoUrl" class="logo-preview-wrap">
                  <img :src="resolveMediaUrl(logoUrl)" alt="logo" class="logo-preview" />
                </div>
                <div v-else class="logo-placeholder">未设置</div>
                <input ref="logoInput" type="file" accept="image/*" class="hidden-file" @change="onLogoFile" />
                <el-button @click="triggerLogoPick">上传图片</el-button>
                <el-button v-if="logoUrl" plain @click="onClearLogo">清除</el-button>
              </div>
            </el-form-item>
            <el-form-item label="Logo 地址">
              <el-input
                v-model="logoUrl"
                placeholder="也可粘贴 https 图片地址或 data URL"
                clearable
                @blur="onLogoUrlBlur"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="配色">
          <div class="main-bg-field">
            <span class="color-label">主内容区背景</span>
            <el-input
              v-model="colors.mainBg"
              type="textarea"
              :rows="2"
              placeholder="支持 CSS：linear-gradient(...) 或 #hex"
              @blur="onBrandBlur"
            />
          </div>
          <div class="color-grid">
            <div v-for="[key, label] in colorPickerFields" :key="key" class="color-cell">
              <span class="color-label">{{ label }}</span>
              <div class="color-pick">
                <el-color-picker
                  :model-value="colors[key]"
                  show-alpha
                  @change="(v) => patchColor(key, v ?? colors[key])"
                />
              </div>
            </div>
          </div>
          <p class="hint">「主内容区背景」支持完整 CSS background；取色器项留空变更则保持原值。</p>
        </el-tab-pane>

        <el-tab-pane label="圆角与阴影">
          <el-form label-width="120px" class="form-block">
            <el-form-item label="小圆角">
              <el-slider v-model="radiusSm" :min="0" :max="24" show-input @change="onRadiiChange" />
            </el-form-item>
            <el-form-item label="中圆角">
              <el-slider v-model="radiusMd" :min="0" :max="32" show-input @change="onRadiiChange" />
            </el-form-item>
            <el-form-item label="大圆角">
              <el-slider v-model="radiusLg" :min="0" :max="40" show-input @change="onRadiiChange" />
            </el-form-item>
            <el-form-item label="阴影风格">
              <el-radio-group v-model="shadowPreset" @change="onShadowChange">
                <el-radio-button value="none">无</el-radio-button>
                <el-radio-button value="soft">轻</el-radio-button>
                <el-radio-button value="romantic">恋恋（推荐）</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="菜单顺序与标题">
          <el-table :data="menuRows" stripe class="menu-table">
            <el-table-column label="#" width="52">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="name" label="路由" width="160" />
            <el-table-column label="菜单标题">
              <template #default="{ row }">
                <el-input
                  v-model="titleDraft[row.name]"
                  :placeholder="row.defaultTitle"
                  size="small"
                  @blur="onMenuTitleBlur(row.name)"
                />
              </template>
            </el-table-column>
            <el-table-column label="显示" width="88" align="center">
              <template #default="{ row }">
                <el-switch :model-value="!row.hidden" @change="(v) => toggleHidden(row.name, !v)" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="120" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="moveRow(row.name, -1)">上移</el-button>
                <el-button link type="primary" size="small" @click="moveRow(row.name, 1)">下移</el-button>
              </template>
            </el-table-column>
          </el-table>
          <p class="hint">隐藏「外观与菜单」后，仍可通过顶栏调色按钮进入本页。</p>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.theme-page {
  max-width: 960px;
}

.panel {
  border-radius: var(--admin-radius-lg);
  box-shadow: var(--admin-shadow-card);
  background: var(--admin-card-bg);
  border: 1px solid rgba(168, 85, 247, 0.08);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--admin-header-text);
}

.sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.tabs {
  border-radius: var(--admin-radius-md);
  overflow: hidden;
}

.form-block {
  max-width: 520px;
  padding-top: 8px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.logo-preview-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--admin-radius-sm);
  overflow: hidden;
  background: var(--el-fill-color-light);
  box-shadow: var(--admin-shadow-card);
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: var(--admin-radius-sm);
  background: var(--el-fill-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hidden-file {
  display: none;
}

.main-bg-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-width: 640px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px 24px;
  padding: 8px 0 16px;
}

.color-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.color-pick {
  display: flex;
  align-items: center;
}

.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

.menu-table {
  margin-top: 8px;
  border-radius: var(--admin-radius-md);
}
</style>
