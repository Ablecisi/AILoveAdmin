<script setup>
import {ref, onMounted, reactive, computed, watch} from 'vue'
import {
  fetchAdminComments,
  fetchAdminComment,
  updateAdminComment,
  deleteAdminComment,
  purgeAdminComment,
} from '@/api/adminComments'
import {
  loadUserOptions,
  loadArticleOptions,
  loadPostOptions,
  formatUserOptionLabel,
  resolveUserNickname,
} from '@/api/adminLookups'
import {ElMessage, ElMessageBox} from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const filterArticleId = ref(null)
const filterPostId = ref(null)

const userOptions = ref([])
const articleOptions = ref([])
const postOptions = ref([])

const articleLabelById = computed(() => {
  const m = new Map()
  for (const a of articleOptions.value) {
    m.set(a.id, (a.title || '').trim() || `#${a.id}`)
  }
  return m
})

const postLabelById = computed(() => {
  const m = new Map()
  for (const p of postOptions.value) {
    m.set(p.id, p.label || `#${p.id}`)
  }
  return m
})

function articleColLabel(id) {
  if (id == null) return '—'
  return articleLabelById.value.get(id) ?? `#${id}`
}

function postColLabel(id) {
  if (id == null) return '—'
  return postLabelById.value.get(id) ?? `#${id}`
}

function userColLabel(uid) {
  return resolveUserNickname(uid, userOptions.value)
}

async function ensureLookups() {
  try {
    const [users, articles, posts] = await Promise.all([
      loadUserOptions(),
      loadArticleOptions(),
      loadPostOptions(),
    ])
    userOptions.value = users
    articleOptions.value = articles
    postOptions.value = posts
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '下拉数据加载失败')
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
    if (filterArticleId.value != null) params.articleId = filterArticleId.value
    if (filterPostId.value != null) params.postId = filterPostId.value

    const {data} = await fetchAdminComments(params)
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
    await ElMessageBox.confirm(`确定软删评论 #${row.id}？`, '确认', {type: 'warning'})
  } catch {
    return
  }
  try {
    const {data} = await deleteAdminComment(row.id)
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
  userId: null,
  parentId: null,
  rootId: null,
  path: '',
  depth: null,
  likeCount: 0,
  replyCount: 0,
  isDeleted: false,
})

const parentCommentOptions = ref([])

async function refreshParentCommentOptions() {
  const aid = editForm.articleId
  const pid = editForm.postId
  if (aid == null && pid == null) {
    parentCommentOptions.value = []
    return
  }
  try {
    const params = {page: 1, size: 100}
    if (aid != null) params.articleId = aid
    if (pid != null) params.postId = pid
    const {data} = await fetchAdminComments(params)
    if (data?.code !== 1 || !data.data?.records) {
      parentCommentOptions.value = []
      return
    }
    parentCommentOptions.value = data.data.records
        .filter((r) => r.id !== editId.value)
        .map((r) => ({
          id: r.id,
          label: `#${r.id} ${(r.content || '').replace(/\s+/g, ' ').trim().slice(0, 36)}`,
        }))
  } catch {
    parentCommentOptions.value = []
  }
}

watch(
    () => [editDlg.value, editForm.articleId, editForm.postId],
    () => {
      if (editDlg.value) void refreshParentCommentOptions()
    },
)

async function openEdit(row) {
  await ensureLookups()
  editId.value = row.id
  try {
    const {data} = await fetchAdminComment(row.id)
    if (data?.code !== 1 || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    const r = data.data
    editForm.content = r.content ?? ''
    editForm.articleId = r.articleId ?? null
    editForm.postId = r.postId ?? null
    const uid = r.userId != null && r.userId !== '' ? Number(r.userId) : null
    editForm.userId = uid != null && !Number.isNaN(uid) ? uid : null
    editForm.parentId = r.parentId ?? null
    editForm.rootId = r.rootId ?? null
    editForm.path = r.path ?? ''
    editForm.depth = r.depth ?? null
    editForm.likeCount = r.likeCount ?? 0
    editForm.replyCount = r.replyCount ?? 0
    editForm.isDeleted = !!r.isDeleted
    editDlg.value = true
    await refreshParentCommentOptions()
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
      userId: editForm.userId != null ? String(editForm.userId) : null,
      parentId: editForm.parentId,
      rootId: editForm.rootId,
      path: editForm.path || null,
      depth: editForm.depth,
      likeCount: editForm.likeCount,
      replyCount: editForm.replyCount,
      isDeleted: editForm.isDeleted,
    }
    const {data} = await updateAdminComment(editId.value, body)
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
        {type: 'warning'},
    )
  } catch {
    return
  }
  try {
    const {data} = await purgeAdminComment(row.id)
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

onMounted(() => {
  void ensureLookups()
  load()
})
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
          <el-select
              v-model="filterArticleId"
              placeholder="文章"
              clearable
              filterable
              style="width: 200px; margin-right: 8px"
              @change="onSearch"
          >
            <el-option
                v-for="a in articleOptions"
                :key="a.id"
                :label="(a.title || '').trim() || `#${a.id}`"
                :value="a.id"
            />
          </el-select>
          <el-select
              v-model="filterPostId"
              placeholder="帖子"
              clearable
              filterable
              style="width: 200px; margin-right: 8px"
              @change="onSearch"
          >
            <el-option v-for="p in postOptions" :key="p.id" :label="p.label" :value="p.id"/>
          </el-select>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" fixed="left" />
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="postId" label="帖子ID" width="88" />
      <el-table-column prop="articleId" label="文章ID" width="88" />
      <el-table-column prop="userId" label="用户ID" width="88" />
      <el-table-column prop="userName" label="用户昵称" width="100" show-overflow-tooltip />
      <el-table-column prop="likeCount" label="点赞数" width="88" />
      <el-table-column prop="replyCount" label="回复数" width="96" />
      <el-table-column prop="parentId" label="父评论ID" width="88" />
      <el-table-column prop="rootId" label="根评论ID" width="88" />
      <el-table-column prop="path" label="路径" min-width="120" show-overflow-tooltip />
      <el-table-column prop="depth" label="层级" width="72" />
      <el-table-column prop="deleted" label="已删除" width="96">
        <template #default="{ row }">
          <span>{{ row.deleted ? 1 : 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="168" />
      <el-table-column prop="updateTime" label="更新时间" width="168" />
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

    <el-dialog v-model="editDlg" title="编辑评论" width="720px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="5"/>
        </el-form-item>
        <el-form-item label="用户">
          <el-select v-model="editForm.userId" clearable filterable placeholder="选择用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="文章">
          <el-select v-model="editForm.articleId" clearable filterable placeholder="所属文章（可空）" style="width: 100%">
            <el-option
                v-for="a in articleOptions"
                :key="a.id"
                :label="(a.title || '').trim() || `#${a.id}`"
                :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="帖子">
          <el-select v-model="editForm.postId" clearable filterable placeholder="所属帖子（可空）" style="width: 100%">
            <el-option v-for="p in postOptions" :key="p.id" :label="p.label" :value="p.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="赞 / 回复">
          <el-input-number v-model="editForm.likeCount" :min="0" :controls="false" />
          <el-input-number v-model="editForm.replyCount" :min="0" :controls="false" class="ml8" />
        </el-form-item>
        <el-form-item label="软删">
          <el-switch v-model="editForm.isDeleted" />
        </el-form-item>
        <el-collapse class="collapse">
          <el-collapse-item title="评论树（谨慎修改）" name="tree">
            <el-form-item label="父评论">
              <el-select
                  v-model="editForm.parentId"
                  clearable
                  filterable
                  placeholder="无表示顶层"
                  style="width: 100%"
              >
                <el-option
                    v-for="o in parentCommentOptions"
                    :key="o.id"
                    :label="o.label"
                    :value="o.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="根评论">
              <el-select
                  v-model="editForm.rootId"
                  clearable
                  filterable
                  placeholder="可选"
                  style="width: 100%"
              >
                <el-option
                    v-for="o in parentCommentOptions"
                    :key="`r-${o.id}`"
                    :label="o.label"
                    :value="o.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="路径">
              <el-input v-model="editForm.path" placeholder="路径" clearable/>
            </el-form-item>
            <el-form-item label="层级">
              <el-input-number v-model="editForm.depth" :min="0" :controls="false" clearable :value-on-clear="null"/>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
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

.ml8 {
  margin-left: 8px;
}

.collapse {
  width: 100%;
  border: none;
}

.collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
