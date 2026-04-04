<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  fetchAiCharacters,
  fetchAiCharacter,
  createAiCharacter,
  updateAiCharacter,
  deleteAiCharacter,
} from '@/api/adminCharacters'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const typeId = ref('')
const status = ref('')

const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const form = reactive({
  userId: null,
  name: '',
  typeId: null,
  gender: 2,
  age: null,
  imageUrl: '',
  traits: '',
  personaDesc: '',
  interests: '',
  backstory: '',
  online: 0,
  status: 1,
})

function openCreate() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    userId: null,
    name: '',
    typeId: null,
    gender: 2,
    age: null,
    imageUrl: '',
    traits: '',
    personaDesc: '',
    interests: '',
    backstory: '',
    online: 0,
    status: 1,
  })
  dialogVisible.value = true
}

async function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  try {
    const { data } = await fetchAiCharacter(row.id)
    if (data?.code === 1 && data.data) {
      const r = data.data
      Object.assign(form, {
        userId: r.userId ?? null,
        name: r.name ?? '',
        typeId: r.typeId ?? null,
        gender: r.gender ?? 2,
        age: r.age ?? null,
        imageUrl: r.imageUrl ?? '',
        traits: r.traits ?? '',
        personaDesc: r.personaDesc ?? '',
        interests: r.interests ?? '',
        backstory: r.backstory ?? '',
        online: r.online ?? 0,
        status: r.status ?? 1,
      })
      dialogVisible.value = true
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function load() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      keyword: keyword.value.trim() || undefined,
    }
    const tid = typeId.value === '' ? undefined : Number(typeId.value)
    const st = status.value === '' ? undefined : Number(status.value)
    if (tid != null && !Number.isNaN(tid)) params.typeId = tid
    if (st != null && !Number.isNaN(st)) params.status = st

    const { data } = await fetchAiCharacters(params)
    if (data?.code === 1 && data.data) {
      tableData.value = data.data.records ?? []
      total.value = Number(data.data.total ?? 0)
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onPageChange(p) {
  page.value = p
  load()
}

function onSizeChange(s) {
  size.value = s
  page.value = 1
  load()
}

async function submit() {
  if (!form.name?.trim()) {
    ElMessage.warning('请填写角色名称')
    return
  }
  saving.value = true
  try {
    const body = { ...form, name: form.name.trim() }
    let data
    if (isEdit.value) {
      ;({ data } = await updateAiCharacter(editId.value, body))
    } else {
      ;({ data } = await createAiCharacter(body))
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

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除角色 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await deleteAiCharacter(row.id)
    if (data?.code === 1) {
      ElMessage.success('已删除')
      load()
    } else {
      ElMessage.error(data?.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

onMounted(load)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="head">
        <span>AI 角色</span>
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="名称 / 描述"
            clearable
            style="width: 160px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-input
            v-model="typeId"
            placeholder="类型 ID"
            clearable
            style="width: 100px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-select v-model="status" placeholder="状态" clearable style="width: 100px; margin-right: 8px">
            <el-option label="启用" :value="1" />
            <el-option label="下线" :value="0" />
          </el-select>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button type="success" @click="openCreate">新建</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="userId" label="用户" width="88" />
      <el-table-column prop="name" label="名称"  show-overflow-tooltip />
      <el-table-column prop="typeName" label="类型" width="100" show-overflow-tooltip />
      <el-table-column prop="online" label="在线" width="72">
        <template #default="{ row }">
          <el-tag :type="row.online === 1 ? 'success' : 'info'" size="small">{{ row.online === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="启用" width="72">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新" width="168" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新建角色'" width="640px" destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="归属用户 ID">
          <el-input-number
            v-model="form.userId"
            clearable
            :value-on-clear="null"
            :controls="false"
            placeholder="留空表示系统角色"
            style="width: 100%"
          />
          <span class="hint">与库表一致：可为空表示系统角色</span>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型 ID">
          <el-input-number v-model="form.typeId" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :label="0">男</el-radio>
            <el-radio :label="1">女</el-radio>
            <el-radio :label="2">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="form.age" :min="0" :max="200" controls-position="right" />
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="form.imageUrl" />
        </el-form-item>
        <el-form-item label="特点">
          <el-input v-model="form.traits" />
        </el-form-item>
        <el-form-item label="性格描述">
          <el-input v-model="form.personaDesc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="兴趣">
          <el-input v-model="form.interests" />
        </el-form-item>
        <el-form-item label="背景">
          <el-input v-model="form.backstory" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="在线">
          <el-switch v-model="form.online" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.hint {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
