<script setup>
import { ref, watch, reactive, onMounted } from 'vue'
import * as P from '@/api/adminPosts'
import {
  loadUserOptions,
  formatUserOptionLabel,
  resolveUserNickname,
} from '@/api/adminLookups'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminTagEditor from '@/components/AdminTagEditor.vue'
import AdminImageField from '@/components/AdminImageField.vue'
import AdminImageUrlListEditor from '@/components/AdminImageUrlListEditor.vue'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const userOptions = ref([])

async function ensureUsers() {
  if (userOptions.value.length) return
  try {
    userOptions.value = await loadUserOptions()
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '用户列表加载失败')
  }
}

function postFirstImageUrl(row) {
  const u = row.imageUrls
  if (!Array.isArray(u) || !u.length) return ''
  return String(u[0] || '')
}

function fmtJsonArr(v) {
  if (v == null) return ''
  if (Array.isArray(v)) return JSON.stringify(v)
  return String(v)
}

const dlg = ref(false)
const editId = ref(null)
const form = reactive({
  userId: null,
  content: '',
  viewCount: 0,
  likeCount: 0,
  shareCount: 0,
  commentCount: 0,
})
const postImageUrls = ref([])
const postTags = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await P.fetchAdminPosts({ page: page.value, size: size.value })
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

async function openCreate() {
  await ensureUsers()
  editId.value = null
  postImageUrls.value = []
  postTags.value = []
  Object.assign(form, {
    userId: null,
    content: '',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0,
    commentCount: 0,
  })
  dlg.value = true
}

async function openEdit(row) {
  await ensureUsers()
  editId.value = row.id
  try {
    const { data } = await P.fetchAdminPost(row.id)
    if (data?.code !== 1 || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    const r = data.data
    form.userId = r.userId
    form.content = r.content ?? ''
    postImageUrls.value = Array.isArray(r.imageUrls)
      ? r.imageUrls.map((x) => String(x).trim()).filter(Boolean)
      : []
    postTags.value = Array.isArray(r.tags) ? r.tags.map((x) => String(x).trim()).filter(Boolean) : []
    form.viewCount = r.viewCount ?? 0
    form.likeCount = r.likeCount ?? 0
    form.shareCount = r.shareCount ?? 0
    form.commentCount = r.commentCount ?? 0
    dlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}

async function save() {
  const body = {
    userId: form.userId,
    content: form.content,
    imageUrls: [...postImageUrls.value],
    tags: [...postTags.value],
    viewCount: form.viewCount,
    likeCount: form.likeCount,
    shareCount: form.shareCount,
    commentCount: form.commentCount,
  }
  try {
    const { data } =
      editId.value == null ? await P.createAdminPost(body) : await P.updateAdminPost(editId.value, body)
    if (data?.code === 1) {
      ElMessage.success('已保存')
      dlg.value = false
      load()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`删除帖子 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await P.deleteAdminPost(row.id)
    if (data?.code === 1) {
      ElMessage.success('已删除')
      load()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

watch(
  () => dlg.value,
  (v) => {
    if (v) void ensureUsers()
  },
)

onMounted(async () => {
  await ensureUsers()
  load()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="head">
        <span>帖子管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新建</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <div class="table-wrap">
    <el-table v-loading="loading" :data="rows" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" fixed="left" />
      <el-table-column label="首图" width="72" align="center">
        <template #default="{ row }">
          <AdminImageField :model-value="postFirstImageUrl(row)" :editable="false" :size="40" />
        </template>
      </el-table-column>
      <el-table-column label="用户" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
      <el-table-column label="图片" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtJsonArr(row.imageUrls) }}</template>
      </el-table-column>
      <el-table-column label="标签" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtJsonArr(row.tags) }}</template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览" width="72" />
      <el-table-column prop="likeCount" label="点赞" width="72" />
      <el-table-column prop="shareCount" label="分享" width="72" />
      <el-table-column prop="commentCount" label="评论" width="72" />
      <el-table-column prop="createTime" label="创建时间" width="168" />
      <el-table-column prop="updateTime" label="更新时间" width="168" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
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
      layout="total, prev, pager, next"
      @current-change="load"
    />

    <el-dialog v-model="dlg" title="帖子" width="640px" destroy-on-close>
      <el-form label-width="120px">
        <el-form-item label="用户">
          <el-select v-model="form.userId" filterable placeholder="选择用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="图片列表">
          <AdminImageUrlListEditor v-model="postImageUrls" />
        </el-form-item>
        <el-form-item label="标签">
          <AdminTagEditor v-model="postTags" placeholder="标签，回车添加" />
        </el-form-item>
        <el-row>
          <el-form-item label="阅览">
            <el-input-number v-model="form.viewCount" :min="0" />
          </el-form-item>
          <el-form-item label="点赞">
            <el-input-number v-model="form.likeCount" :min="0" />
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item label="评论">
            <el-input-number v-model="form.commentCount" :min="0" />
          </el-form-item>
          <el-form-item label="分享">
            <el-input-number v-model="form.shareCount" :min="0" />
          </el-form-item>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dlg = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
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
.pager {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.table-wrap :deep(.el-table) {
  min-width: 960px;
}
</style>
