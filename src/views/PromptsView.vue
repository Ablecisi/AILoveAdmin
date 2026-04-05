<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  fetchPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  draftPromptTemplate,
} from '@/api/adminPrompts'
import { enabledLabel, enabledTagType } from '@/utils/adminLabels'
import { ElMessage } from 'element-plus'

/** 与对话侧占位符一致（单花括号，键名不含括号） */
const PLACEHOLDER_DEFS = [
  { key: 'style', label: '风格语气', hint: '如温柔、活泼' },
  { key: 'name', label: '角色名称', hint: '' },
  { key: 'gender', label: '性别气质', hint: '' },
  { key: 'traits', label: '性格特点', hint: '' },
  { key: 'persona_desc', label: '人设描述', hint: '' },
  { key: 'interests', label: '兴趣爱好', hint: '' },
  { key: 'backstory', label: '背景故事', hint: '' },
  { key: 'emotion', label: '用户情绪', hint: '' },
  { key: 'confidence', label: '情绪置信度', hint: '' },
  { key: 'profile', label: '用户画像摘要', hint: '' },
  { key: 'dialogue', label: '历史对话摘要', hint: '' },
  { key: 'user_text', label: '用户当前输入', hint: '' },
  { key: 'user_name', label: '用户昵称', hint: '' },
]

const ALL_KEYS = PLACEHOLDER_DEFS.map((d) => d.key)

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const saving = ref(false)
const drafting = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null,
  roleType: '',
  name: '',
  template: '',
  status: 1,
  scenario: '',
  selectedPlaceholders: [...ALL_KEYS],
  fieldHints: {},
  userPersonaNotes: '',
})

function emptyHints() {
  const o = {}
  for (const k of ALL_KEYS) o[k] = ''
  return o
}

function parsePlaceholdersFromTemplate(t) {
  if (!t || !String(t).trim()) return [...ALL_KEYS]
  const set = new Set()
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  let m
  while ((m = re.exec(t))) set.add(m[1])
  const arr = [...set]
  return arr.length ? arr : [...ALL_KEYS]
}

function openCreate() {
  isEdit.value = false
  form.value = {
    id: null,
    roleType: '',
    name: '',
    template: '',
    status: 1,
    scenario: '',
    selectedPlaceholders: [...ALL_KEYS],
    fieldHints: emptyHints(),
    userPersonaNotes: '',
  }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  const tpl = row.template ?? ''
  form.value = {
    id: row.id,
    roleType: row.roleType ?? '',
    name: row.name ?? '',
    template: tpl,
    status: row.status ?? 1,
    scenario: '',
    selectedPlaceholders: parsePlaceholdersFromTemplate(tpl),
    fieldHints: emptyHints(),
    userPersonaNotes: '',
  }
  dialogVisible.value = true
}

const selectedSet = computed(() => new Set(form.value.selectedPlaceholders || []))

const defsFiltered = computed(() =>
  PLACEHOLDER_DEFS.filter((d) => selectedSet.value.has(d.key)),
)

function togglePlaceholder(key, checked) {
  const cur = new Set(form.value.selectedPlaceholders || [])
  if (checked) cur.add(key)
  else cur.delete(key)
  form.value.selectedPlaceholders = [...cur]
}

function buildSkeletonTemplate() {
  const keys = (form.value.selectedPlaceholders || []).filter((k) => ALL_KEYS.includes(k))
  if (!keys.length) {
    ElMessage.warning('请至少勾选一个设定项')
    return ''
  }
  const lines = [
    '以下内容由运行时占位符填充，请勿臆造具体人名或隐私。',
    '',
    '## 角色设定',
    ...keys.map((k) => {
      const def = PLACEHOLDER_DEFS.find((d) => d.key === k)
      const title = def?.label ?? k
      return `- ${title}：{${k}}`
    }),
    '',
    '## 用户与上下文',
    '请结合用户画像、情绪与历史对话理解意图。',
    '',
    '## 回复要求',
    '语气自然、符合角色；用户输入：{user_text}',
  ]
  // 若未选 user_text 仍写了上面一行，去掉该行
  if (!keys.includes('user_text')) {
    lines[lines.length - 1] = '语气自然、符合角色设定回复。'
  }
  return lines.join('\n')
}

function applySkeleton() {
  form.value.template = buildSkeletonTemplate()
  ElMessage.success('已写入骨架，可继续编辑或点击 AI 生成')
}

async function runDraft() {
  if (!form.value.scenario?.trim()) {
    ElMessage.warning('请填写场景与需求描述，便于 AI 生成模板')
    return
  }
  drafting.value = true
  try {
    const hints = {}
    for (const k of form.value.selectedPlaceholders || []) {
      const v = form.value.fieldHints?.[k]
      if (v != null && String(v).trim()) hints[k] = String(v).trim()
    }
    const { data } = await draftPromptTemplate({
      scenario: form.value.scenario.trim(),
      roleType: form.value.roleType?.trim() || undefined,
      placeholders:
        form.value.selectedPlaceholders?.length > 0
          ? form.value.selectedPlaceholders
          : undefined,
      fieldHints: Object.keys(hints).length ? hints : undefined,
      userPersonaNotes: form.value.userPersonaNotes?.trim() || undefined,
    })
    if (data?.code === 1 && data.data?.template != null) {
      form.value.template = data.data.template
      ElMessage.success('已生成草稿，请检查后保存')
    } else {
      ElMessage.error(data?.msg || '生成失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    drafting.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await fetchPromptTemplates()
    if (data?.code === 1 && Array.isArray(data.data)) {
      tableData.value = data.data
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.value.roleType?.trim()) {
    ElMessage.warning('请填写角色编码（与库 role_code / 角色 type 对齐，如 companion）')
    return
  }
  if (!form.value.template?.trim()) {
    ElMessage.warning('请填写或生成模板正文')
    return
  }
  saving.value = true
  try {
    const body = {
      roleType: form.value.roleType.trim(),
      name: form.value.name?.trim() || '',
      template: form.value.template,
      status: form.value.status,
    }
    let data
    if (isEdit.value) {
      ;({ data } = await updatePromptTemplate(form.value.id, body))
    } else {
      ;({ data } = await createPromptTemplate(body))
    }
    if (data?.code === 1) {
      ElMessage.success(isEdit.value ? '已保存' : '已创建')
      dialogVisible.value = false
      await load()
    } else {
      ElMessage.error(data?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    saving.value = false
  }
}

function phBrace(key) {
  return `{${key}}`
}

onMounted(load)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="head">
        <span>Prompt 模板</span>
        <div>
          <el-button type="primary" @click="openCreate">新建模板</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <p class="hint">
      数据库字段为 <code>role_code</code>，需与对话里角色的 <code>typeName</code>（或英文编码）一致；状态为「启用」时参与匹配。同编码多条启用时取 ID 最大的一条。
    </p>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="roleType" label="角色编码" width="140" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" width="160" show-overflow-tooltip />
      <el-table-column prop="template" label="模板内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="状态" width="96">
        <template #default="{ row }">
          <el-tag :type="enabledTagType(row.status)" size="small">{{ enabledLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="168" />
      <el-table-column prop="updateTime" label="更新时间" width="168" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="920px"
      destroy-on-close
      class="prompt-dialog"
    >
      <el-form label-width="112px">
        <el-form-item label="角色编码" required>
          <el-input v-model="form.roleType" placeholder="如 companion、与角色 type 对齐" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="可选，便于运营识别" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">下线</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">可选设定占位符</el-divider>
        <p class="subhint">勾选需要出现在模板中的变量；可为每项填写补充说明（参与 AI 生成）。</p>
        <div class="ph-grid">
          <el-checkbox
            v-for="d in PLACEHOLDER_DEFS"
            :key="d.key"
            :model-value="selectedSet.has(d.key)"
            @update:model-value="(v) => togglePlaceholder(d.key, !!v)"
          >
            {{ d.label }} <code class="ph-code">{{ phBrace(d.key) }}</code>
          </el-checkbox>
        </div>

        <template v-if="defsFiltered.length">
          <el-divider content-position="left">字段补充说明（可选）</el-divider>
          <div class="hints">
            <div v-for="d in defsFiltered" :key="'h-' + d.key" class="hint-row">
              <span class="hint-label">{{ d.label }}</span>
              <el-input
                v-model="form.fieldHints[d.key]"
                size="small"
                :placeholder="d.hint || '可选说明'"
                clearable
              />
            </div>
          </div>
        </template>

        <el-divider content-position="left">用户个性文本（可选）</el-divider>
        <el-input
          v-model="form.userPersonaNotes"
          type="textarea"
          :rows="3"
          placeholder="语气偏好、禁忌、称呼方式等，写入 AI 生成请求；不单独落库，保存模板时仅存下方正文"
        />

        <el-divider content-position="left">AI 生成</el-divider>
        <el-input
          v-model="form.scenario"
          type="textarea"
          :rows="4"
          placeholder="描述产品场景、角色定位、回复风格等，用于调用大模型生成完整模板草稿"
        />
        <div class="draft-actions">
          <el-button @click="applySkeleton">仅插入骨架</el-button>
          <el-button type="primary" :loading="drafting" @click="runDraft">AI 生成完整模板</el-button>
        </div>

        <el-divider content-position="left">模板正文</el-divider>
        <el-form-item label-width="0">
          <el-input
            v-model="form.template"
            type="textarea"
            :rows="14"
            placeholder="可手动编写，或由「仅插入骨架 / AI 生成」得到；须含与业务一致的花括号占位符"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0 0 12px;
  line-height: 1.5;
}

.subhint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0 0 10px;
}

.ph-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 8px;
}

.ph-code {
  font-size: 12px;
  margin-left: 4px;
  color: var(--el-color-primary);
}

.hints {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.hint-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 8px;
}

.hint-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.draft-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
