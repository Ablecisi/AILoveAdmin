<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadAdminImage } from '@/api/adminUpload'
import AdminImageField from '@/components/AdminImageField.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const inputRef = ref(null)

function pick() {
  if (uploading.value) return
  inputRef.value?.click()
}

async function onFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  uploading.value = true
  try {
    const url = await uploadAdminImage(f)
    const next = [...props.modelValue, url]
    emit('update:modelValue', next)
    ElMessage.success('已添加图片')
  } catch (err) {
    ElMessage.error(err?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

function removeAt(i) {
  const next = props.modelValue.filter((_, j) => j !== i)
  emit('update:modelValue', next)
}

const urlDraft = ref('')

function addUrl() {
  const u = String(urlDraft.value || '').trim()
  if (!u) return
  if (props.modelValue.includes(u)) {
    ElMessage.warning('已存在')
    return
  }
  emit('update:modelValue', [...props.modelValue, u])
  urlDraft.value = ''
}
</script>

<template>
  <div class="img-list-editor">
    <div class="row">
      <div v-for="(url, i) in modelValue" :key="`${url}-${i}`" class="cell">
        <AdminImageField :model-value="url" :editable="false" :size="64" />
        <el-button type="danger" link size="small" @click="removeAt(i)">移除</el-button>
      </div>
    </div>
    <div class="toolbar">
      <input ref="inputRef" type="file" accept="image/*" class="hid" @change="onFile" />
      <el-button type="primary" plain size="small" :loading="uploading" @click="pick">上传添加图片</el-button>
      <el-input
        v-model="urlDraft"
        placeholder="或粘贴图片 URL 回车添加"
        clearable
        class="url-inp"
        @keyup.enter="addUrl"
      />
      <el-button size="small" @click="addUrl">添加 URL</el-button>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.toolbar {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.url-inp {
  width: 260px;
  max-width: 100%;
}

.hid {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
</style>
