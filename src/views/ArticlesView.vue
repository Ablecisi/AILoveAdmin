<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  fetchAdminArticles,
  fetchAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
} from '@/api/adminArticles'
import { loadUserOptions, formatUserOptionLabel, resolveUserNickname } from '@/api/adminLookups'
import AdminTagEditor from '@/components/AdminTagEditor.vue'
import AdminImageField from '@/components/AdminImageField.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

function fmtTags(row) {
  if (row.tags == null) return ''
  if (Array.isArray(row.tags)) return JSON.stringify(row.tags)
  return String(row.tags)
}

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')

const userOptions = ref([])

function userLabel(id) {
  return resolveUserNickname(id, userOptions.value)
}

async function ensureUserOptions() {
  try {
    userOptions.value = await loadUserOptions()
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '用户列表加载失败')
  }
}

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
})

const tagList = ref([])

async function openCreate() {
  await ensureUserOptions()
  isEdit.value = false
  editId.value = null
  tagList.value = []
  Object.assign(form, {
    title: '',
    description: '',
    content: '',
    coverImageUrl: '',
    userId: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
  })
  dialogVisible.value = true
}

async function openEdit(row) {
  await ensureUserOptions()
  isEdit.value = true
  editId.value = row.id
  try {
    const { data } = await fetchAdminArticle(row.id)
    if (data?.code === 1 && data.data) {
      const a = data.data
      const rawTags = a.tags
      const tags = Array.isArray(rawTags)
        ? rawTags.map((x) => String(x).trim()).filter(Boolean)
        : []
      tagList.value = [...tags]
      Object.assign(form, {
        title: a.title ?? '',
        description: a.description ?? '',
        content: a.content ?? '',
        coverImageUrl: a.coverImageUrl ?? '',
        userId: a.userId ?? null,
        viewCount: a.viewCount ?? 0,
        likeCount: a.likeCount ?? 0,
        commentCount: a.commentCount ?? 0,
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
    ElMessage.warning('请选择作者')
    return
  }
  const tags = [...tagList.value]
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

onMounted(() => {
  void ensureUserOptions()
  load()
})
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
      <el-table-column prop="id" label="ID" width="72" fixed="left" />
      <el-table-column label="封面" width="88" align="center">
        <template #default="{ row }">
          <AdminImageField :model-value="row.coverImageUrl" :editable="false" :size="40" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="description" label="摘要" min-width="140" show-overflow-tooltip />
      <el-table-column prop="content" label="正文" min-width="200" show-overflow-tooltip />
      <el-table-column prop="userId" label="作者" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ userLabel(row.userId) }}</template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览量" width="88" />
      <el-table-column prop="likeCount" label="点赞数" width="88" />
      <el-table-column prop="commentCount" label="评论数" width="96" />
      <el-table-column label="标签" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtTags(row) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="168" />
      <el-table-column prop="updateTime" label="更新时间" width="168" />
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
        <el-form-item label="作者" required>
          <el-select v-model="form.userId" filterable placeholder="选择用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面">
          <AdminImageField v-model="form.coverImageUrl" :editable="true" :size="96" />
          <el-input v-model="form.coverImageUrl" placeholder="或直接填写 cover_image_url" clearable class="mt8" />
        </el-form-item>
        <el-form-item label="浏览/赞/评">
          <el-input-number v-model="form.viewCount" :min="0" />
          <el-input-number v-model="form.likeCount" :min="0" class="ml" />
          <el-input-number v-model="form.commentCount" :min="0" class="ml" />
        </el-form-item>

        <el-form-item label="标签">
          <AdminTagEditor v-model="tagList" placeholder="输入标签，回车或点击添加" />
          <span class="hint">保存时仍以 JSON 数组提交给接口</span>
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

.hint {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

.mt8 {
  margin-top: 8px;
}
</style>
