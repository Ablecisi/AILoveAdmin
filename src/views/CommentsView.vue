<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  fetchAdminComments,
  fetchAdminComment,
  updateAdminComment,
  deleteAdminComment,
  purgeAdminComment,
} from '@/api/adminComments'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const articleId = ref('')
const postId = ref('')

async function load() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      keyword: keyword.value.trim() || undefined,
    }
    const aid = articleId.value === '' ? undefined : Number(articleId.value)
    const pid = postId.value === '' ? undefined : Number(postId.value)
    if (aid != null && !Number.isNaN(aid)) params.articleId = aid
    if (pid != null && !Number.isNaN(pid)) params.postId = pid

    const { data } = await fetchAdminComments(params)
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

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定软删评论 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await deleteAdminComment(row.id)
    if (data?.code === 1) {
      ElMessage.success('已隐藏')
      load()
    } else {
      ElMessage.error(data?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

const editDlg = ref(false)
const editSaving = ref(false)
const editId = ref(null)
const editForm = reactive({
  content: '',
  articleId: null,
  postId: null,
  userId: '',
  parentId: null,
  rootId: null,
  path: '',
  depth: null,
  likeCount: 0,
  replyCount: 0,
  isDeleted: false,
})

async function openEdit(row) {
  editId.value = row.id
  try {
    const { data } = await fetchAdminComment(row.id)
    if (data?.code !== 1 || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    const r = data.data
    editForm.content = r.content ?? ''
    editForm.articleId = r.articleId ?? null
    editForm.postId = r.postId ?? null
    editForm.userId = r.userId != null ? String(r.userId) : ''
    editForm.parentId = r.parentId ?? null
    editForm.rootId = r.rootId ?? null
    editForm.path = r.path ?? ''
    editForm.depth = r.depth ?? null
    editForm.likeCount = r.likeCount ?? 0
    editForm.replyCount = r.replyCount ?? 0
    editForm.isDeleted = !!r.isDeleted
    editDlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function saveEdit() {
  if (!editForm.content?.trim()) {
    ElMessage.warning('请填写内容')
    return
  }
  editSaving.value = true
  try {
    const body = {
      content: editForm.content,
      articleId: editForm.articleId,
      postId: editForm.postId,
      userId: editForm.userId?.trim() || null,
      parentId: editForm.parentId,
      rootId: editForm.rootId,
      path: editForm.path || null,
      depth: editForm.depth,
      likeCount: editForm.likeCount,
      replyCount: editForm.replyCount,
      isDeleted: editForm.isDeleted,
    }
    const { data } = await updateAdminComment(editId.value, body)
    if (data?.code === 1) {
      ElMessage.success('已保存')
      editDlg.value = false
      load()
    } else {
      ElMessage.error(data?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    editSaving.value = false
  }
}

async function onPurge(row) {
  try {
    await ElMessageBox.confirm(
      `将物理删除评论 #${row.id}，不可恢复。确定？`,
      '彻底删除',
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    const { data } = await purgeAdminComment(row.id)
    if (data?.code === 1) {
      ElMessage.success('已彻底删除')
      load()
    } else {
      ElMessage.error(data?.msg || '操作失败')
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
        <span>评论管理</span>
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="内容关键词"
            clearable
            style="width: 160px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-input
            v-model="articleId"
            placeholder="文章 ID"
            clearable
            style="width: 100px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-input
            v-model="postId"
            placeholder="帖子 ID"
            clearable
            style="width: 100px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column prop="articleId" label="文章" width="88" />
      <el-table-column prop="postId" label="帖子" width="88" />
      <el-table-column prop="userId" label="用户" width="88" />
      <el-table-column prop="userName" label="昵称" width="100" show-overflow-tooltip />
      <el-table-column prop="deleted" label="已删" width="72">
        <template #default="{ row }">
          <el-tag :type="row.deleted ? 'danger' : 'success'" size="small">
            {{ row.deleted ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="likeCount" label="赞" width="56" />
      <el-table-column prop="replyCount" label="回复" width="64" />
      <el-table-column prop="createTime" label="时间" width="168" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button
            type="warning"
            link
            size="small"
            :disabled="row.deleted"
            @click="onDelete(row)"
          >
            软删
          </el-button>
          <el-button type="danger" link size="small" @click="onPurge(row)">彻底删除</el-button>
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

    <el-dialog v-model="editDlg" title="编辑评论" width="640px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="文章 ID">
          <el-input-number v-model="editForm.articleId" :controls="false" clearable :value-on-clear="null" />
        </el-form-item>
        <el-form-item label="帖子 ID">
          <el-input-number v-model="editForm.postId" :controls="false" clearable :value-on-clear="null" />
        </el-form-item>
        <el-form-item label="用户 ID">
          <el-input v-model="editForm.userId" placeholder="与库 user_id 一致" clearable />
        </el-form-item>
        <el-form-item label="parent / root">
          <el-input-number v-model="editForm.parentId" :controls="false" clearable :value-on-clear="null" class="mr8" />
          <el-input-number v-model="editForm.rootId" :controls="false" clearable :value-on-clear="null" />
        </el-form-item>
        <el-form-item label="path / depth">
          <el-input v-model="editForm.path" placeholder="path" clearable class="mr8" style="width: 200px" />
          <el-input-number v-model="editForm.depth" :min="0" :controls="false" clearable :value-on-clear="null" />
        </el-form-item>
        <el-form-item label="赞 / 回复数">
          <el-input-number v-model="editForm.likeCount" :min="0" :controls="false" />
          <el-input-number v-model="editForm.replyCount" :min="0" :controls="false" class="ml8" />
        </el-form-item>
        <el-form-item label="已删除">
          <el-switch v-model="editForm.isDeleted" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDlg = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
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

.mr8 {
  margin-right: 8px;
}

.ml8 {
  margin-left: 8px;
}
</style>
