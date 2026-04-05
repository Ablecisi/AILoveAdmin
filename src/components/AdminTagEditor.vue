<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: '输入后回车或点击添加' },
  addButtonText: { type: String, default: '添加' },
})

const emit = defineEmits(['update:modelValue'])

const draft = ref('')

function add() {
  const t = String(draft.value || '').trim()
  if (!t) return
  if (props.modelValue.includes(t)) {
    ElMessage.warning('已存在')
    return
  }
  emit('update:modelValue', [...props.modelValue, t])
  draft.value = ''
}

function remove(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="admin-tag-editor">
    <el-tag
      v-for="(t, i) in modelValue"
      :key="`${t}-${i}`"
      class="chip"
      closable
      @close="remove(i)"
    >
      {{ t }}
    </el-tag>
    <el-input
      v-model="draft"
      class="draft"
      :placeholder="placeholder"
      clearable
      @keyup.enter="add"
    />
    <el-button type="primary" plain @click="add">{{ addButtonText }}</el-button>
  </div>
</template>

<style scoped>
.admin-tag-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.chip {
  margin: 0;
}

.draft {
  width: 220px;
  max-width: 100%;
}
</style>
