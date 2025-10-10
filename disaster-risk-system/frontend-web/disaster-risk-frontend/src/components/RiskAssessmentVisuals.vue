<template>
  <div class="risk-visuals">
    <!-- ML模型评估概览 -->
    <div v-if="contributingData" class="visual-section overview-section">
      <h4>🤖 ML智能评估概览</h4>
      <div class="overview-grid">
        <div class="overview-card risk-score">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-label">风险分数</div>
            <div class="card-value">{{ formatScore(contributingData.score) }}</div>
            <el-progress :percentage="Math.round((contributingData.score || 0) * 100)" :color="getScoreColor(contributingData.score)" />
          </div>
        </div>
        
        <div v-if="contributingData.weatherData" class="overview-card weather-summary">
          <div class="card-icon">🌦️</div>
          <div class="card-content">
            <div class="card-label">天气条件</div>
            <div class="card-value">{{ contributingData.weatherData.weather_condition || '未知' }}</div>
            <div class="card-sub">{{ contributingData.weatherData.temperature || '-' }}°C | {{ contributingData.weatherData.rainfall_24h ? contributingData.weatherData.rainfall_24h.toFixed(1) : 0 }}mm/24h</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 风险因素可视化 -->
    <div v-if="contributingData && contributingData.factors" class="visual-section">
      <h4>📈 影响因素分析</h4>
      <div class="visual-content">
        <!-- ECharts环形图 -->
        <div ref="factorsChart" class="chart-container"></div>
        
        <!-- 因素详情卡片 -->
        <div class="factors-grid">
          <div 
            v-for="(value, key) in contributingData.factors"
            :key="key"
            class="factor-card"
            :class="getFactorLevel(value)"
          >
            <div class="factor-header">
              <span class="factor-icon">{{ getFactorIcon(String(key)) }}</span>
              <span class="factor-name">{{ formatFactorName(String(key)) }}</span>
            </div>
            <div class="factor-body">
            <div class="factor-value">{{ formatFactorValue(value) }}</div>
              <div v-if="contributingData.weights" class="factor-weight">
                权重: {{ formatWeight(contributingData.weights[key]) }}
          </div>
        </div>
            <div class="factor-progress">
              <el-progress 
                :percentage="normalizeFactorValue(value)" 
                :stroke-width="4" 
                :show-text="false"
                :color="getFactorColor(value)"
              />
      </div>
    </div>
              </div>
                </div>
              </div>
              
    <!-- 权重分布雷达图 -->
    <div v-if="contributingData && contributingData.weights && contributingData.factors" class="visual-section">
      <h4>🎯 风险因素权重分布</h4>
      <div class="radar-content">
        <div ref="radarChart" class="chart-container radar-chart"></div>
      </div>
    </div>


    <!-- 历史对比可视化 -->
    <div v-if="historicalData" class="visual-section">
      <h4>📊 历史对比分析</h4>
      <div class="history-content">
        <div ref="historyChart" class="chart-container history-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

interface Props {
  contributing?: any
  weather?: any
  history?: any
}

const props = withDefaults(defineProps<Props>(), {
  contributing: null,
  weather: null,
  history: null
})

// 图表引用
const factorsChart = ref<HTMLElement>()
const radarChart = ref<HTMLElement>()
const historyChart = ref<HTMLElement>()

// 图表实例
let factorsChartInstance: ECharts | null = null
let radarChartInstance: ECharts | null = null
let historyChartInstance: ECharts | null = null

// 数据处理
const contributingData = computed(() => props.contributing)
const historicalData = computed(() => props.history)

/**
 * 格式化分数显示
 */
const formatScore = (score: number): string => {
  if (score === undefined || score === null) return '0.00'
  return (score * 100).toFixed(1) + ' / 100'
}

/**
 * 获取分数颜色
 */
const getScoreColor = (score: number): string => {
  if (!score) return '#67C23A'
  if (score >= 0.8) return '#F56C6C'
  if (score >= 0.6) return '#E6A23C'
  if (score >= 0.4) return '#409EFF'
  return '#67C23A'
}

/**
 * 格式化因素名称
 */
const formatFactorName = (key: string): string => {
  const nameMap: Record<string, string> = {
    rainfall: '降雨量',
    groundwater: '地下水位',
    slope: '坡度',
    soilMoisture: '土壤湿度',
    seismicActivity: '地震活动',
    populationDensity: '人口密度'
  }
  return nameMap[key] || key
}

/**
 * 获取因素图标
 */
const getFactorIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    rainfall: '🌧️',
    groundwater: '💧',
    slope: '⛰️',
    soilMoisture: '🌾',
    seismicActivity: '🌍',
    populationDensity: '👥'
  }
  return iconMap[key] || '📊'
}

/**
 * 格式化因素数值
 */
const formatFactorValue = (value: any): string => {
  if (value === undefined || value === null) return '0'
  const num = Number(value)
  if (num > 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(1)
}

/**
 * 格式化权重
 */
const formatWeight = (weight: any): string => {
  if (weight === undefined || weight === null) return '0%'
  return (Number(weight) * 100).toFixed(0) + '%'
}

/**
 * 归一化因素数值到百分比
 */
const normalizeFactorValue = (value: any): number => {
  const num = Number(value) || 0
  // 假设最大值为10（可根据实际调整）
  return Math.min(Math.round((num / 10) * 100), 100)
}

/**
 * 获取因素等级样式
 */
const getFactorLevel = (value: any): string => {
  const num = Number(value) || 0
  if (num >= 8) return 'level-critical'
  if (num >= 6) return 'level-high'
  if (num >= 4) return 'level-medium'
  if (num >= 2) return 'level-low'
  return 'level-minimal'
}

/**
 * 获取因素颜色
 */
const getFactorColor = (value: any): string => {
  const num = Number(value) || 0
  if (num >= 8) return '#F56C6C'
  if (num >= 6) return '#E6A23C'
  if (num >= 4) return '#409EFF'
  return '#67C23A'
}

/**
 * 初始化因素环形图
 */
const initFactorsChart = async () => {
  if (!factorsChart.value || !contributingData.value?.factors) return

  await nextTick()
  
  // 优化：如果已存在实例，复用而不是销毁重建
  if (!factorsChartInstance || factorsChartInstance.isDisposed()) {
    factorsChartInstance = echarts.init(factorsChart.value)
  } else {
    factorsChartInstance.clear() // 清空而不是销毁
  }

  const factors = contributingData.value.factors
  const weights = contributingData.value.weights || {}
  
  const data = Object.entries(factors).map(([name, value]) => ({
    name: formatFactorName(name),
    value: Number(value) || 0,
    weight: Number(weights[name]) || 0
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const value = Number(params.value) || 0;
        const weight = Number(params.data?.weight) || 0;
        if (value === 0) {
          return `${params.name}<br/>暂无数据<br/>权重: ${(weight * 100).toFixed(0)}%`
        }
        return `${params.name}<br/>数值: ${value.toFixed(1)}<br/>权重: ${(weight * 100).toFixed(0)}%`
      }
    },
    series: [
      {
        name: '影响因素',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 12,
          lineHeight: 16
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: data
      }
    ],
    color: ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#3BA272']
  }

  factorsChartInstance.setOption(option)
}

/**
 * 初始化雷达图
 */
const initRadarChart = async () => {
  if (!radarChart.value || !contributingData.value?.factors || !contributingData.value?.weights) return

  await nextTick()
  
  // 优化：复用实例而不是销毁重建
  if (!radarChartInstance || radarChartInstance.isDisposed()) {
    radarChartInstance = echarts.init(radarChart.value)
  } else {
    radarChartInstance.clear()
  }

  const factors = contributingData.value.factors
  const weights = contributingData.value.weights
  
  console.log('[雷达图] factors数据:', factors)
  console.log('[雷达图] weights数据:', weights)

  // 确保顺序一致
  const factorKeys = Object.keys(factors)
  
  // 动态设置最大值（人口密度可能超过10）
  const indicator = factorKeys.map(key => {
    const value = Number(factors[key]) || 0
    let maxValue = 10
    
    // 人口密度特殊处理
    if (key === 'populationDensity') {
      maxValue = Math.max(500, value * 1.2) // 至少500，或值的1.2倍
    }
    
    return {
      name: formatFactorName(key),
      min: 0,
      max: maxValue
    }
  })

  const weightData = factorKeys.map(key => {
    const weight = weights[key] || 0
    const maxValue = indicator[factorKeys.indexOf(key)].max
    return weight * maxValue  // 根据最大值缩放
  })
  
  const factorData = factorKeys.map(key => Number(factors[key]) || 0)
  
  console.log('[雷达图] factorData:', factorData)
  console.log('[雷达图] weightData:', weightData)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const dataIndex = params.dataIndex
        const value = params.value[dataIndex]
        const key = factorKeys[dataIndex]
        const maxValue = indicator[dataIndex].max
        
        if (params.seriesName === '权重分布') {
          const weight = weights[key] || 0
          return `${params.name}<br/>权重: ${(weight * 100).toFixed(0)}%`
        } else {
          if (value === 0) {
            return `${params.name}<br/>暂无监测数据`
          }
          
          // 人口密度特殊显示
          if (key === 'populationDensity') {
            return `${params.name}<br/>数值: ${value.toFixed(0)}人/km²`
          }
          
          return `${params.name}<br/>风险指数: ${value.toFixed(1)}/${maxValue}`
        }
      }
    },
    legend: {
      bottom: 10,
      data: ['权重分布', '实际数值']
    },
    radar: {
      indicator: indicator,
      shape: 'circle',
      splitNumber: 5,
      center: ['50%', '50%'],
      radius: '65%',
      splitLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.05)', 'rgba(64, 158, 255, 0.02)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#C0C4CC'
        }
      },
      axisName: {
        fontSize: 13,
        color: '#606266'
      }
    },
    series: [
      {
        name: '风险因素雷达',
        type: 'radar',
        emphasis: {
          lineStyle: {
            width: 3
          }
        },
        data: [
          {
            value: weightData,
            name: '权重分布',
            lineStyle: {
              color: '#409EFF',
              width: 2
            },
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.2)'
            },
            itemStyle: {
              color: '#409EFF'
            },
            symbol: 'circle',
            symbolSize: 6
          },
          {
            value: factorData,
            name: '实际数值',
            lineStyle: {
              color: '#F56C6C',
              width: 2
            },
            areaStyle: {
              color: 'rgba(245, 108, 108, 0.2)'
            },
            itemStyle: {
              color: '#F56C6C'
            },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      }
    ]
  }

  radarChartInstance.setOption(option)
}

/**
 * 初始化历史对比图表
 */
const initHistoryChart = async () => {
  if (!historyChart.value || !historicalData.value) return

  await nextTick()
  
  // 优化：复用实例而不是销毁重建
  if (!historyChartInstance || historyChartInstance.isDisposed()) {
    historyChartInstance = echarts.init(historyChart.value)
  } else {
    historyChartInstance.clear()
  }

  // 模拟历史数据（实际应从props中获取）
  const xData = ['7天前', '6天前', '5天前', '4天前', '3天前', '2天前', '1天前', '今天']
  const yData = [2, 2, 3, 3, 2, 3, 4, 3]

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `${params[0].name}<br/>风险等级: ${params[0].value}`
      }
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '风险等级',
      min: 1,
      max: 5,
      interval: 1
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%'
    },
    series: [
      {
        name: '风险等级',
        type: 'line',
        data: yData,
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 3
        },
        itemStyle: {
          color: '#409EFF',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#E6A23C'
          },
          data: [{ yAxis: 3, name: '警戒线' }]
        }
      }
    ]
  }

  historyChartInstance.setOption(option)
}


// 监听数据变化（防抖优化，避免频繁重绘）
let contributingTimer: number | null = null
watch(() => props.contributing, () => {
  if (contributingTimer) clearTimeout(contributingTimer)
  contributingTimer = setTimeout(() => {
    nextTick(() => {
      initFactorsChart()
      initRadarChart()
    })
  }, 100) as any // 100ms防抖
}, { deep: true })

let historyTimer: number | null = null
watch(() => props.history, () => {
  if (historyTimer) clearTimeout(historyTimer)
  historyTimer = setTimeout(() => {
    nextTick(() => {
      initHistoryChart()
    })
  }, 100) as any
}, { deep: true })

// 组件挂载
onMounted(() => {
  initFactorsChart()
  initRadarChart()
  initHistoryChart()
})

// 组件卸载
onBeforeUnmount(() => {
  // 清理定时器
  if (contributingTimer) clearTimeout(contributingTimer)
  if (historyTimer) clearTimeout(historyTimer)
  
  // 清理图表实例
  if (factorsChartInstance && !factorsChartInstance.isDisposed()) {
    factorsChartInstance.dispose()
  }
  factorsChartInstance = null
  
  if (radarChartInstance && !radarChartInstance.isDisposed()) {
    radarChartInstance.dispose()
  }
  radarChartInstance = null
  
  if (historyChartInstance && !historyChartInstance.isDisposed()) {
    historyChartInstance.dispose()
  }
  historyChartInstance = null
})
</script>

<style scoped>
.risk-visuals {
  padding: 20px 0;
}

.visual-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #E4E7ED;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.visual-section h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid #409EFF;
}

/* ML评估概览 */
.overview-section {
  background: white;
  border: 1px solid #E4E7ED;
}

.overview-section h4 {
  border-bottom-color: #409EFF;
  color: #303133;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.overview-card {
  background: #f5f7fa;
  border: 1px solid #E4E7ED;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.card-sub {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

/* 可视化内容布局 */
.visual-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  max-width: 600px;
  height: 400px;
  margin: 0 auto;
}

.radar-chart {
  height: 400px;
}

.history-chart {
  height: 350px;
}

/* 因素卡片网格 */
.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.factor-card {
  background: white;
  border-radius: 10px;
  padding: 14px;
  border: 2px solid #E4E7ED;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.factor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.factor-card.level-critical {
  border-color: #F56C6C;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
}

.factor-card.level-high {
  border-color: #E6A23C;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
}

.factor-card.level-medium {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.factor-card.level-low {
  border-color: #67C23A;
  background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
}

.factor-card.level-minimal {
  border-color: #C0C4CC;
  background: white;
}

.factor-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.factor-icon {
  font-size: 20px;
}

.factor-name {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.factor-body {
  margin-bottom: 8px;
}

.factor-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.factor-weight {
  font-size: 11px;
  color: #909399;
}

.factor-progress {
  margin-top: 8px;
}

/* 雷达图区域 */
.radar-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 历史对比区域 */
.history-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

@media (max-width: 768px) {
  .visual-content {
    flex-direction: column;
  }
  
  .chart-container {
    width: 100%;
    height: 250px;
  }
  
  .factors-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
