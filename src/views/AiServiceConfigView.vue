<script setup>
import { ref, onMounted } from 'vue'
import { fetchAiServiceConfig, putAiServiceConfig } from '@/api/adminAiServiceConfig'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)

const form = ref({
  provider: '',
  endpoint: '',
  apiKey: '',
  includeReasoningContent: false,
  bertUrl: '',
})

const apiKeyConfigured = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await fetchAiServiceConfig()
    if (data?.code === 1 && data.data) {
      const d = data.data
      form.value.provider = d.provider ?? ''
      form.value.endpoint = d.endpoint ?? ''
      form.value.apiKey = ''
      form.value.includeReasoningContent = !!d.includeReasoningContent
      form.value.bertUrl = d.bertUrl ?? ''
      apiKeyConfigured.value = !!d.apiKeyConfigured
    } else {
      ElMessage.error(data?.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const body = {
      provider: form.value.provider.trim(),
      endpoint: form.value.endpoint.trim(),
      apiKey: form.value.apiKey.trim(),
      includeReasoningContent: form.value.includeReasoningContent,
      bertUrl: form.value.bertUrl != null ? String(form.value.bertUrl).trim() : '',
    }
    const { data } = await putAiServiceConfig(body)
    if (data?.code === 1) {
      ElMessage.success('已保存，服务端已立即生效')
      form.value.apiKey = ''
      await load()
    } else {
      ElMessage.error(data?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>AI 服务配置</span>
          <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        class="mb"
        title="配置写入 app_config 表，Java 进程内立即生效，无需重启。LLM API Key 不会出现在 C 端 GET /api/app/bootstrap 中。"
      />

      <el-form v-loading="loading" label-width="180px" class="form">
        <el-form-item label="模型标识 (provider)">
          <el-input
            v-model="form.provider"
            placeholder="对应请求体 model 字段，如 gpt-4o-mini、deepseek-chat"
          />
        </el-form-item>
        <el-form-item label="LLM 接口 URL (endpoint)">
          <el-input
            v-model="form.endpoint"
            type="textarea"
            :rows="2"
            placeholder="OpenAI 兼容 Chat Completions 完整 URL，如 https://api.openai.com/v1/chat/completions"
          />
        </el-form-item>
        <el-form-item label="LLM API Key">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="留空则不修改已保存的密钥"
          />
          <div v-if="apiKeyConfigured" class="hint">当前已配置密钥（出于安全不显示明文）</div>
        </el-form-item>
        <el-form-item label="包含推理链内容">
          <el-switch v-model="form.includeReasoningContent" />
          <span class="hint-inline">正文为空时是否使用 reasoning_content（部分推理模型）</span>
        </el-form-item>
        <el-form-item label="BERT 情绪接口 URL">
          <el-input
            v-model="form.bertUrl"
            type="textarea"
            :rows="2"
            placeholder="POST JSON 如 { &quot;text&quot;: &quot;...&quot; }；留空则情绪识别走服务端降级"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mb {
  margin-bottom: 16px;
}

.form {
  max-width: 820px;
}

.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

.hint-inline {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
