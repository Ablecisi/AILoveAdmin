<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  fetchAdminArticles,
  fetchAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
} from '@/api/adminArticles'
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
  title: '',
  description: '',
  content: '',
  coverImageUrl: '',
  userId: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  tagsJson: '[]',
})

function openCreate() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    title: '',
    description: '',
    content: '',
    coverImageUrl: '',
    userId: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tagsJson: '[]',
  })
  dialogVisible.value = true
}

async function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  try {
    const { data } = await fetchAdminArticle(row.id)
    if (data?.code === 1 && data.data) {
      const a = data.data
      Object.assign(form, {
        title: a.title ?? '',
        description: a.description ?? '',
        content: a.content ?? '',
        coverImageUrl: a.coverImageUrl ?? '',
        userId: a.userId ?? null,
        viewCount: a.viewCount ?? 0,
        likeCount: a.likeCount ?? 0,
        commentCount: a.commentCount ?? 0,
        tagsJson: JSON.stringify(a.tags ?? [], null, 2),
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
    const { data } = await fetchAdminArticles({
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

function parseTags() {
  try {
    const v = JSON.parse(form.tagsJson || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    throw new Error('标签须为 JSON 数组，如 ["a","b"]')
  }
}

async function submit() {
  if (!form.title?.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.content) {
    ElMessage.warning('请填写正文')
    return
  }
  if (form.userId == null || Number.isNaN(Number(form.userId))) {
    ElMessage.warning('请填写作者 userId')
    return
  }
  let tags
  try {
    tags = parseTags()
  } catch (err) {
    ElMessage.warning(err.message)
    return
  }
  saving.value = true
  try {
    const body = {
      title: form.title.trim(),
      description: form.description || '',
      content: form.content,
      coverImageUrl: form.coverImageUrl || '',
      userId: Number(form.userId),
      viewCount: form.viewCount,
      likeCount: form.likeCount,
      commentCount: form.commentCount,
      tags,
    }
    let data
    if (isEdit.value) {
      ;({ data } = await updateAdminArticle(editId.value, body))
    } else {
      ;({ data } = await createAdminArticle(body))
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
    await ElMessageBox.confirm(`确定删除文章 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await deleteAdminArticle(row.id)
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
        <span>文章运营</span>
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="标题关键词"
            clearable
            style="width: 220px; margin-right: 8px"
            @keyup.enter="onSearch"
          />
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button type="success" @click="openCreate">新建</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="description" label="摘要" min-width="180" show-overflow-tooltip />
      <el-table-column prop="userId" label="作者ID" width="100" />
      <el-table-column prop="viewCount" label="浏览" width="80" />
      <el-table-column prop="likeCount" label="点赞" width="80" />
      <el-table-column prop="commentCount" label="评论" width="80" />
      <el-table-column prop="updateTime" label="更新时间" width="170" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑文章' : '新建文章'" width="720px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="作者 userId" required>
          <el-input-number v-model="form.userId" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面 URL">
          <el-input v-model="form.coverImageUrl" />
        </el-form-item>
        <el-form-item label="浏览/赞/评">
          <el-input-number v-model="form.viewCount" :min="0" />
          <el-input-number v-model="form.likeCount" :min="0" class="ml" />
          <el-input-number v-model="form.commentCount" :min="0" class="ml" />
        </el-form-item>
        <el-form-item label="标签 JSON">
          <el-input v-model="form.tagsJson" type="textarea" :rows="3" placeholder='["标签1","标签2"]' />
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input v-model="form.content" type="textarea" :rows="12" />
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

.ml {
  margin-left: 12px;
}
</style>
