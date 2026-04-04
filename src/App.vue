<script setup>
import { onMounted, watch } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

onMounted(() => {
  theme.applyDocumentVars()
})

watch(
  () => [theme.colors, theme.radiusSm, theme.radiusMd, theme.radiusLg, theme.shadowPreset],
  () => theme.applyDocumentVars(),
  { deep: true },
)
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
