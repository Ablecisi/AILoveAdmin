<script setup>
import { ref, onMounted } from 'vue'
import { fetchAdminAppConfig, putAppConfigValue } from '@/api/adminAppConfig'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const savingKey = ref('')
const rows = ref([])

function mapToRows(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.keys(obj).map((k) => ({ key: k, value: obj[k] ?? '' }))
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
        title="修改后移动端通过 GET /api/app/bootstrap 拉取；键名与库表 config_key 一致。"
      />
      <el-table v-loading="loading" :data="rows" stripe style="width: 100%">
        <el-table-column prop="key" label="键" width="240" />
        <el-table-column label="值">
          <template #default="{ row }">
            <el-input v-model="row.value" type="textarea" :rows="2" />
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
</style>
