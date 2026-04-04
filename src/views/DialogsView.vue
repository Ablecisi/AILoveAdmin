<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchAdminConversations, fetchAdminMessages } from '@/api/adminDialogs'
import { ElMessage } from 'element-plus'

const tab = ref('conv')

const convLoading = ref(false)
const convData = ref([])
const convTotal = ref(0)
const convPage = ref(1)
const convSize = ref(10)
const convKeyword = ref('')
const convUserId = ref('')

const msgLoading = ref(false)
const msgData = ref([])
const msgTotal = ref(0)
const msgPage = ref(1)
const msgSize = ref(10)
const msgKeyword = ref('')
const msgConversationId = ref('')

async function loadConversations() {
  convLoading.value = true
  try {
    const params = {
      page: convPage.value,
      size: convSize.value,
      keyword: convKeyword.value.trim() || undefined,
    }
    const uid = convUserId.value === '' ? undefined : Number(convUserId.value)
    if (uid != null && !Number.isNaN(uid)) params.userId = uid

    const { data } = await fetchAdminConversations(params)
    if (data?.code === 1 && data.data) {
      convData.value = data.data.records ?? []
      convTotal.value = Number(data.data.total ?? 0)
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    convLoading.value = false
  }
}

async function loadMessages() {
  msgLoading.value = true
  try {
    const params = {
      page: msgPage.value,
      size: msgSize.value,
      keyword: msgKeyword.value.trim() || undefined,
    }
    const cid = msgConversationId.value === '' ? undefined : Number(msgConversationId.value)
    if (cid != null && !Number.isNaN(cid)) params.conversationId = cid

    const { data } = await fetchAdminMessages(params)
    if (data?.code === 1 && data.data) {
      msgData.value = data.data.records ?? []
      msgTotal.value = Number(data.data.total ?? 0)
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    msgLoading.value = false
  }
}

function searchConv() {
  convPage.value = 1
  loadConversations()
}

function searchMsg() {
  msgPage.value = 1
  loadMessages()
}

function onConvSizeChange() {
  convPage.value = 1
  void loadConversations()
}

function onMsgSizeChange() {
  msgPage.value = 1
  void loadMessages()
}

watch(tab, (v) => {
  if (v === 'conv' && convData.value.length === 0 && convTotal.value === 0) loadConversations()
  if (v === 'msg' && msgData.value.length === 0 && msgTotal.value === 0) loadMessages()
})

onMounted(() => {
  loadConversations()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span>会话与消息</span>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="会话检索" name="conv">
        <div class="toolbar">
          <el-input
            v-model="convKeyword"
            placeholder="标题 / 摘要 / 会话 ID"
            clearable
            style="width: 220px; margin-right: 8px"
            @keyup.enter="searchConv"
          />
          <el-input
            v-model="convUserId"
            placeholder="用户 ID"
            clearable
            style="width: 120px; margin-right: 8px"
            @keyup.enter="searchConv"
          />
          <el-button type="primary" @click="searchConv">搜索</el-button>
          <el-button @click="loadConversations">刷新</el-button>
        </div>
        <el-table v-loading="convLoading" :data="convData" stripe class="mt" style="width: 100%">
          <el-table-column prop="id" label="会话 ID" width="96" />
          <el-table-column prop="userId" label="用户" width="88" />
          <el-table-column prop="characterId" label="角色 ID" width="88" />
          <el-table-column prop="characterName" label="角色" width="120" show-overflow-tooltip />
          <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
          <el-table-column prop="lastMessage" label="最后消息" min-width="180" show-overflow-tooltip />
          <el-table-column prop="lastMsgAt" label="最后活跃" width="168" />
          <el-table-column prop="createTime" label="创建" width="168" />
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="convPage"
            v-model:page-size="convSize"
            :total="convTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadConversations"
            @size-change="onConvSizeChange"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="消息检索" name="msg">
        <div class="toolbar">
          <el-input
            v-model="msgConversationId"
            placeholder="会话 ID（可选）"
            clearable
            style="width: 140px; margin-right: 8px"
            @keyup.enter="searchMsg"
          />
          <el-input
            v-model="msgKeyword"
            placeholder="正文关键词"
            clearable
            style="width: 200px; margin-right: 8px"
            @keyup.enter="searchMsg"
          />
          <el-button type="primary" @click="searchMsg">搜索</el-button>
          <el-button @click="loadMessages">刷新</el-button>
        </div>
        <el-table v-loading="msgLoading" :data="msgData" stripe class="mt" style="width: 100%">
          <el-table-column prop="id" label="消息 ID" width="96" />
          <el-table-column prop="conversationId" label="会话" width="96" />
          <el-table-column prop="userId" label="用户" width="88" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.type === 1 ? 'info' : 'primary'">
                {{ row.type === 1 ? 'AI' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contentPreview" label="内容（前 500 字）" min-width="260" show-overflow-tooltip />
          <el-table-column prop="emotion" label="情绪" width="88" />
          <el-table-column prop="createTime" label="时间" width="168" />
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="msgPage"
            v-model:page-size="msgSize"
            :total="msgTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadMessages"
            @size-change="onMsgSizeChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.mt {
  margin-top: 12px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
