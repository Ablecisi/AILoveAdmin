<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import * as echarts from 'echarts'
import { fetchBootstrap } from '@/api/bootstrap'
import { fetchDashboardOverview } from '@/api/adminDashboard'
import { useThemeStore } from '@/stores/theme'
import { ElMessage } from 'element-plus'

const themeStore = useThemeStore()
const { colors } = storeToRefs(themeStore)

const TOTAL_LABELS = {
  users: '注册用户',
  characters: 'AI 角色',
  articles: '文章',
  comments: '评论',
  conversations: '会话',
  messages: '消息',
  posts: '帖子',
  types: '类型字典',
  prompts: 'Prompt 模板',
  userProfiles: '用户画像',
  emotionLogs: '情绪日志',
  followRelations: '关注关系',
  articleLikes: '文章点赞',
  articleCollects: '文章收藏',
  postLikes: '帖子点赞',
  commentLikes: '评论点赞',
}

const bootstrapLoading = ref(false)
const bootstrap = ref(null)
const bootstrapError = ref('')

const overviewLoading = ref(false)
const overview = ref({
  totals: {},
  dauSeries: [],
  dauToday: 0,
  interestGraph: { nodes: [], links: [] },
})

const lineRef = shallowRef(null)
const barRef = shallowRef(null)
const pieRef = shallowRef(null)
const radarRef = shallowRef(null)
const graphRef = shallowRef(null)
const funnelRef = shallowRef(null)

/** @type {echarts.EChartsType[]} */
let chartInstances = []

function ok(data) {
  return data?.code === 1
}

function hexToRgb(hex) {
  let h = (hex || '').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return { r: 192, g: 38, b: 211 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r, g, b) {
  const c = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function mixHex(a, b, t) {
  const A = hexToRgb(a)
  const B = typeof b === 'string' ? hexToRgb(b) : b
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t)
}

function chartPalette() {
  const p = colors.value.primary
  const a = colors.value.accent
  return [
    p,
    a,
    mixHex(p, '#ffffff', 0.42),
    mixHex(a, '#ffffff', 0.38),
    mixHex(p, a, 0.45),
    mixHex(p, '#e8e0f5', 0.35),
    mixHex(a, '#fde8f3', 0.4),
    mixHex(p, '#cbd5e1', 0.25),
  ]
}

function splitLineStyle() {
  return {
    type: 'dashed',
    color: mixHex(colors.value.primary, '#e5e7eb', 0.55),
    opacity: 0.45,
  }
}

const sortedTotalEntries = computed(() => {
  const t = overview.value.totals || {}
  return Object.keys(t)
    .map((k) => ({ key: k, label: TOTAL_LABELS[k] || k, value: Number(t[k]) || 0 }))
    .sort((a, b) => b.value - a.value)
})

const barChartHeight = computed(() => {
  const n = sortedTotalEntries.value.length || 1
  return Math.min(620, 100 + n * 28)
})

const kpiItems = computed(() => {
  const items = [
    {
      key: 'dauToday',
      label: '今日活跃（DAU）',
      hint: '当日至少打开过一次 App 的用户数',
      value: overview.value.dauToday ?? 0,
    },
  ]
  const order = [
    'users',
    'characters',
    'articles',
    'posts',
    'comments',
    'conversations',
    'messages',
    'types',
    'prompts',
    'userProfiles',
    'emotionLogs',
    'followRelations',
    'articleLikes',
    'articleCollects',
    'postLikes',
    'commentLikes',
  ]
  const t = overview.value.totals || {}
  for (const key of order) {
    if (t[key] == null) continue
    items.push({
      key,
      label: TOTAL_LABELS[key] || key,
      hint: '库表记录规模',
      value: Number(t[key]) || 0,
    })
  }
  return items
})

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

async function loadOverview() {
  overviewLoading.value = true
  try {
    overview.value = await fetchDashboardOverview()
  } catch (e) {
    ElMessage.error(e?.message || '驾驶舱数据加载失败')
  } finally {
    overviewLoading.value = false
  }
}

function buildLineOption() {
  const series = overview.value.dauSeries || []
  const days = series.map((d) => d.date?.slice(5) || d.date)
  const vals = series.map((d) => Number(d.count) || 0)
  const p = colors.value.primary
  const top = mixHex(p, '#ffffff', 0.75)
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days,
      axisLine: { lineStyle: { color: mixHex(p, '#e9d5ff', 0.4) } },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: splitLineStyle() },
    },
    series: [
      {
        name: 'DAU',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: p },
        itemStyle: { color: p },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${top}55` },
            { offset: 1, color: `${mixHex(p, '#ffffff', 0.95)}08` },
          ]),
        },
        data: vals,
      },
    ],
  }
}

function buildBarOption() {
  const entries = sortedTotalEntries.value
  const names = entries.map((e) => e.label)
  const vals = entries.map((e) => e.value)
  const p = colors.value.primary
  const a = colors.value.accent
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '6%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: splitLineStyle() } },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, width: 108, overflow: 'truncate' },
    },
    dataZoom:
      names.length > 12
        ? [{ type: 'slider', yAxisIndex: 0, width: 14, right: 4, startValue: names.length - 12, endValue: names.length - 1 }]
        : undefined,
    series: [
      {
        name: '数量',
        type: 'bar',
        barMaxWidth: 22,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: a },
            { offset: 1, color: p },
          ]),
        },
        data: vals,
      },
    ],
  }
}

function buildPieOption() {
  const entries = sortedTotalEntries.value.slice(0, 10)
  const pieData = entries.map((e) => ({ name: e.label, value: e.value })).filter((d) => d.value > 0)
  if (!pieData.length) pieData.push({ name: '暂无', value: 1 })
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: { trigger: 'item' },
    legend: { bottom: 4, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [
      {
        name: '占比',
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 7, borderColor: '#fff', borderWidth: 2 },
        label: { fontSize: 11 },
        data: pieData,
      },
    ],
  }
}

function buildRadarOption() {
  const t = overview.value.totals || {}
  const keys = ['users', 'articles', 'comments', 'conversations', 'messages', 'characters']
  const labels = keys.map((k) => TOTAL_LABELS[k] || k)
  const vals = keys.map((k) => Number(t[k]) || 0)
  const maxV = Math.max(...vals, 1)
  const indicators = labels.map((name, i) => ({ name, max: Math.ceil(maxV * 1.15) || 1 }))
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: {},
    radar: {
      center: ['50%', '52%'],
      radius: '62%',
      indicator: indicators,
      splitLine: { lineStyle: splitLineStyle() },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.06)'] } },
      axisName: { fontSize: 11 },
    },
    series: [
      {
        type: 'radar',
        areaStyle: { opacity: 0.22 },
        lineStyle: { width: 2, color: colors.value.primary },
        itemStyle: { color: colors.value.accent },
        data: [{ value: vals, name: '规模' }],
      },
    ],
  }
}

function buildGraphOption() {
  const g = overview.value.interestGraph || { nodes: [], links: [] }
  if (!(g.nodes && g.nodes.length)) {
    return {
      title: {
        text: '暂无画像兴趣数据',
        left: 'center',
        top: 'middle',
        textStyle: { color: mixHex(colors.value.primary, '#9ca3af', 0.5), fontSize: 14, fontWeight: 400 },
      },
    }
  }
  const nodes = (g.nodes || []).map((n) => ({
    id: n.id,
    name: n.name,
    value: n.value,
    symbolSize: 10 + Math.min(36, (Number(n.value) || 0) * 3),
    category: 0,
  }))
  const links = (g.links || []).map((l) => ({
    source: l.source,
    target: l.target,
    value: l.value,
    lineStyle: { width: 0.5 + Math.min(5, Number(l.value) || 0), curveness: 0.12 },
  }))
  const p = colors.value.primary
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: nodes,
        links,
        categories: [{ name: '兴趣标签' }],
        label: { show: true, fontSize: 10, color: mixHex(p, '#374151', 0.4) },
        lineStyle: { color: 'source', opacity: 0.65 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        force: {
          repulsion: 220,
          edgeLength: [48, 140],
          gravity: 0.08,
        },
      },
    ],
  }
}

function buildFunnelOption() {
  const t = overview.value.totals || {}
  const stages = [
    { name: '注册用户', value: Number(t.users) || 0 },
    { name: '用户画像', value: Number(t.userProfiles) || 0 },
    { name: '会话', value: Number(t.conversations) || 0 },
    { name: '消息', value: Number(t.messages) || 0 },
  ]
  return {
    color: chartPalette(),
    textStyle: { color: mixHex(colors.value.headerText || '#1e1b2e', '#6b7280', 0.35) },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '漏斗',
        type: 'funnel',
        left: '8%',
        top: 16,
        bottom: 8,
        width: '84%',
        min: 0,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: { show: true, position: 'inside', fontSize: 11 },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        data: stages,
      },
    ],
  }
}

function disposeCharts() {
  chartInstances.forEach((c) => c.dispose())
  chartInstances = []
}

function resizeCharts() {
  chartInstances.forEach((c) => c.resize())
}

function mountChart(el, builder) {
  if (!el) return
  const c = echarts.init(el)
  c.setOption(builder())
  chartInstances.push(c)
}

function initCharts() {
  disposeCharts()
  nextTick(() => {
    mountChart(lineRef.value, buildLineOption)
    mountChart(barRef.value, buildBarOption)
    mountChart(pieRef.value, buildPieOption)
    mountChart(radarRef.value, buildRadarOption)
    mountChart(graphRef.value, buildGraphOption)
    mountChart(funnelRef.value, buildFunnelOption)
    resizeCharts()
  })
}

function updateChartOptions() {
  const builders = [
    buildLineOption,
    buildBarOption,
    buildPieOption,
    buildRadarOption,
    buildGraphOption,
    buildFunnelOption,
  ]
  chartInstances.forEach((c, i) => {
    if (builders[i]) c.setOption(builders[i](), true)
  })
}

watch(
  () => overview.value,
  () => {
    if (chartInstances.length) updateChartOptions()
  },
  { deep: true },
)

watch(
  colors,
  () => {
    themeStore.applyDocumentVars()
    if (chartInstances.length) updateChartOptions()
  },
  { deep: true },
)

onMounted(async () => {
  themeStore.applyDocumentVars()
  await Promise.all([loadBootstrap(), loadOverview()])
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

async function refreshAll() {
  await Promise.all([loadBootstrap(), loadOverview()])
  ElMessage.success('已刷新')
  initCharts()
}
</script>

<template>
  <div class="dash">
    <header class="dash-hero">
      <div class="dash-hero-text">
        <h1 class="dash-title">运营驾驶舱</h1>
        <p class="dash-lead">AI恋恋 · 全量业务指标与 DAU 趋势</p>
      </div>
      <el-button type="primary" round :loading="overviewLoading || bootstrapLoading" @click="refreshAll">
        刷新数据
      </el-button>
    </header>

    <section class="kpi-strip" aria-label="关键指标">
      <div v-for="item in kpiItems" :key="item.key" class="kpi-tile">
        <div class="kpi-tile-label">{{ item.label }}</div>
        <div class="kpi-tile-value">{{ formatNum(item.value) }}</div>
        <div class="kpi-tile-hint">{{ item.hint }}</div>
      </div>
    </section>

    <section class="charts" aria-label="图表">
      <el-card class="panel panel--hero" shadow="never">
        <template #header>
          <div class="panel-head">
            <span class="panel-title">近 14 日每日活跃用户（DAU）</span>
            <span class="panel-sub">基于 user_active_day · 时区 Asia/Shanghai</span>
          </div>
        </template>
        <div ref="lineRef" class="chart chart--line" />
      </el-card>

      <el-card class="panel" shadow="never">
        <template #header>
          <div class="panel-head">
            <span class="panel-title">业务规模一览</span>
            <span class="panel-sub">横向条形图 · 全表统计</span>
          </div>
        </template>
        <div ref="barRef" class="chart chart--bar" :style="{ height: `${barChartHeight}px` }" />
      </el-card>

      <div class="charts-duo">
        <el-card class="panel" shadow="never">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">结构占比（Top 10）</span>
              <span class="panel-sub">按记录数</span>
            </div>
          </template>
          <div ref="pieRef" class="chart chart--pie" />
        </el-card>
        <el-card class="panel" shadow="never">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">核心六维雷达</span>
              <span class="panel-sub">用户 / 内容 / 互动</span>
            </div>
          </template>
          <div ref="radarRef" class="chart chart--radar" />
        </el-card>
      </div>

      <div class="charts-duo charts-duo--funnel">
        <el-card class="panel" shadow="never">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">用户旅程漏斗</span>
              <span class="panel-sub">注册 → 画像 → 会话 → 消息（规模示意）</span>
            </div>
          </template>
          <div ref="funnelRef" class="chart chart--funnel" />
        </el-card>
        <el-card class="panel panel--graph" shadow="never">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">用户兴趣共现关系</span>
              <span class="panel-sub">画像 interests 共现 · 可拖拽缩放（Graph）</span>
            </div>
          </template>
          <div ref="graphRef" class="chart chart--graph" />
        </el-card>
      </div>
    </section>

    <el-card class="panel panel--boot" shadow="never">
      <template #header>
        <div class="panel-head panel-head--row">
          <span class="panel-title">客户端 Bootstrap</span>
          <el-button type="primary" link :loading="bootstrapLoading" @click="loadBootstrap">刷新</el-button>
        </div>
      </template>
      <p class="boot-desc">
        公开接口 <code>GET /api/app/bootstrap</code>；限流见 App 配置中的 <code>rateLimit.*</code>。
        C 端日活请调用 <code>POST /api/user/activity/ping</code>（需登录，建议 App 冷启动调用）。
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
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 48px;
}

.dash-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.dash-title {
  margin: 0 0 8px;
  font-size: clamp(1.75rem, 2.5vw, 2rem);
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.15;
  background: linear-gradient(
    115deg,
    var(--el-color-primary, #c026d3) 0%,
    var(--admin-accent, #f472b6) 55%,
    var(--el-color-primary, #c026d3) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dash-lead {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
  letter-spacing: 0.01em;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.kpi-tile {
  padding: 16px 16px 14px;
  border-radius: var(--admin-radius-md, 14px);
  background: var(--admin-card-bg, #fff);
  box-shadow: var(--admin-shadow-card);
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #c026d3) 10%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--admin-shadow-layout);
}

.kpi-tile-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  line-height: 1.35;
}

.kpi-tile-value {
  font-size: 1.4rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: var(--admin-header-text);
}

.kpi-tile-hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  line-height: 1.35;
}

.charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.charts-duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .charts-duo {
    grid-template-columns: 1fr;
  }
}

.panel {
  border-radius: var(--admin-radius-lg, 20px);
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow-card);
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #c026d3) 8%, transparent);
  overflow: hidden;
}

.panel--hero {
  /* subtle emphasis */
  border-color: color-mix(in srgb, var(--admin-accent, #f472b6) 14%, transparent);
}

.panel :deep(.el-card__header) {
  padding: 16px 18px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary, #c026d3) 7%, transparent);
}

.panel-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.panel-head--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.panel-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--admin-header-text);
  letter-spacing: 0.01em;
}

.panel-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chart {
  width: 100%;
}

.chart--line {
  height: 300px;
}

.chart--pie,
.chart--radar {
  height: 340px;
}

.chart--funnel {
  height: 320px;
}

.chart--graph {
  height: 400px;
}

.panel--boot {
  border-radius: var(--admin-radius-lg, 20px);
}

.boot-desc {
  color: var(--el-text-color-secondary);
  margin: 0 0 16px;
  line-height: 1.65;
  font-size: 13px;
}

.mb {
  margin-bottom: 16px;
}
</style>
