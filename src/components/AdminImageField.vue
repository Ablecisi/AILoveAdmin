<script setup>
import { computed, ref } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { uploadAdminImage } from '@/api/adminUpload'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: String, default: '' },
  editable: { type: Boolean, default: false },
  /** 缩略图边长（px） */
  size: { type: Number, default: 72 },
})

const emit = defineEmits(['update:modelValue'])

const resolved = computed(() => resolveMediaUrl(props.modelValue))
const hasUrl = computed(() => !!String(props.modelValue || '').trim())

const uploading = ref(false)
const inputRef = ref(null)

function pick() {
  if (!props.editable || uploading.value) return
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
    emit('update:modelValue', url)
    ElMessage.success('已上传')
  } catch (err) {
    ElMessage.error(err?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

function clearUrl() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="admin-image-field" :class="{ editable }">
    <input ref="inputRef" type="file" accept="image/*" class="hidden-input" @change="onFile" />
    <template v-if="hasUrl">
      <el-image
        class="thumb"
        :src="resolved"
        fit="cover"
        :style="{ width: `${size}px`, height: `${size}px` }"
        :preview-disabled="!editable"
        preview-teleported
      />
      <div v-if="editable" class="actions">
        <el-button type="primary" link size="small" :loading="uploading" @click="pick">更换</el-button>
        <el-button type="danger" link size="small" @click="clearUrl">清除</el-button>
      </div>
    </template>
    <template v-else-if="editable">
      <div
        class="upload-zone"
        :style="{ width: `${size}px`, minHeight: `${size}px` }"
        @click="pick"
      >
        <el-icon v-if="!uploading" class="ico"><Picture /></el-icon>
        <span class="txt">{{ uploading ? '上传中…' : '点击上传' }}</span>
      </div>
    </template>
    <template v-else>
      <span class="dash">—</span>
    </template>
  </div>
</template>

<style scoped>
.admin-image-field {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.thumb {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  box-sizing: border-box;
  padding: 8px;
}

.upload-zone:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.ico {
  opacity: 0.75;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.dash {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
</style>
