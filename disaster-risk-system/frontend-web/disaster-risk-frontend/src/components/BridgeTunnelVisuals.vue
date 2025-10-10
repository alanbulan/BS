<template>
  <div class="bridge-tunnel-visuals-wrapper">
    <div class="visuals-grid">
      <!-- 桥梁隧道类型分布饼图 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>桥梁隧道类型分布</h4>
        </div>
        <div ref="typeDistributionChart" class="chart-container"></div>
      </div>

      <!-- 桥梁隧道数量统计柱状图 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>数量统计</h4>
        </div>
        <div ref="countStatsChart" class="chart-container"></div>
      </div>

      <!-- 长度分布分析 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>长度分布分析</h4>
        </div>
        <div ref="lengthDistributionChart" class="chart-container"></div>
      </div>

      <!-- 承重能力分析 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>承重能力分析</h4>
        </div>
        <div ref="weightLimitChart" class="chart-container"></div>
      </div>

      <!-- 建设年代分布 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>建设年代分布</h4>
        </div>
        <div ref="buildYearChart" class="chart-container"></div>
      </div>

      <!-- 材质分布分析 -->
      <div class="visual-card">
        <div class="card-header">
          <h4>材质分布分析</h4>
        </div>
        <div ref="materialChart" class="chart-container"></div>
      </div>
    </div>

    <!-- 错误提示覆盖层 -->
    <div v-if="error" class="error-overlay">
      <div class="error-message">
        <el-icon><Warning /></el-icon>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { Warning } from '@element-plus/icons-vue'

/**
 * 桥梁隧道信息可视化组件
 * 用于展示道路网络中的桥梁隧道统计信息和分析
 */

interface BridgeTunnelItem {
  type?: string // bridge | tunnel
  name?: string
  length?: number
  height?: number
  weight_limit?: number
  built_year?: number
  location?: {
    type: string
    coordinates: number[]
  }
  [key: string]: any
}

interface Props {
  bridgeTunnelData?: BridgeTunnelItem[] | any
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px'
})

// 响应式数据
const typeDistributionChart = ref<HTMLElement>()
const countStatsChart = ref<HTMLElement>()
const lengthDistributionChart = ref<HTMLElement>()
const weightLimitChart = ref<HTMLElement>()
const buildYearChart = ref<HTMLElement>()
const materialChart = ref<HTMLElement>()
const error = ref<string>('')

let charts: ECharts[] = []
let resizeObserver: ResizeObserver | null = null

/**
 * 解析桥梁隧道原始数据，统一为条目数组，并提取可选的类型数量覆盖值
 * 支持三种输入格式：
 * 1) 数组：[{ type: 'bridge'|'tunnel', length, weight_limit, ... }]
 * 2) 字符串：上述数组或对象的 JSON 字符串
 * 3) 聚合对象：{ bridges, tunnels, bridge_info: [], tunnel_info: [] }
 *
 * @param data 任意原始桥隧数据
 * @returns { items, typeCountOverride? }
 */
const parseBridgeTunnelPayload = (data: any): {
  items: BridgeTunnelItem[]
  typeCountOverride?: { bridge: number; tunnel: number }
} => {
  if (!data) return { items: [] }

  // 若是字符串，尝试解析后再处理
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return parseBridgeTunnelPayload(parsed)
    } catch (e) {
      console.error('桥梁隧道数据解析失败:', e)
      return { items: [] }
    }
  }

  // 若本身是数组，直接返回
  if (Array.isArray(data)) {
    const items = data as BridgeTunnelItem[]
    const typeCount = {
      bridge: items.filter(i => i.type === 'bridge').length,
      tunnel: items.filter(i => i.type === 'tunnel').length
    }
    return { items, typeCountOverride: typeCount }
  }

  // 若是聚合对象，尝试从 bridge_info / tunnel_info 生成条目
  if (typeof data === 'object') {
    const items: BridgeTunnelItem[] = []

    const bridgeList = Array.isArray(data.bridge_info) ? data.bridge_info : []
    const tunnelList = Array.isArray(data.tunnel_info) ? data.tunnel_info : []

    // 将桥梁信息映射为统一条目
    for (const b of bridgeList) {
      items.push({
        type: 'bridge',
        name: b.name ?? b.bridge_name ?? undefined,
        length: Number(b.length ?? b.len ?? 0) || undefined,
        height: b.height ? Number(b.height) : undefined,
        weight_limit: b.weight_limit ? Number(b.weight_limit) : (b.weightLimit ? Number(b.weightLimit) : undefined),
        built_year: b.built_year ? Number(b.built_year) : undefined,
        ...b
      })
    }

    // 将隧道信息映射为统一条目
    for (const t of tunnelList) {
      items.push({
        type: 'tunnel',
        name: t.name ?? t.tunnel_name ?? undefined,
        length: Number(t.length ?? t.len ?? 0) || undefined,
        height: t.height ? Number(t.height) : undefined,
        weight_limit: t.weight_limit ? Number(t.weight_limit) : (t.weightLimit ? Number(t.weightLimit) : undefined),
        built_year: t.built_year ? Number(t.built_year) : undefined,
        ...t
      })
    }

    // 类型数量优先采用聚合字段 bridges / tunnels
    const typeCountOverride = (typeof data.bridges === 'number' || typeof data.tunnels === 'number')
      ? {
          bridge: typeof data.bridges === 'number' ? data.bridges : items.filter(i => i.type === 'bridge').length,
          tunnel: typeof data.tunnels === 'number' ? data.tunnels : items.filter(i => i.type === 'tunnel').length
        }
      : undefined

    return { items, typeCountOverride }
  }

  return { items: [] }
}

/**
 * 统计分析函数：
 * - 类型数量可由外部覆盖（当存在 bridges/tunnels 聚合字段时使用）
 * - 长度、承载能力、建设年代、材质分布仅基于具备详细信息的条目计算
 * @param data 统一条目数组
 * @param typeCountOverride 可选的类型统计覆盖
 */
const analyzeData = (data: BridgeTunnelItem[], typeCountOverride?: { bridge: number; tunnel: number }) => {
  const derivedTypeCount = {
    bridge: data.filter(i => i.type === 'bridge').length,
    tunnel: data.filter(i => i.type === 'tunnel').length
  }

  const analysis = {
    typeCount: typeCountOverride ?? derivedTypeCount,
    lengthRanges: { short: 0, medium: 0, long: 0 }, // <100m, 100-500m, >500m
    weightLimits: { light: 0, medium: 0, heavy: 0 }, // <20t, 20-50t, >50t
    buildYears: {} as Record<string, number>, // 按年代分组
    materials: {} as Record<string, number>, // 按材质分组
    totalCount: (typeCountOverride ? (typeCountOverride.bridge + typeCountOverride.tunnel) : data.length)
  }

  data.forEach(item => {
    // 长度分析
    const length = Number(item.length ?? 0)
    if (!isNaN(length) && length > 0) {
      if (length < 100) {
        analysis.lengthRanges.short++
      } else if (length <= 500) {
        analysis.lengthRanges.medium++
      } else {
        analysis.lengthRanges.long++
      }
    }

    // 承重分析
    const weightLimit = Number(item.weight_limit ?? 0)
    if (!isNaN(weightLimit) && weightLimit > 0) {
      if (weightLimit < 20) {
        analysis.weightLimits.light++
      } else if (weightLimit <= 50) {
        analysis.weightLimits.medium++
      } else {
        analysis.weightLimits.heavy++
      }
    }

    // 建设年代分析
    const builtYear = Number(item.built_year ?? item.year_built ?? item.year ?? 0)
    if (!isNaN(builtYear) && builtYear > 1900 && builtYear <= new Date().getFullYear()) {
      const decade = Math.floor(builtYear / 10) * 10 // 按十年分组
      const decadeKey = `${decade}年代`
      analysis.buildYears[decadeKey] = (analysis.buildYears[decadeKey] || 0) + 1
    }

    // 材质分析
    const material = item.material || item.material_type || ''
    if (material && typeof material === 'string') {
      const materialKey = material.replace(/_/g, ' ').toLowerCase()
      const materialDisplay = materialKey === 'steel_concrete' ? '钢混结构' :
                             materialKey === 'prestressed_concrete' ? '预应力混凝土' :
                             materialKey === 'concrete' ? '混凝土' :
                             materialKey === 'steel' ? '钢结构' :
                             materialKey === 'stone' ? '石材' : materialKey
      analysis.materials[materialDisplay] = (analysis.materials[materialDisplay] || 0) + 1
    }
  })

  return analysis
}

/**
 * 初始化类型分布饼图
 */
const initTypeDistributionChart = (analysis: any) => {
  if (!typeDistributionChart.value) return null

  const chart = echarts.init(typeDistributionChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '类型分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: [
          { value: analysis.typeCount.bridge, name: '桥梁', itemStyle: { color: '#1890ff' } },
          { value: analysis.typeCount.tunnel, name: '隧道', itemStyle: { color: '#fa8c16' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化数量统计柱状图
 */
const initCountStatsChart = (analysis: any) => {
  if (!countStatsChart.value) return null

  const chart = echarts.init(countStatsChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['桥梁', '隧道', '总计'],
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [
          { value: analysis.typeCount.bridge, itemStyle: { color: '#1890ff' } },
          { value: analysis.typeCount.tunnel, itemStyle: { color: '#fa8c16' } },
          { value: analysis.totalCount, itemStyle: { color: '#52c41a' } }
        ],
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化长度分布图
 */
const initLengthDistributionChart = (analysis: any) => {
  if (!lengthDistributionChart.value) return null

  const chart = echarts.init(lengthDistributionChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}个'
    },
    series: [
      {
        name: '长度分布',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: [
          { value: analysis.lengthRanges.short, name: '短距离(<100m)', itemStyle: { color: '#52c41a' } },
          { value: analysis.lengthRanges.medium, name: '中距离(100-500m)', itemStyle: { color: '#faad14' } },
          { value: analysis.lengthRanges.long, name: '长距离(>500m)', itemStyle: { color: '#f5222d' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化承重能力图
 */
const initWeightLimitChart = (analysis: any) => {
  if (!weightLimitChart.value) return null

  const chart = echarts.init(weightLimitChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['轻载(<20t)', '中载(20-50t)', '重载(>50t)'],
      axisLabel: {
        fontSize: 11,
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [
      {
        name: '承重能力',
        type: 'bar',
        data: [
          { value: analysis.weightLimits.light, itemStyle: { color: '#52c41a' } },
          { value: analysis.weightLimits.medium, itemStyle: { color: '#faad14' } },
          { value: analysis.weightLimits.heavy, itemStyle: { color: '#f5222d' } }
        ],
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化建设年代分布图
 */
const initBuildYearChart = (analysis: any) => {
  if (!buildYearChart.value) return null

  const chart = echarts.init(buildYearChart.value)
  
  const yearData = Object.entries(analysis.buildYears).sort(([a], [b]) => a.localeCompare(b))
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: yearData.map(([year]) => year),
      axisLabel: {
        fontSize: 11,
        color: '#666',
        rotate: yearData.length > 6 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [
      {
        name: '建设数量',
        type: 'bar',
        data: yearData.map(([, count], index) => ({
          value: count,
          itemStyle: {
            color: `hsl(${210 + index * 30}, 65%, 55%)`
          }
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化材质分布图
 */
const initMaterialChart = (analysis: any) => {
  if (!materialChart.value) return null

  const chart = echarts.init(materialChart.value)
  
  const materialData = Object.entries(analysis.materials)
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16', '#13c2c2']
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '材质分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '50%'],
        data: materialData.map(([material, count], index) => ({
          value: count,
          name: material,
          itemStyle: { color: colors[index % colors.length] }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个'
        }
      }
    ]
  }

  chart.setOption(option)
  return chart
}

/**
 * 初始化所有图表
 */
const initializeCharts = async () => {
  await nextTick()
  
  try {
    const { items, typeCountOverride } = parseBridgeTunnelPayload(props.bridgeTunnelData)
    
    if ((items.length === 0) && (!typeCountOverride || (typeCountOverride.bridge + typeCountOverride.tunnel === 0))) {
      error.value = '暂无桥梁隧道数据'
      return
    }

    const analysis = analyzeData(items, typeCountOverride)
    
    // 清除现有图表
    charts.forEach(chart => {
      if (chart && !chart.isDisposed()) chart.dispose()
    })
    charts = []

    // 初始化各个图表
    const chart1 = initTypeDistributionChart(analysis)
    const chart2 = initCountStatsChart(analysis)
    const chart3 = initLengthDistributionChart(analysis)
    const chart4 = initWeightLimitChart(analysis)
    const chart5 = initBuildYearChart(analysis)
    const chart6 = initMaterialChart(analysis)

    charts = [chart1, chart2, chart3, chart4, chart5, chart6].filter(Boolean) as ECharts[]

    // 设置resize监听
    setupResizeObserver()
    
    error.value = ''
  } catch (err) {
    console.error('图表初始化失败:', err)
    error.value = '图表初始化失败'
  }
}

/**
 * 设置resize观察器
 */
const setupResizeObserver = () => {
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      charts.forEach(chart => {
        if (chart) {
          setTimeout(() => {
            chart.resize()
          }, 100)
        }
      })
    })

    const containers = [
      typeDistributionChart.value,
      countStatsChart.value,
      lengthDistributionChart.value,
      weightLimitChart.value,
      buildYearChart.value,
      materialChart.value
    ]

    containers.forEach(container => {
      if (container) {
        resizeObserver?.observe(container)
      }
    })
  }
}

// 监听数据变化
watch(() => props.bridgeTunnelData, () => {
  initializeCharts()
}, { deep: true })

// 组件挂载
onMounted(() => {
  initializeCharts()
})

// 组件卸载
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  charts.forEach(chart => {
    if (chart && !chart.isDisposed()) chart.dispose()
  })
  charts = []
})
</script>

<style scoped>
.bridge-tunnel-visuals-wrapper {
  position: relative;
  width: 100%;
  padding: 16px;
}

.visuals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.visual-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-container {
  width: 100%;
  height: 280px;
  padding: 16px;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-message {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #f5222d;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .visuals-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 240px;
  }
}
</style>