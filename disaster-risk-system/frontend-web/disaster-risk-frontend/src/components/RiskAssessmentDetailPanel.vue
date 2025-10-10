<template>
  <div class="assessment-detail">
    <!-- 影响因素权重图：条形图 -->
    <div v-if="contributing && Object.keys(contributing).length" class="detail-section">
      <h4>影响因素</h4>
      <div ref="contribChartRef" class="chart"></div>
      <el-descriptions :column="2" border size="small" class="mt-12">
        <el-descriptions-item v-for="(val, key) in contributing" :key="String(key)" :label="formatLabel(String(key))">
          {{ formatValue(val) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 天气条件：概要表格 -->
    <div v-if="weather && Object.keys(weather).length" class="detail-section">
      <h4>天气条件</h4>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item v-for="(val, key) in weather" :key="String(key)" :label="formatLabel(String(key))">
          {{ formatValue(val) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 历史对比：时间线 -->
    <div v-if="history" class="detail-section">
      <h4>历史对比</h4>
      <template v-if="Array.isArray(history)">
        <el-timeline>
          <el-timeline-item v-for="(item, idx) in history" :key="idx" :timestamp="formatHistoryTime(item)" placement="top">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item v-for="(val, key) in item" :key="String(key)" :label="formatLabel(String(key))">
                {{ formatValue(val) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-timeline-item>
        </el-timeline>
      </template>
      <template v-else>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item v-for="(val, key) in (history as any)" :key="String(key)" :label="formatLabel(String(key))">
            {{ formatValue(val) }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, markRaw, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

/**
 * 风险评估详情可视化面板
 * - contributing_factors: 使用ECharts条形图展示各因素权重
 * - weather_conditions: 使用Descriptions展示概要
 * - historical_comparison: 时间线或Descriptions
 */

const props = defineProps<{ 
  contributing?: Record<string, any> | null,
  weather?: Record<string, any> | null,
  history?: any[] | Record<string, any> | null
}>()

const contribChartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

/** 格式化字段名为标签 */
function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** 将任意值转为可读字符串 */
function formatValue(val: any): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'object') {
    try { return JSON.stringify(val) } catch { return '[Object]' }
  }
  return String(val)
}

/** 格式化历史项时间戳字段 */
function formatHistoryTime(item: any): string {
  const keys = ['time', 'timestamp', 'date', 'assessment_time']
  for (const k of keys) {
    if (item && item[k]) {
      const d = new Date(item[k])
      return isNaN(d.getTime()) ? String(item[k]) : d.toLocaleString()
    }
  }
  return ''
}

function buildContribSeries(data: Record<string, any>) {
  const entries = Object.entries(data)
    .filter(([_, v]) => typeof v === 'number')
    .sort((a, b) => b[1] - a[1])
  const names = entries.map(([k]) => formatLabel(k))
  const values = entries.map(([_, v]) => Number(v))
  return { names, values }
}

function renderContribChart() {
  if (!contribChartRef.value) return
  if (!chart) chart = markRaw(echarts.init(contribChartRef.value))
  const { names, values } = buildContribSeries(props.contributing || {})
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 12, top: 20, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names },
    series: [{ type: 'bar', data: values, itemStyle: { color: '#409eff' } }]
  })
  chart.resize()
}

onMounted(() => {
  if (props.contributing && Object.keys(props.contributing).length) {
    renderContribChart()
  }
})

watch(() => props.contributing, () => {
  if (!chart && contribChartRef.value) renderContribChart()
  else if (chart) renderContribChart()
}, { deep: true })

onBeforeUnmount(() => {
  if (chart && !chart.isDisposed()) {
    chart.dispose()
  }
  chart = null
})
</script>

<style scoped>
.assessment-detail { padding: 12px 0; }
.detail-section { margin-top: 16px; }
.chart { width: 100%; height: 240px; margin-top: 8px; }
.mt-12 { margin-top: 12px; }
</style>