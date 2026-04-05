<script setup>
import { ref, onMounted } from 'vue'
import * as D from '@/api/adminData'
import { loadUserOptions, resolveUserNickname } from '@/api/adminLookups'
import { emotionStatKeyLabel, emotionStatTagAttrs } from '@/utils/adminLabels'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const userOptions = ref([])

async function ensureUsers() {
  if (!userOptions.value.length) {
    try {
      userOptions.value = await loadUserOptions()
    } catch {
      /* ignore */
    }
  }
}

function onSizeChange() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const { data } = await D.emotionLogs.page({ page: page.value, size: size.value })
    if (data?.code === 1 && data.data) {
      rows.value = data.data.records ?? []
      total.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`删除情绪日志 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.emotionLogs.del(row.id)
    if (data?.code === 1) {
      ElMessage.success('已删除')
      load()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

onMounted(async () => {
  await ensureUsers()
  load()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="head">
        <span>情绪日志</span>
        <div>
          <span class="hint">对话中每次情绪识别成功会写入一条（含用户消息 ID）</span>
          <el-button class="ml" @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <div class="table-wrap">
      <el-table v-loading="loading" :data="rows" stripe table-layout="auto" style="width: 100%">
        <el-table-column prop="id" label="ID" width="64" fixed="left" />
        <el-table-column label="用户" min-width="108" show-overflow-tooltip>
          <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
        </el-table-column>
        <el-table-column prop="messageId" label="消息" width="88" />
        <el-table-column label="情绪" width="104">
          <template #default="{ row }">
            <el-tag size="small" v-bind="emotionStatTagAttrs(row.emotion)">{{
              emotionStatKeyLabel(row.emotion) || row.emotion || '—'
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="88" />
        <el-table-column prop="createTime" label="时间" width="158" />
        <el-table-column label="操作" width="72" fixed="right" align="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      class="pager"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="load"
      @size-change="onSizeChange"
    />
  </el-card>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ml {
  margin-left: 8px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.table-wrap :deep(.el-table) {
  min-width: 720px;
}
</style>
