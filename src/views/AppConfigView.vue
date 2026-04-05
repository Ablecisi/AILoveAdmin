<script setup>
import { ref, onMounted } from 'vue'
import { fetchAdminAppConfig, putAppConfigValue } from '@/api/adminAppConfig'
import AdminTagEditor from '@/components/AdminTagEditor.vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const savingKey = ref('')
const rows = ref([])

function inferConfigEditorKind(valueStr) {
  const s = String(valueStr ?? '').trim()
  if (s === 'true' || s === 'false') return 'bool'
  if (/^-?\d+$/.test(s)) return 'int'
  if (s.startsWith('[')) {
    try {
      const j = JSON.parse(s)
      if (Array.isArray(j)) return 'tags'
    } catch {
      /* ignore */
    }
  }
  if (s.startsWith('{')) {
    try {
      const j = JSON.parse(s)
      if (j !== null && typeof j === 'object' && !Array.isArray(j)) return 'jsonObject'
    } catch {
      /* ignore */
    }
  }
  return 'text'
}

function mapToRows(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.keys(obj).map((k) => {
    const value = String(obj[k] ?? '')
    const kind = inferConfigEditorKind(value)
    const row = { key: k, value, kind }
    if (kind === 'tags') {
      try {
        row.tags = JSON.parse(value).map((x) => String(x))
      } catch {
        row.tags = []
      }
    }
    return row
  })
}

function onTagsUpdate(row, tags) {
  row.tags = tags
  row.value = JSON.stringify(tags)
}

function onBoolUpdate(row, v) {
  row.value = v ? 'true' : 'false'
}

function onIntUpdate(row, v) {
  if (v == null || Number.isNaN(Number(v))) row.value = '0'
  else row.value = String(Math.trunc(Number(v)))
}

async function load() {
  loading.value = true
  try {
    const { data } = await fetchAdminAppConfig()
    if (data?.code === 1 && data.data) {
      rows.value = mapToRows(data.data)
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

async function saveRow(row) {
  if (row.kind === 'jsonObject') {
    try {
      JSON.parse(row.value || '{}')
    } catch {
      ElMessage.error('JSON 对象格式无效，请检查括号与引号')
      return
    }
  }
  savingKey.value = row.key
  try {
    const { data } = await putAppConfigValue(row.key, row.value)
    if (data?.code === 1) {
      ElMessage.success(`已保存 ${row.key}`)
      await load()
    } else {
      ElMessage.error(data?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '保存失败')
  } finally {
    savingKey.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>App 配置（app_config）</span>
          <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>
      <el-alert
        type="info"
        :closable="false"
        class="mb"
        title="修改后移动端通过 GET /api/app/bootstrap 拉取。布尔/整数用开关与数字框；JSON 数组用标签编辑；JSON 对象用大文本框编辑。角色对话语气请在「数据维护 → 类型」中按类型配置。"
      />
      <el-table v-loading="loading" :data="rows" stripe style="width: 100%">
        <el-table-column prop="key" label="键" width="260" show-overflow-tooltip />
        <el-table-column label="值">
          <template #default="{ row }">
            <el-switch
              v-if="row.kind === 'bool'"
              :model-value="row.value === 'true'"
              @update:model-value="(v) => onBoolUpdate(row, v)"
            />
            <el-input-number
              v-else-if="row.kind === 'int'"
              :model-value="parseInt(row.value, 10)"
              :step="1"
              controls-position="right"
              style="width: 160px"
              @change="(v) => onIntUpdate(row, v)"
            />
            <AdminTagEditor
              v-else-if="row.kind === 'tags'"
              :model-value="row.tags"
              placeholder="配置项，回车添加"
              @update:model-value="(v) => onTagsUpdate(row, v)"
            />
            <el-input
              v-else-if="row.kind === 'jsonObject'"
              v-model="row.value"
              type="textarea"
              :rows="14"
              class="mono-json"
              placeholder='例如 {"_default":"…","companion":"…","情感陪伴":"…"}'
            />
            <el-input v-else v-model="row.value" type="textarea" :rows="2" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="savingKey === row.key"
              @click="saveRow(row)"
            >
              保存
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mb {
  margin-bottom: 12px;
}

.mono-json :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  line-height: 1.45;
}
</style>
