<script setup>
import { ref, watch, reactive } from 'vue'
import * as D from '@/api/adminData'
import {
  loadUserOptions,
  formatUserOptionLabel,
  resolveUserNickname,
} from '@/api/adminLookups'
import { parseTagLikeString, serializeTagsAsJson } from '@/utils/adminTagField'
import {
  splitToneForDisplay,
  EMOTION_STAT_KEYS,
  emotionStatKeyLabel,
  emotionStatTagAttrs,
  emotionStatsToDisplayEntries,
  parseEmotionStatsToCounts,
  serializeEmotionCountsToJson,
} from '@/utils/adminLabels'
import AdminTagEditor from '@/components/AdminTagEditor.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userOptions = ref([])

async function ensureUserLookups() {
  try {
    if (!userOptions.value.length) userOptions.value = await loadUserOptions()
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '用户列表加载失败')
  }
}

const mainTab = ref('types')

function ok(data) {
  return data?.code === 1
}

// ----- types -----
const typesLoading = ref(false)
const typesRows = ref([])
async function loadTypes() {
  typesLoading.value = true
  try {
    const { data } = await D.types.list()
    if (ok(data)) typesRows.value = data.data ?? []
    else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    typesLoading.value = false
  }
}
const typeDlg = ref(false)
const typeName = ref('')
const typePromptStyle = ref('')
const typeEditId = ref(null)
function openTypeCreate() {
  typeEditId.value = null
  typeName.value = ''
  typePromptStyle.value = ''
  typeDlg.value = true
}
function openTypeEdit(row) {
  typeEditId.value = row.id
  typeName.value = row.name
  typePromptStyle.value = row.promptStyle ?? ''
  typeDlg.value = true
}
async function saveType() {
  if (!typeName.value?.trim()) return ElMessage.warning('填写名称')
  const body = {
    name: typeName.value.trim(),
    promptStyle: (typePromptStyle.value ?? '').trim(),
  }
  try {
    const { data } =
      typeEditId.value == null
        ? await D.types.create(body)
        : await D.types.update(typeEditId.value, body)
    if (ok(data)) {
      ElMessage.success('已保存')
      typeDlg.value = false
      loadTypes()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}
async function delType(row) {
  try {
    await ElMessageBox.confirm(`删除类型 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.types.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadTypes()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

// ----- profiles -----
const pfLoading = ref(false)
const pfRows = ref([])
const pfTotal = ref(0)
const pfPage = ref(1)
const pfSize = ref(10)
const pfDlg = ref(false)
const pfEditUserId = ref(null)
const pfForm = reactive({
  userId: null,
  tonePreference: '',
  emotionStats: '',
  toDo: '',
})
const pfInterestTags = ref([])
const pfToneTags = ref([])
const pfToneWasJsonArray = ref(false)
const pfEmotionCounts = reactive(parseEmotionStatsToCounts(null))

async function loadProfiles() {
  pfLoading.value = true
  try {
    const { data } = await D.profiles.page({ page: pfPage.value, size: pfSize.value })
    if (ok(data) && data.data) {
      pfRows.value = data.data.records ?? []
      pfTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    pfLoading.value = false
  }
}
async function openPfCreate() {
  await ensureUserLookups()
  pfEditUserId.value = null
  pfInterestTags.value = []
  pfToneTags.value = []
  pfToneWasJsonArray.value = false
  Object.assign(pfEmotionCounts, parseEmotionStatsToCounts(null))
  Object.assign(pfForm, {
    userId: null,
    tonePreference: '',
    emotionStats: '',
    toDo: '',
  })
  pfDlg.value = true
}
async function openPfEdit(row) {
  await ensureUserLookups()
  pfEditUserId.value = row.userId
  try {
    const { data } = await D.profiles.get(row.userId)
    if (!ok(data) || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    const r = data.data
    pfForm.userId = r.userId
    pfInterestTags.value = [...parseTagLikeString(r.interests)]
    const rawTone = r.tonePreference ?? ''
    pfToneWasJsonArray.value = rawTone.trim().startsWith('[')
    pfToneTags.value = [...parseTagLikeString(rawTone)]
    pfForm.emotionStats = r.emotionStats ?? ''
    Object.assign(pfEmotionCounts, parseEmotionStatsToCounts(pfForm.emotionStats))
    pfForm.toDo = r.toDo ?? ''
    pfForm.tonePreference = rawTone
    pfDlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}
async function savePf() {
  const toneOut = pfToneWasJsonArray.value ? serializeTagsAsJson(pfToneTags.value) : pfToneTags.value.join(',')
  const emoOut = serializeEmotionCountsToJson(pfEmotionCounts)
  const body = {
    ...pfForm,
    interests: serializeTagsAsJson(pfInterestTags.value),
    tonePreference: toneOut,
    emotionStats: emoOut,
  }
  try {
    const { data } =
      pfEditUserId.value == null ? await D.profiles.save(body) : await D.profiles.savePut(pfEditUserId.value, body)
    if (ok(data)) {
      ElMessage.success('已保存')
      pfDlg.value = false
      loadProfiles()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}
async function delPf(row) {
  try {
    await ElMessageBox.confirm(`删除用户 ${row.userId} 的画像？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.profiles.del(row.userId)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadProfiles()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// ----- ops -----
const opsRows = ref([])
const opsLoading = ref(false)
async function loadOps() {
  opsLoading.value = true
  try {
    const { data } = await D.opsAccounts.list()
    if (ok(data)) opsRows.value = data.data ?? []
    else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    opsLoading.value = false
  }
}
const opsDlg = ref(false)
const opsForm = reactive({ username: '', password: '' })
const opsEditId = ref(null)
function openOpsCreate() {
  opsEditId.value = null
  opsForm.username = ''
  opsForm.password = ''
  opsDlg.value = true
}
function openOpsEdit(row) {
  opsEditId.value = row.id
  opsForm.username = row.username
  opsForm.password = ''
  opsDlg.value = true
}
async function saveOps() {
  if (!opsForm.username?.trim()) return ElMessage.warning('登录名')
  if (opsEditId.value == null && !opsForm.password) return ElMessage.warning('密码')
  try {
    const body = { username: opsForm.username.trim(), password: opsForm.password || undefined }
    const { data } =
      opsEditId.value == null ? await D.opsAccounts.create(body) : await D.opsAccounts.update(opsEditId.value, body)
    if (ok(data)) {
      ElMessage.success('已保存')
      opsDlg.value = false
      loadOps()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}
async function delOps(row) {
  try {
    await ElMessageBox.confirm(`删除运营账号 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.opsAccounts.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadOps()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

watch(
  mainTab,
  async (t) => {
    if (t === 'types') loadTypes()
    if (t === 'profiles') {
      await ensureUserLookups()
      loadProfiles()
    }
    if (t === 'ops') loadOps()
  },
  { immediate: true },
)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>数据维护</span>
      <p class="sub">
        类型字典、用户画像、运营账号。帖子与互动关系已拆至独立菜单；会话与消息见「会话与消息」。
      </p>
    </template>

    <el-tabs v-model="mainTab">
      <el-tab-pane label="类型" name="types">
        <el-button type="primary" class="mb" @click="openTypeCreate">新建</el-button>
        <el-button class="mb" @click="loadTypes">刷新</el-button>
        <el-table v-loading="typesLoading" :data="typesRows" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" width="120" />
          <el-table-column label="对话语气" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.promptStyle?.trim() || '（未配置，用系统默认）' }}</template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="168" />
          <el-table-column prop="updateTime" label="更新时间" width="168" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openTypeEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="delType(row)">删</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="用户画像" name="profiles">
        <el-button type="primary" class="mb" @click="openPfCreate">新建</el-button>
        <el-button class="mb" @click="loadProfiles">刷新</el-button>
        <el-table v-loading="pfLoading" :data="pfRows" stripe>
          <el-table-column prop="userId" label="用户" width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
          </el-table-column>
          <el-table-column prop="interests" label="兴趣" min-width="140" show-overflow-tooltip />
          <el-table-column label="语气偏好" min-width="160">
            <template #default="{ row }">
              <el-tag
                v-for="(t, i) in splitToneForDisplay(row.tonePreference)"
                :key="i"
                size="small"
                class="tag-m"
                >{{ t }}</el-tag
              >
              <span v-if="!splitToneForDisplay(row.tonePreference).length">—</span>
            </template>
          </el-table-column>
          <el-table-column label="情绪统计" min-width="200">
            <template #default="{ row }">
              <template v-if="emotionStatsToDisplayEntries(row.emotionStats).length">
                <el-tag
                  v-for="item in emotionStatsToDisplayEntries(row.emotionStats)"
                  :key="item.key"
                  size="small"
                  class="tag-m"
                  v-bind="emotionStatTagAttrs(item.key)"
                  >{{ emotionStatKeyLabel(item.key) }}：{{ item.value }}</el-tag
                >
              </template>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column prop="toDo" label="待办" min-width="140" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="168" />
          <el-table-column prop="updateTime" label="更新时间" width="168" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openPfEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="delPf(row)">删</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="pfPage"
          v-model:page-size="pfSize"
          class="pager"
          :total="pfTotal"
          layout="total, prev, pager, next"
          @current-change="loadProfiles"
        />
      </el-tab-pane>

      <el-tab-pane label="运营账号" name="ops">
        <el-button type="primary" class="mb" @click="openOpsCreate">新建</el-button>
        <el-button class="mb" @click="loadOps">刷新</el-button>
        <el-table v-loading="opsLoading" :data="opsRows" stripe>
          <el-table-column prop="id" label="ID" width="72" />
          <el-table-column prop="username" label="登录名" />
          <el-table-column prop="createTime" label="创建时间" width="168" />
          <el-table-column prop="updateTime" label="更新时间" width="168" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openOpsEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="delOps(row)">删</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="typeDlg" :title="typeEditId == null ? '新建类型' : '编辑类型'" width="640px">
      <el-form label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="typeName" placeholder="类型称谓（与 Prompt 模板 role 对齐）" />
        </el-form-item>
        <el-form-item label="对话语气">
          <el-input
            v-model="typePromptStyle"
            type="textarea"
            :rows="6"
            placeholder="写入系统提示中的 {style}；留空则该类型使用服务端全局默认语气"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDlg = false">取消</el-button>
        <el-button type="primary" @click="saveType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pfDlg" title="用户画像" width="640px">
      <el-form label-width="110px">
        <el-form-item label="用户" required>
          <el-select
            v-model="pfForm.userId"
            filterable
            :disabled="pfEditUserId != null"
            placeholder="选择用户"
            style="width: 100%"
          >
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="兴趣标签">
          <AdminTagEditor v-model="pfInterestTags" placeholder="兴趣，回车添加" />
        </el-form-item>
        <el-form-item label="语气偏好">
          <AdminTagEditor v-model="pfToneTags" placeholder="语气标签；原为 JSON 数组则保存仍为 JSON 数组" />
          <span class="hint">原存储为 JSON 数组时会按数组写回，否则为逗号分隔文本</span>
        </el-form-item>
        <el-form-item label="情绪统计">
          <div class="emo-grid">
            <div v-for="ek in EMOTION_STAT_KEYS" :key="ek" class="emo-row">
              <span class="emo-name">{{ emotionStatKeyLabel(ek) }}</span>
              <el-input-number
                v-model="pfEmotionCounts[ek]"
                :min="0"
                :step="1"
                size="small"
                controls-position="right"
                class="emo-num"
              />
            </div>
          </div>
          <span class="hint">按次数统计，0 不写库；保存为 JSON 对象（如 {"happy":3}）</span>
        </el-form-item>
        <el-form-item label="待办">
          <el-input v-model="pfForm.toDo" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pfDlg = false">取消</el-button>
        <el-button type="primary" @click="savePf">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="opsDlg" title="运营账号" width="400px">
      <el-input v-model="opsForm.username" placeholder="登录名" class="mb8" />
      <el-input v-model="opsForm.password" type="password" placeholder="密码（编辑可留空）" show-password />
      <template #footer>
        <el-button @click="opsDlg = false">取消</el-button>
        <el-button type="primary" @click="saveOps">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.mb {
  margin-bottom: 12px;
  margin-right: 8px;
}
.mb8 {
  margin-bottom: 8px;
}
.pager {
  margin-top: 12px;
}
.tag-m {
  margin-right: 4px;
  margin-bottom: 4px;
}
.hint {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.emo-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.emo-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emo-name {
  width: 56px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.emo-num {
  width: 140px;
}
</style>
