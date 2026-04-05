<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  fetchAdminUsers,
  fetchAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '@/api/adminUsers'
import AdminImageField from '@/components/AdminImageField.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')

const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const form = reactive({
  username: '',
  password: '',
  name: '',
  description: '',
  avatarUrl: '',
  followingCount: 0,
  followersCount: 0,
})

function openCreate() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    username: '',
    password: '',
    name: '',
    description: '',
    avatarUrl: '',
    followingCount: 0,
    followersCount: 0,
  })
  dialogVisible.value = true
}

async function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  try {
    const { data } = await fetchAdminUser(row.id)
    if (data?.code === 1 && data.data) {
      const u = data.data
      Object.assign(form, {
        username: u.username ?? '',
        password: '',
        name: u.name ?? '',
        description: u.description ?? '',
        avatarUrl: u.avatarUrl ?? '',
        followingCount: u.followingCount ?? 0,
        followersCount: u.followersCount ?? 0,
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
    const { data } = await fetchAdminUsers({
      page: page.value,
      size: size.value,
      keyword: keyword.value.trim() || undefined,
    })
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
  void load()
}

async function submit() {
  if (!form.username?.trim()) {
    ElMessage.warning('请填写账号')
    return
  }
  if (!isEdit.value && !form.password?.trim()) {
    ElMessage.warning('请填写初始密码')
    return
  }
  saving.value = true
  try {
    const body = {
      username: form.username.trim(),
      password: form.password?.trim() || undefined,
      name: form.name || undefined,
      description: form.description || undefined,
      avatarUrl: form.avatarUrl || undefined,
      followingCount: form.followingCount,
      followersCount: form.followersCount,
    }
    let data
    if (isEdit.value) {
      if (!body.password) delete body.password
      ;({ data } = await updateAdminUser(editId.value, body))
    } else {
      ;({ data } = await createAdminUser(body))
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
    await ElMessageBox.confirm(`确定删除用户 #${row.id}？将级联删除关联数据。`, '危险操作', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    const { data } = await deleteAdminUser(row.id)
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
        <span>用户管理</span>
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="用户名 / 昵称"
            clearable
            style="width: 220px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button type="success" @click="openCreate">新建用户</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" fixed="left" />
      <el-table-column label="头像" width="72" align="center">
        <template #default="{ row }">
          <AdminImageField :model-value="row.avatarUrl" :editable="false" :size="40" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="账号" width="120" show-overflow-tooltip />
      <el-table-column prop="name" label="昵称" width="120" show-overflow-tooltip />
      <el-table-column prop="description" label="简介" min-width="160" show-overflow-tooltip />
      <el-table-column prop="followingCount" label="关注数" width="100" />
      <el-table-column prop="followersCount" label="粉丝数" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="168" />
      <el-table-column prop="updateTime" label="更新时间" width="168" />
      <el-table-column label="操作" width="160" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新建用户'" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="账号" required>
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item :label="isEdit ? '新密码' : '密码'" :required="!isEdit">
          <el-input v-model="form.password" type="password" show-password placeholder="编辑时留空表示不改" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="头像">
          <AdminImageField v-model="form.avatarUrl" :editable="true" :size="96" />
          <el-input v-model="form.avatarUrl" placeholder="或填写 avatar_url" clearable class="mt8" />
        </el-form-item>
        <el-form-item label="关注数">
          <el-input-number v-model="form.followingCount" :min="0" />
        </el-form-item>
        <el-form-item label="粉丝数">
          <el-input-number v-model="form.followersCount" :min="0" />
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
  gap: 8px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.mt8 {
  margin-top: 8px;
}
</style>
