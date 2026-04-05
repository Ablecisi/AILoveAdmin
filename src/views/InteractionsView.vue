<script setup>
import { ref, watch, reactive, computed } from 'vue'
import * as D from '@/api/adminData'
import {
  loadUserOptions,
  loadArticleOptions,
  loadPostOptions,
  formatUserOptionLabel,
  resolveUserNickname,
} from '@/api/adminLookups'
import { ElMessage, ElMessageBox } from 'element-plus'

function ok(data) {
  return data?.code === 1
}

const tab = ref('follow')
const userOptions = ref([])
const articleOptions = ref([])
const postOptions = ref([])

async function ensureLookups() {
  try {
    const tasks = []
    if (!userOptions.value.length) tasks.push(loadUserOptions().then((r) => (userOptions.value = r)))
    if (!articleOptions.value.length) tasks.push(loadArticleOptions().then((r) => (articleOptions.value = r)))
    if (!postOptions.value.length) tasks.push(loadPostOptions().then((r) => (postOptions.value = r)))
    await Promise.all(tasks)
  } catch (e) {
    ElMessage.warning(e?.response?.data?.msg || e?.message || '下拉数据加载失败')
  }
}

function articleTitle(id) {
  if (id == null) return '—'
  return articleOptions.value.find((a) => a.id === id)?.title?.trim() || `文章 #${id}`
}

function postLabel(id) {
  if (id == null) return '—'
  return postOptions.value.find((p) => p.id === id)?.label || `帖子 #${id}`
}

function reloadCurrentTab() {
  const t = tab.value
  if (t === 'follow') loadFollow()
  if (t === 'al') loadAl()
  if (t === 'pl') loadPl()
  if (t === 'cl') loadCl()
  if (t === 'ac') loadAc()
}

// —— 编辑弹窗 ——
const editOpen = ref(false)
const editKind = ref('follow')
const editSaving = ref(false)
const ef = reactive({
  id: null,
  followerId: null,
  followingId: null,
  userId: null,
  articleId: null,
  postId: null,
  commentId: null,
})

const editTitle = computed(() => {
  const m = {
    follow: '编辑关注',
    al: '编辑文章点赞',
    pl: '编辑帖子点赞',
    cl: '编辑评论点赞',
    ac: '编辑文章收藏',
  }
  return m[editKind.value] || '编辑'
})

async function openRelEdit(kind, row) {
  await ensureLookups()
  editKind.value = kind
  ef.id = row.id
  ef.followerId = row.followerId ?? null
  ef.followingId = row.followingId ?? null
  ef.userId = row.userId ?? null
  ef.articleId = row.articleId ?? null
  ef.postId = row.postId ?? null
  ef.commentId = row.commentId ?? null
  editOpen.value = true
}

async function saveRelEdit() {
  editSaving.value = true
  try {
    const k = editKind.value
    let data
    if (k === 'follow') {
      if (ef.followerId == null || ef.followingId == null) {
        ElMessage.warning('请选择粉丝与被关注用户')
        return
      }
      ;({ data } = await D.follows.update(ef.id, {
        followerId: ef.followerId,
        followingId: ef.followingId,
      }))
    } else if (k === 'al') {
      if (ef.userId == null || ef.articleId == null) {
        ElMessage.warning('请选择用户与文章')
        return
      }
      ;({ data } = await D.rel.articleLikes.update(ef.id, { userId: ef.userId, articleId: ef.articleId }))
    } else if (k === 'pl') {
      if (ef.userId == null || ef.postId == null) {
        ElMessage.warning('请选择用户与帖子')
        return
      }
      ;({ data } = await D.rel.postLikes.update(ef.id, { userId: ef.userId, postId: ef.postId }))
    } else if (k === 'cl') {
      if (ef.userId == null || ef.commentId == null) {
        ElMessage.warning('请填写用户与评论 ID')
        return
      }
      ;({ data } = await D.rel.commentLikes.update(ef.id, { userId: ef.userId, commentId: ef.commentId }))
    } else if (k === 'ac') {
      if (ef.userId == null || ef.articleId == null) {
        ElMessage.warning('请选择用户与文章')
        return
      }
      ;({ data } = await D.rel.articleCollects.update(ef.id, { userId: ef.userId, articleId: ef.articleId }))
    } else {
      return
    }
    if (ok(data)) {
      ElMessage.success('已保存')
      editOpen.value = false
      reloadCurrentTab()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  } finally {
    editSaving.value = false
  }
}

// —— 关注 ——
const fLoading = ref(false)
const fRows = ref([])
const fTotal = ref(0)
const fPage = ref(1)
const fSize = ref(10)
async function loadFollow() {
  fLoading.value = true
  try {
    const { data } = await D.follows.page({ page: fPage.value, size: fSize.value })
    if (ok(data) && data.data) {
      fRows.value = data.data.records ?? []
      fTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    fLoading.value = false
  }
}
async function delFollow(row) {
  try {
    await ElMessageBox.confirm(`删除关注关系 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.follows.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadFollow()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// —— 文章赞 ——
const alLoading = ref(false)
const alRows = ref([])
const alTotal = ref(0)
const alPage = ref(1)
const alSize = ref(10)
async function loadAl() {
  alLoading.value = true
  try {
    const { data } = await D.rel.articleLikes.page({ page: alPage.value, size: alSize.value })
    if (ok(data) && data.data) {
      alRows.value = data.data.records ?? []
      alTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    alLoading.value = false
  }
}
async function delAl(row) {
  try {
    await ElMessageBox.confirm(`删除 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.rel.articleLikes.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadAl()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// —— 帖子赞 ——
const plLoading = ref(false)
const plRows = ref([])
const plTotal = ref(0)
const plPage = ref(1)
const plSize = ref(10)
async function loadPl() {
  plLoading.value = true
  try {
    const { data } = await D.rel.postLikes.page({ page: plPage.value, size: plSize.value })
    if (ok(data) && data.data) {
      plRows.value = data.data.records ?? []
      plTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    plLoading.value = false
  }
}
async function delPl(row) {
  try {
    await ElMessageBox.confirm(`删除 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.rel.postLikes.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadPl()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// —— 评论赞 ——
const clLoading = ref(false)
const clRows = ref([])
const clTotal = ref(0)
const clPage = ref(1)
const clSize = ref(10)
async function loadCl() {
  clLoading.value = true
  try {
    const { data } = await D.rel.commentLikes.page({ page: clPage.value, size: clSize.value })
    if (ok(data) && data.data) {
      clRows.value = data.data.records ?? []
      clTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    clLoading.value = false
  }
}
async function delCl(row) {
  try {
    await ElMessageBox.confirm(`删除 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.rel.commentLikes.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadCl()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

// —— 文章收藏 ——
const acLoading = ref(false)
const acRows = ref([])
const acTotal = ref(0)
const acPage = ref(1)
const acSize = ref(10)
async function loadAc() {
  acLoading.value = true
  try {
    const { data } = await D.rel.articleCollects.page({ page: acPage.value, size: acSize.value })
    if (ok(data) && data.data) {
      acRows.value = data.data.records ?? []
      acTotal.value = Number(data.data.total ?? 0)
    } else ElMessage.error(data?.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    acLoading.value = false
  }
}
async function delAc(row) {
  try {
    await ElMessageBox.confirm(`删除 #${row.id}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await D.rel.articleCollects.del(row.id)
    if (ok(data)) {
      ElMessage.success('已删除')
      loadAc()
    } else ElMessage.error(data?.msg || '失败')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '失败')
  }
}

watch(tab, async (t) => {
  await ensureLookups()
  if (t === 'follow') loadFollow()
  if (t === 'al') loadAl()
  if (t === 'pl') loadPl()
  if (t === 'cl') loadCl()
  if (t === 'ac') loadAc()
})

void ensureLookups().then(() => loadFollow())
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>互动关系</span>
      <p class="sub">关注、点赞、收藏等关系表维护；可编辑关联 ID，列表可横向滚动。</p>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="关注" name="follow">
        <el-button class="mb" @click="loadFollow">刷新</el-button>
        <div class="table-wrap">
          <el-table v-loading="fLoading" :data="fRows" stripe table-layout="auto">
            <el-table-column prop="id" label="ID" width="64" fixed="left" />
            <el-table-column label="粉丝" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.followerId, userOptions) }}</template>
            </el-table-column>
            <el-table-column label="被关注" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.followingId, userOptions) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="156" />
            <el-table-column label="操作" width="120" fixed="right" align="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRelEdit('follow', row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="delFollow(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="fPage"
          v-model:page-size="fSize"
          class="pager"
          :total="fTotal"
          layout="total, prev, pager, next"
          @current-change="loadFollow"
        />
      </el-tab-pane>

      <el-tab-pane label="文章点赞" name="al">
        <el-button class="mb" @click="loadAl">刷新</el-button>
        <div class="table-wrap">
          <el-table v-loading="alLoading" :data="alRows" stripe table-layout="auto">
            <el-table-column prop="id" label="ID" width="64" fixed="left" />
            <el-table-column label="用户" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
            </el-table-column>
            <el-table-column label="文章" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ articleTitle(row.articleId) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="156" />
            <el-table-column label="操作" width="120" fixed="right" align="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRelEdit('al', row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="delAl(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="alPage"
          v-model:page-size="alSize"
          class="pager"
          :total="alTotal"
          layout="total, prev, pager, next"
          @current-change="loadAl"
        />
      </el-tab-pane>

      <el-tab-pane label="帖子点赞" name="pl">
        <el-button class="mb" @click="loadPl">刷新</el-button>
        <div class="table-wrap">
          <el-table v-loading="plLoading" :data="plRows" stripe table-layout="auto">
            <el-table-column prop="id" label="ID" width="64" fixed="left" />
            <el-table-column label="用户" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
            </el-table-column>
            <el-table-column label="帖子" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ postLabel(row.postId) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="156" />
            <el-table-column label="操作" width="120" fixed="right" align="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRelEdit('pl', row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="delPl(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="plPage"
          v-model:page-size="plSize"
          class="pager"
          :total="plTotal"
          layout="total, prev, pager, next"
          @current-change="loadPl"
        />
      </el-tab-pane>

      <el-tab-pane label="评论点赞" name="cl">
        <el-button class="mb" @click="loadCl">刷新</el-button>
        <div class="table-wrap">
          <el-table v-loading="clLoading" :data="clRows" stripe table-layout="auto">
            <el-table-column prop="id" label="ID" width="64" fixed="left" />
            <el-table-column label="用户" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
            </el-table-column>
            <el-table-column label="评论" width="100">
              <template #default="{ row }">#{{ row.commentId }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="156" />
            <el-table-column label="操作" width="120" fixed="right" align="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRelEdit('cl', row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="delCl(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="clPage"
          v-model:page-size="clSize"
          class="pager"
          :total="clTotal"
          layout="total, prev, pager, next"
          @current-change="loadCl"
        />
      </el-tab-pane>

      <el-tab-pane label="文章收藏" name="ac">
        <el-button class="mb" @click="loadAc">刷新</el-button>
        <div class="table-wrap">
          <el-table v-loading="acLoading" :data="acRows" stripe table-layout="auto">
            <el-table-column prop="id" label="ID" width="64" fixed="left" />
            <el-table-column label="用户" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ resolveUserNickname(row.userId, userOptions) }}</template>
            </el-table-column>
            <el-table-column label="文章" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ articleTitle(row.articleId) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="156" />
            <el-table-column label="操作" width="120" fixed="right" align="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRelEdit('ac', row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="delAc(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="acPage"
          v-model:page-size="acSize"
          class="pager"
          :total="acTotal"
          layout="total, prev, pager, next"
          @current-change="loadAc"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="editOpen" :title="editTitle" width="480px" destroy-on-close>
      <el-form v-if="editKind === 'follow'" label-width="88px">
        <el-form-item label="粉丝">
          <el-select v-model="ef.followerId" filterable placeholder="用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="被关注">
          <el-select v-model="ef.followingId" filterable placeholder="用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-form v-else-if="editKind === 'al' || editKind === 'ac'" label-width="88px">
        <el-form-item label="用户">
          <el-select v-model="ef.userId" filterable placeholder="用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文章">
          <el-select v-model="ef.articleId" filterable placeholder="文章" style="width: 100%">
            <el-option
              v-for="a in articleOptions"
              :key="a.id"
              :label="(a.title || '').trim() || `#${a.id}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-form v-else-if="editKind === 'pl'" label-width="88px">
        <el-form-item label="用户">
          <el-select v-model="ef.userId" filterable placeholder="用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="帖子">
          <el-select v-model="ef.postId" filterable placeholder="帖子" style="width: 100%">
            <el-option v-for="p in postOptions" :key="p.id" :label="p.label || `#${p.id}`" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-form v-else-if="editKind === 'cl'" label-width="96px">
        <el-form-item label="用户">
          <el-select v-model="ef.userId" filterable placeholder="用户" style="width: 100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="formatUserOptionLabel(u)" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="评论 ID">
          <el-input-number v-model="ef.commentId" :min="1" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveRelEdit">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mb {
  margin-bottom: 10px;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.table-wrap :deep(.el-table) {
  min-width: 640px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
