<script setup>
import { ref, watch, reactive } from 'vue'
import * as D from '@/api/adminData'
import {
  loadUserOptions,
  loadArticleOptions,
  formatUserOptionLabel,
  resolveUserNickname,
} from '@/api/adminLookups'
import { parseTagLikeString, serializeTagsAsJson } from '@/utils/adminTagField'
import AdminTagEditor from '@/components/AdminTagEditor.vue'
import AdminImageField from '@/components/AdminImageField.vue'
import AdminImageUrlListEditor from '@/components/AdminImageUrlListEditor.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userOptions = ref([])
const articleOptions = ref([])

async function ensureUserArticleLookups() {
  try {
    const tasks = []
    if (!userOptions.value.length) tasks.push(loadUserOptions().then((r) => (userOptions.value = r)))
    if (!articleOptions.value.length) tasks.push(loadArticleOptions().then((r) => (articleOptions.value = r)))
    await Promise.all(tasks)
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '下拉数据加载失败')
  }
}

const mainTab = ref('types')

function ok(data) {
  return data?.code === 1
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
const typeEditId = ref(null)
function openTypeCreate() {
  typeEditId.value = null
  typeName.value = ''
  typeDlg.value = true
}
function openTypeEdit(row) {
  typeEditId.value = row.id
  typeName.value = row.name
  typeDlg.value = true
}
async function saveType() {
  if (!typeName.value?.trim()) return ElMessage.warning('填写名称')
  try {
    const { data } =
      typeEditId.value == null
        ? await D.types.create(typeName.value.trim())
        : await D.types.update(typeEditId.value, typeName.value.trim())
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

// ----- posts -----
const pLoading = ref(false)
const pRows = ref([])
const pTotal = ref(0)
const pPage = ref(1)
const pSize = ref(10)
const pDlg = ref(false)
const pEditId = ref(null)
const pForm = reactive({
  userId: null,
  content: '',
  viewCount: 0,
  likeCount: 0,
  shareCount: 0,
  commentCount: 0,
})
const postImageUrls = ref([])
const postTags = ref([])
async function loadPosts() {
  pLoading.value = true
  try {
    const { data } = await D.posts.page({ page: pPage.value, size: pSize.value })
    if (ok(data) && data.data) {
      pRows.value = data.data.records ?? []
      pTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    pLoading.value = false
  }
}
async function openPostCreate() {
  await ensureUserArticleLookups()
  pEditId.value = null
  postImageUrls.value = []
  postTags.value = []
  Object.assign(pForm, {
    userId: null,
    content: '',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0,
    commentCount: 0,
  })
  pDlg.value = true
}
async function openPostEdit(row) {
  await ensureUserArticleLookups()
  pEditId.value = row.id
  try {
    const { data } = await D.posts.get(row.id)
    if (!ok(data) || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    const r = data.data
    pForm.userId = r.userId
    pForm.content = r.content ?? ''
    postImageUrls.value = Array.isArray(r.imageUrls)
      ? r.imageUrls.map((x) => String(x).trim()).filter(Boolean)
      : []
    postTags.value = Array.isArray(r.tags)
      ? r.tags.map((x) => String(x).trim()).filter(Boolean)
      : []
    pForm.viewCount = r.viewCount ?? 0
    pForm.likeCount = r.likeCount ?? 0
    pForm.shareCount = r.shareCount ?? 0
    pForm.commentCount = r.commentCount ?? 0
    pDlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}
async function savePost() {
  try {
    const body = {
      userId: pForm.userId,
      content: pForm.content,
      imageUrls: [...postImageUrls.value],
      tags: [...postTags.value],
      viewCount: pForm.viewCount,
      likeCount: pForm.likeCount,
      shareCount: pForm.shareCount,
      commentCount: pForm.commentCount,
    }
    const { data } =
      pEditId.value == null ? await D.posts.create(body) : await D.posts.update(pEditId.value, body)
    if (ok(data)) {
      ElMessage.success('已保存')
      pDlg.value = false
      loadPosts()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}
async function delPost(row) {
  try {
    await ElMessageBox.confirm(`删除帖子 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.posts.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadPosts()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// ----- profiles (PK = userId) -----
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
  await ensureUserArticleLookups()
  pfEditUserId.value = null
  pfInterestTags.value = []
  Object.assign(pfForm, {
    userId: null,
    tonePreference: '',
    emotionStats: '',
    toDo: '',
  })
  pfDlg.value = true
}
async function openPfEdit(row) {
  await ensureUserArticleLookups()
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
    pfForm.tonePreference = r.tonePreference ?? ''
    pfForm.emotionStats = r.emotionStats ?? ''
    pfForm.toDo = r.toDo ?? ''
    pfDlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}
async function savePf() {
  const body = { ...pfForm, interests: serializeTagsAsJson(pfInterestTags.value) }
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

// ----- ops accounts -----
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

// ----- relation: article likes (template; 其它关系同 API 路径可自行调用) -----
const rlLoading = ref(false)
const rlRows = ref([])
const rlTotal = ref(0)
const rlPage = ref(1)
const rlSize = ref(10)
async function loadRl() {
  rlLoading.value = true
  try {
    const { data } = await D.rel.articleLikes.page({ page: rlPage.value, size: rlSize.value })
    if (ok(data) && data.data) {
      rlRows.value = data.data.records ?? []
      rlTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    rlLoading.value = false
  }
}
const rlDlg = ref(false)
const rlEditId = ref(null)
const rlForm = reactive({ userId: null, articleId: null })
async function openRlCreate() {
  await ensureUserArticleLookups()
  rlEditId.value = null
  rlForm.userId = null
  rlForm.articleId = null
  rlDlg.value = true
}
async function openRlEdit(row) {
  await ensureUserArticleLookups()
  rlEditId.value = row.id
  try {
    const { data } = await D.rel.articleLikes.get(row.id)
    if (!ok(data) || !data.data) {
      ElMessage.error(data?.msg || '加载失败')
      return
    }
    rlForm.userId = data.data.userId
    rlForm.articleId = data.data.articleId
    rlDlg.value = true
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  }
}
async function saveRl() {
  const body = { userId: rlForm.userId, articleId: rlForm.articleId }
  try {
    const { data } =
      rlEditId.value == null
        ? await D.rel.articleLikes.create(body)
        : await D.rel.articleLikes.update(rlEditId.value, body)
    if (ok(data)) {
      ElMessage.success('已保存')
      rlDlg.value = false
      loadRl()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}
async function delRl(row) {
  try {
    await ElMessageBox.confirm(`删除记录 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.rel.articleLikes.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadRl()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

watch(
  mainTab,
  async (t) => {
    if (t === 'types') loadTypes()
    if (t === 'posts') {
      await ensureUserArticleLookups()
      loadPosts()
    }
    if (t === 'profiles') {
      await ensureUserArticleLookups()
      loadProfiles()
    }
    if (t === 'ops') loadOps()
    if (t === 'rellike') {
      await ensureUserArticleLookups()
      loadRl()
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>数据维护</span>
      <p class="sub">
        表结构见 <code>ailianlian.sql</code>。<strong>会话 / 消息 / 情绪日志 / 关注</strong>及<strong>其它点赞收藏关系</strong>已提供后端
        <code>/admin/api/v1/...</code> 全量 CRUD，可在「会话与消息」页检索后按 ID 调用接口，或使用 Postman。本页包含：类型、帖子、用户画像、运营账号、文章点赞关系示例。
      </p>
    </template>

    <el-tabs v-model="mainTab">
      <el-tab-pane label="类型" name="types">
        <el-button type="primary" class="mb" @click="openTypeCreate">新建</el-button>
        <el-button class="mb" @click="loadTypes">刷新</el-button>
        <el-table v-loading="typesLoading" :data="typesRows" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" />
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

      <el-tab-pane label="帖子" name="posts">
        <el-button type="primary" class="mb" @click="openPostCreate">新建</el-button>
        <el-button class="mb" @click="loadPosts">刷新</el-button>
        <el-table v-loading="pLoading" :data="pRows" stripe>
          <el-table-column prop="id" label="ID" width="72" fixed="left" />
          <el-table-column label="首图" width="72" align="center">
            <template #default="{ row }">
              <AdminImageField :model-value="postFirstImageUrl(row)" :editable="false" :size="40" />
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="用户" width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
          </el-table-column>
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          <el-table-column label="图片列表" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ fmtJsonArr(row.imageUrls) }}</template>
          </el-table-column>
          <el-table-column label="标签" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ fmtJsonArr(row.tags) }}</template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览量" width="88" />
          <el-table-column prop="likeCount" label="点赞数" width="88" />
          <el-table-column prop="shareCount" label="分享数" width="96" />
          <el-table-column prop="commentCount" label="评论数" width="96" />
          <el-table-column prop="createTime" label="创建时间" width="168" />
          <el-table-column prop="updateTime" label="更新时间" width="168" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openPostEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="delPost(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          :current-page="pPage"
          :page-size="pSize"
          class="pager"
          :total="pTotal"
          layout="total, prev, pager, next"
          @current-change="loadPosts"
        />
      </el-tab-pane>

      <el-tab-pane label="用户画像" name="profiles">
        <el-button type="primary" class="mb" @click="openPfCreate">新建</el-button>
        <el-button class="mb" @click="loadProfiles">刷新</el-button>
        <el-table v-loading="pfLoading" :data="pfRows" stripe>
          <el-table-column prop="userId" label="用户" width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
          </el-table-column>
          <el-table-column prop="interests" label="兴趣" min-width="140" show-overflow-tooltip />
          <el-table-column prop="tonePreference" label="语气偏好" min-width="120" show-overflow-tooltip />
          <el-table-column prop="emotionStats" label="情绪统计" min-width="160" show-overflow-tooltip />
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
          :current-page="pfPage"
          :page-size="pfSize"
          class="pager"
          :total="pfTotal"
          layout="total, prev, pager, next"
          @current-change="loadProfiles"
        />
      </el-tab-pane>

      <el-tab-pane label="文章点赞关系" name="rellike">
        <el-button type="primary" class="mb" @click="openRlCreate">新建</el-button>
        <el-button class="mb" @click="loadRl">刷新</el-button>
        <el-table v-loading="rlLoading" :data="rlRows" stripe>
          <el-table-column prop="id" label="ID" width="72" />
          <el-table-column prop="userId" label="用户" width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
          </el-table-column>
          <el-table-column prop="articleId" label="文章ID" width="100" />
          <el-table-column label="文章标题" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              {{ articleOptions.find((a) => a.id === row.articleId)?.title?.trim() || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="168" />
          <el-table-column prop="updateTime" label="更新时间" width="168" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRlEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="delRl(row)">删</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          :current-page="rlPage"
          :page-size="rlSize"
          class="pager"
          :total="rlTotal"
          layout="total, prev, pager, next"
          @current-change="loadRl"
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

    <el-dialog v-model="typeDlg" :title="typeEditId == null ? '新建类型' : '编辑类型'" width="400px">
      <el-input v-model="typeName" placeholder="名称" />
      <template #footer>
        <el-button @click="typeDlg = false">取消</el-button>
        <el-button type="primary" @click="saveType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pDlg" title="帖子" width="640px">
      <el-form label-width="120px">
        <el-form-item label="用户">
          <el-select v-model="pForm.userId" filterable placeholder="选择用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="pForm.content" type="textarea" :rows="6" /></el-form-item>
        <el-form-item label="图片列表">
          <AdminImageUrlListEditor v-model="postImageUrls" />
        </el-form-item>
        <el-form-item label="标签">
          <AdminTagEditor v-model="postTags" placeholder="标签，回车添加" />
        </el-form-item>
        <el-row>
          <el-form-item label="阅览">
            <el-input-number v-model="pForm.viewCount" :min="0" />
          </el-form-item>
          <el-form-item label="点赞">
            <el-input-number v-model="pForm.likeCount" :min="0"/>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item label="评论">
            <el-input-number v-model="pForm.commentCount" :min="0"/>
          </el-form-item>
          <el-form-item label="分享">
            <el-input-number v-model="pForm.shareCount" :min="0"/>
          </el-form-item>
        </el-row>

      </el-form>
      <template #footer>
        <el-button @click="pDlg = false">取消</el-button>
        <el-button type="primary" @click="savePost">保存</el-button>
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
        <el-form-item label="语气偏好"><el-input v-model="pfForm.tonePreference" /></el-form-item>
        <el-form-item label="情绪统计"><el-input v-model="pfForm.emotionStats" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="待办"><el-input v-model="pfForm.toDo" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pfDlg = false">取消</el-button>
        <el-button type="primary" @click="savePf">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rlDlg" title="文章点赞" width="480px">
      <el-form label-width="90px">
        <el-form-item label="用户">
          <el-select v-model="rlForm.userId" filterable placeholder="选择用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文章">
          <el-select v-model="rlForm.articleId" filterable placeholder="选择文章" style="width: 100%">
            <el-option
              v-for="a in articleOptions"
              :key="a.id"
              :label="(a.title || '').trim() || `#${a.id}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rlDlg = false">取消</el-button>
        <el-button type="primary" @click="saveRl">保存</el-button>
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

.ml8 {
  margin-left: 8px;
}

.pager {
  margin-top: 12px;
}

.mt8 {
  margin-top: 8px;
}
</style>
