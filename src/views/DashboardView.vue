<script setup>
import { ref, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { fetchBootstrap } from '@/api/bootstrap'
import { fetchDashboardTotals } from '@/api/adminDashboard'
import { ElMessage } from 'element-plus'

const CHART_COLORS = ['#c026d3', '#ec4899', '#8b5cf6', '#d946ef', '#f472b6', '#a855f7']

const bootstrapLoading = ref(false)
const bootstrap = ref(null)
const bootstrapError = ref('')

const totalsLoading = ref(false)
const totals = ref({
  users: null,
  characters: null,
  articles: null,
  comments: null,
  conversations: null,
  messages: null,
})

const lineRef = shallowRef(null)
const barRef = shallowRef(null)
const pieRef = shallowRef(null)
let chartLine = null
let chartBar = null
let chartPie = null

function ok(data) {
  return data?.code === 1
}

async function loadBootstrap() {
  bootstrapLoading.value = true
  bootstrapError.value = ''
  try {
    const { data } = await fetchBootstrap()
    if (ok(data) && data.data) bootstrap.value = data.data
    else bootstrapError.value = data?.msg || '接口返回异常'
  } catch (e) {
    bootstrapError.value = e?.message || 'Bootstrap 请求失败'
  } finally {
    bootstrapLoading.value = false
  }
}

async function loadTotals() {
  totalsLoading.value = true
  try {
    totals.value = await fetchDashboardTotals()
  } catch {
    /* 401 等由拦截器处理 */
  } finally {
    totalsLoading.value = false
  }
}

function buildLineOption() {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const base = totals.value.users ?? 120
  const series = days.map((_, i) => Math.max(0, Math.round(base * (0.55 + Math.sin(i * 0.7) * 0.12 + i * 0.04))))
  return {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: days, axisLine: { lineStyle: { color: '#c4b5d5' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: 'rgba(168,85,247,0.12)' } } },
    series: [
      {
        name: '活跃指数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(192,38,211,0.35)' },
            { offset: 1, color: 'rgba(192,38,211,0.02)' },
          ]),
        },
        data: series,
      },
    ],
  }
}

function buildBarOption() {
  const keys = [
    ['用户', totals.value.users],
    ['AI 角色', totals.value.characters],
    ['文章', totals.value.articles],
    ['评论', totals.value.comments],
    ['会话', totals.value.conversations],
    ['消息', totals.value.messages],
  ]
  const names = keys.map(([a]) => a)
  const vals = keys.map(([, b]) => (typeof b === 'number' ? b : 0))
  return {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e9d5ff' } },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: 'rgba(168,85,247,0.12)' } } },
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '52%',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#d946ef' },
            { offset: 1, color: '#8b5cf6' },
          ]),
        },
        data: vals,
      },
    ],
  }
}

function buildPieOption() {
  const pieData = [
    { name: '用户', value: totals.value.users ?? 1 },
    { name: '角色', value: totals.value.characters ?? 1 },
    { name: '文章', value: totals.value.articles ?? 1 },
    { name: '评论', value: totals.value.comments ?? 1 },
  ].filter((d) => d.value > 0)
  return {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#6b7280' } },
    series: [
      {
        name: '结构',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#4b5563' },
        data: pieData,
      },
    ],
  }
}

function disposeCharts() {
  chartLine?.dispose()
  chartBar?.dispose()
  chartPie?.dispose()
  chartLine = chartBar = chartPie = null
}

function resizeCharts() {
  chartLine?.resize()
  chartBar?.resize()
  chartPie?.resize()
}

function initCharts() {
  disposeCharts()
  nextTick(() => {
    if (lineRef.value) {
      chartLine = echarts.init(lineRef.value)
      chartLine.setOption(buildLineOption())
    }
    if (barRef.value) {
      chartBar = echarts.init(barRef.value)
      chartBar.setOption(buildBarOption())
    }
    if (pieRef.value) {
      chartPie = echarts.init(pieRef.value)
      chartPie.setOption(buildPieOption())
    }
    resizeCharts()
  })
}

watch(
  totals,
  () => {
    if (chartLine) chartLine.setOption(buildLineOption())
    if (chartBar) chartBar.setOption(buildBarOption())
    if (chartPie) chartPie.setOption(buildPieOption())
  },
  { deep: true },
)

onMounted(async () => {
  await Promise.all([loadBootstrap(), loadTotals()])
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return String(n)
}

const kpiList = [
  { key: 'users', label: '注册用户', icon: 'User' },
  { key: 'characters', label: 'AI 角色', icon: 'Avatar' },
  { key: 'articles', label: '文章', icon: 'Document' },
  { key: 'comments', label: '评论', icon: 'ChatDotRound' },
  { key: 'conversations', label: '会话', icon: 'ChatLineRound' },
  { key: 'messages', label: '消息', icon: 'Message' },
]

async function refreshAll() {
  await Promise.all([loadBootstrap(), loadTotals()])
  ElMessage.success('已刷新')
  initCharts()
}
</script>

<template>
  <div class="dash">
    <div class="dash-head">
      <div>
        <h1 class="dash-title">运营驾驶舱</h1>
        <p class="dash-sub">AI恋恋 · 数据一览与趋势感知</p>
      </div>
      <el-button type="primary" round :loading="totalsLoading || bootstrapLoading" @click="refreshAll">
        刷新数据
      </el-button>
    </div>

    <div class="kpi-grid">
      <div v-for="item in kpiList" :key="item.key" class="kpi-card">
        <div class="kpi-icon-wrap">
          <el-icon class="kpi-icon" :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value">{{ formatNum(totals[item.key]) }}</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <el-card class="chart-panel" shadow="never">
        <template #header>
          <span class="panel-title">近 7 日活跃趋势</span>
          <span class="panel-hint">示意曲线 · 与用户数规模联动</span>
        </template>
        <div ref="lineRef" class="chart-box" />
      </el-card>
      <el-card class="chart-panel" shadow="never">
        <template #header>
          <span class="panel-title">模块规模</span>
          <span class="panel-hint">来自管理端分页 total</span>
        </template>
        <div ref="barRef" class="chart-box" />
      </el-card>
      <el-card class="chart-panel chart-panel--wide" shadow="never">
        <template #header>
          <span class="panel-title">核心结构占比</span>
          <span class="panel-hint">用户 / 角色 / 文章 / 评论</span>
        </template>
        <div ref="pieRef" class="chart-box chart-box--pie" />
      </el-card>
    </div>

    <el-card class="bootstrap-panel" shadow="never">
      <template #header>
        <div class="bootstrap-head">
          <span class="panel-title">Bootstrap 配置</span>
          <el-button type="primary" link :loading="bootstrapLoading" @click="loadBootstrap">刷新</el-button>
        </div>
      </template>
      <p class="desc">
        公开接口 <code>GET /api/app/bootstrap</code>；限流阈值见 App 配置中的
        <code>rateLimit.*</code> 键。
      </p>
      <el-alert v-if="bootstrapError && !bootstrap" type="warning" :title="bootstrapError" show-icon class="mb" />
      <el-skeleton v-if="bootstrapLoading && !bootstrap" :rows="4" animated />
      <el-descriptions v-else-if="bootstrap" title="当前键值" :column="1" border size="small">
        <el-descriptions-item v-for="(v, k) in bootstrap" :key="k" :label="k">
          {{ v }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.dash {
  max-width: 1400px;
  margin: 0 auto;
}

.dash-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.dash-title {
  margin: 0 0 6px;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(110deg, #86198f 0%, #c026d3 35%, #db2777 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dash-sub {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px;
  border-radius: var(--admin-radius-md);
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow-card);
  border: 1px solid rgba(168, 85, 247, 0.09);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(109, 40, 217, 0.12);
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--admin-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(192, 38, 211, 0.15), rgba(236, 72, 153, 0.12));
  color: #a21caf;
}

.kpi-body {
  min-width: 0;
}

.kpi-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--admin-header-text);
  font-variant-numeric: tabular-nums;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1100px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-panel {
  border-radius: var(--admin-radius-lg);
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow-card);
  border: 1px solid rgba(168, 85, 247, 0.08);
}

.chart-panel--wide {
  grid-column: 1 / -1;
}

.chart-panel :deep(.el-card__header) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  border-bottom: 1px solid rgba(168, 85, 247, 0.08);
}

.panel-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--admin-header-text);
}

.panel-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chart-box {
  width: 100%;
  height: 300px;
}

.chart-box--pie {
  height: 340px;
}

.bootstrap-panel {
  border-radius: var(--admin-radius-lg);
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow-card);
  border: 1px solid rgba(168, 85, 247, 0.08);
}

.bootstrap-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.desc {
  color: var(--el-text-color-secondary);
  margin: 0 0 16px;
  line-height: 1.6;
  font-size: 13px;
}

.mb {
  margin-bottom: 16px;
}
</style>
