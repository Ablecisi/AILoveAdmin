<script setup>
import { ref, onMounted } from 'vue'
import {
  fetchPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
} from '@/api/adminPrompts'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  roleType: '',
  name: '',
  template: '',
  status: 1,
})

function openCreate() {
  isEdit.value = false
  form.value = { id: null, roleType: '', name: '', template: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = {
    id: row.id,
    roleType: row.roleType ?? '',
    name: row.name ?? '',
    template: row.template ?? '',
    status: row.status ?? 1,
  }
  dialogVisible.value = true
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
    ElMessage.warning('请填写 role_type（与库字段一致，与角色 type 对齐，如 companion）')
    return
  }
  if (!form.value.template?.trim()) {
    ElMessage.warning('请填写模板正文')
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
      数据库字段为 <code>role_code</code>，需与对话里角色的 <code>typeName</code>（或英文编码）一致；<code>status=1</code>
      为启用。同编码多条启用时取 ID 最大的一条。
    </p>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="roleType" label="角色编码" width="140" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" width="160" show-overflow-tooltip />
      <el-table-column prop="template" label="模板内容" min-width="240" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="88">
        <template #default="{ row }">
          <span>{{ row.status }}</span>
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
      width="640px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="角色编码" required>
          <el-input v-model="form.roleType" placeholder="如 companion、情感陪伴" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">下线</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模板" required>
          <el-input v-model="form.template" type="textarea" :rows="16" placeholder="支持占位符如 {user_text}、{emotion} 等" />
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
</style>
