<template>
  <div class="risk-visuals">
    <!-- 影响因素可视化 -->
    <div v-if="contributingFactors" class="visual-section">
      <h4>影响因素分析</h4>
      <div class="visual-content">
        <div ref="contributingChart" class="chart-container"></div>
        <!-- 因素详情卡片 -->
        <div class="factors-grid">
          <div 
            v-for="(value, key) in contributingFactors"
            :key="key"
            class="factor-card"
            :class="getFactorLevel(value)"
          >
            <div class="factor-name">{{ formatFactorName(String(key)) }}</div>
            <div class="factor-value">{{ formatFactorValue(value) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 天气条件可视化 -->
    <div v-if="weatherConditions" class="visual-section weather-section">
      <h4>天气条件</h4>
      <div class="weather-content">
        <!-- 天气动画区域 -->
        <div class="weather-animation">
          <div 
            class="weather-bg"
            :class="getWeatherAnimationClass()"
          >
            <!-- 背景动画层 -->
            <div class="weather-bg-effects">
              <!-- 云朵层 -->
              <div class="cloud-layer" v-if="getWeatherAnimationClass().includes('cloudy')">
                <div class="cloud cloud-1"></div>
                <div class="cloud cloud-2"></div>
                <div class="cloud cloud-3"></div>
              </div>
              
              <!-- 阳光层 -->
              <div class="sun-layer" v-if="getWeatherAnimationClass().includes('sunny')">
                <div class="sun">
                  <div class="sun-rays"></div>
                </div>
              </div>
              
              <!-- 雷电层 -->
              <div class="lightning-layer" v-if="getWeatherAnimationClass().includes('wind')">
                <div class="lightning"></div>
              </div>
            </div>

            <div class="weather-icon">
              <i :class="getWeatherIcon()"></i>
            </div>
            
            <!-- 粒子效果层 -->
            <div class="weather-particles" v-if="shouldShowParticles()">
              <div 
                v-for="i in 25" 
                :key="i" 
                class="particle"
                :class="getParticleClass()"
                :style="getParticleStyle(i)"
              ></div>
            </div>
            
            <!-- 涟漪效果 -->
            <div class="weather-ripple">
              <div class="ripple"></div>
              <div class="ripple"></div>
            </div>
          </div>
        </div>
        
        <!-- 天气详情 -->
        <div class="weather-details">
          <div class="weather-main">
            <span class="weather-type">{{ formatWeatherType() }}</span>
            <span v-if="weatherConditions.temperature" class="temperature">
              {{ weatherConditions.temperature }}°C
            </span>
          </div>
          <div class="weather-metrics">
            <div v-if="weatherConditions.humidity" class="metric">
              <span class="metric-label">湿度</span>
              <span class="metric-value">{{ weatherConditions.humidity }}%</span>
            </div>
            <div v-if="weatherConditions.wind_speed" class="metric">
              <span class="metric-label">风速</span>
              <span class="metric-value">{{ weatherConditions.wind_speed }} m/s</span>
            </div>
            <div v-if="weatherConditions.precipitation" class="metric">
              <span class="metric-label">降水量</span>
              <span class="metric-value">{{ weatherConditions.precipitation }} mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史对比可视化 -->
    <div v-if="historicalComparison" class="visual-section">
      <h4>历史对比分析</h4>
      <div class="history-content">
        <!-- 时间序列图表 -->
        <div v-if="isTimeSeriesData()" class="history-chart">
          <div ref="historyChart" class="chart-container"></div>
        </div>
        
        <!-- 结构化数据卡片 -->
        <div v-else class="history-cards">
          <div 
            v-for="(value, key) in historicalComparison"
            :key="key"
            class="history-card"
          >
            <div class="card-header">{{ formatHistoryKey(String(key)) }}</div>
            <div class="card-content">
              <template v-if="typeof value === 'object'">
                <div 
                  v-for="(subValue, subKey) in value"
                  :key="subKey"
                  class="sub-item"
                >
                  <span class="sub-label">{{ formatHistoryKey(String(subKey)) }}:</span>
                  <span class="sub-value">{{ formatHistoryValue(subValue) }}</span>
                </div>
              </template>
              <template v-else>
                <span class="single-value">{{ formatHistoryValue(value) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
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
const contributingChart = ref<HTMLElement>()
const historyChart = ref<HTMLElement>()

// 图表实例
let contributingChartInstance: ECharts | null = null
let historyChartInstance: ECharts | null = null

// 计算属性
const contributingFactors = ref(props.contributing)
const weatherConditions = ref(props.weather)
const historicalComparison = ref(props.history)

/**
 * 初始化影响因素图表
 */
const initContributingChart = async () => {
  if (!contributingChart.value || !contributingFactors.value) return

  await nextTick()
  
  if (contributingChartInstance) {
    contributingChartInstance.dispose()
  }

  contributingChartInstance = echarts.init(contributingChart.value)

  const factors = Object.entries(contributingFactors.value)
  const data = factors.map(([name, value]) => ({
    name: formatFactorName(name),
    value: Number(value) || 0
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        name: '影响因素权重',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ],
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  }

  contributingChartInstance.setOption(option)
}

/**
 * 初始化历史对比图表
 */
const initHistoryChart = async () => {
  if (!historyChart.value || !isTimeSeriesData()) return

  await nextTick()
  
  if (historyChartInstance) {
    historyChartInstance.dispose()
  }

  historyChartInstance = echarts.init(historyChart.value)

  const timeSeriesData = Array.isArray(historicalComparison.value) 
    ? historicalComparison.value 
    : historicalComparison.value.timeline || []

  const xData = timeSeriesData.map((item: any) => 
    item.time || item.date || item.timestamp || item.period
  )
  const yData = timeSeriesData.map((item: any) => 
    item.risk_level || item.level || item.value || item.score
  )

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '风险等级',
      min: 1,
      max: 5,
      interval: 1
    },
    series: [
      {
        name: '风险等级',
        type: 'line',
        data: yData,
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ],
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%'
    }
  }

  historyChartInstance.setOption(option)
}

/**
 * 判断是否为时间序列数据
 */
const isTimeSeriesData = (): boolean => {
  if (!historicalComparison.value) return false
  
  // 检查是否为数组形式的时间序列
  if (Array.isArray(historicalComparison.value)) {
    return historicalComparison.value.some(item => 
      item && typeof item === 'object' && 
      (item.time || item.date || item.timestamp || item.period)
    )
  }
  
  // 检查是否包含 timeline 字段
  if (historicalComparison.value.timeline && Array.isArray(historicalComparison.value.timeline)) {
    return true
  }
  
  return false
}

/**
 * 格式化因素名称
 */
const formatFactorName = (key: string): string => {
  const nameMap: Record<string, string> = {
    rainfall: '降雨量',
    temperature: '温度',
    wind_speed: '风速',
    humidity: '湿度',
    terrain: '地形',
    population_density: '人口密度',
    infrastructure: '基础设施',
    geological: '地质条件'
  }
  return nameMap[key] || key.replace(/_/g, ' ')
}

/**
 * 格式化因素值
 */
const formatFactorValue = (value: any): string => {
  if (typeof value === 'number') {
    return `${(value * 100).toFixed(1)}%`
  }
  return String(value)
}

/**
 * 获取因素等级样式
 */
const getFactorLevel = (value: any): string => {
  const numValue = Number(value) || 0
  if (numValue >= 0.8) return 'level-high'
  if (numValue >= 0.6) return 'level-medium'
  if (numValue >= 0.4) return 'level-low'
  return 'level-minimal'
}

/**
 * 旧版天气函数已移除，请使用下方基于 normalizeWeatherData 的实现
 */

/**
 * 是否显示粒子效果
 */
const shouldShowParticles = (): boolean => {
  const animationClass = getWeatherAnimationClass()
  return animationClass === 'weather-rain' || animationClass === 'weather-snow'
}

/**
 * 获取粒子类型类名（雨/雪）
 * 用于区别形态与动画速度
 */
const getParticleClass = (): string => {
  const cls = getWeatherAnimationClass()
  if (cls === 'weather-rain') return 'particle-rain'
  if (cls === 'weather-snow') return 'particle-snow'
  return ''
}

/**
 * 获取粒子样式
 * 不同天气类型具有不同大小/速度分布
 */
const getParticleStyle = (_index: number) => {
  const left = Math.random() * 100
  const top = Math.random() * -50
  const type = getWeatherAnimationClass()

  if (type === 'weather-snow') {
    const delay = Math.random() * 2
    const duration = 2.5 + Math.random() * 2.5 // 雪花更慢
    const size = 3 + Math.random() * 3
    const opacity = 0.7 + Math.random() * 0.3
    return {
      left: `${left}%`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      opacity
    }
  }

  // rain 默认
  const delay = Math.random() * 1.5
  const duration = 0.8 + Math.random() * 1.2
  const height = 10 + Math.random() * 10
  const opacity = 0.4 + Math.random() * 0.4
  return {
    left: `${left}%`,
    top: `${top}px`,
    width: '2px',
    height: `${height}px`,
    borderRadius: '2px',
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity
  }
}

/**
 * 根据多源字段与关键字推断天气分类
 * 返回统一的英文分类标识：rain | snow | windy | cloudy | sunny/clear | fog | storm | thunderstorm
 */
function classifyWeather(info: { mainText?: any, desc?: any, rain?: number, snow?: number, windSpeed?: number, cloud?: number }) {
  const textRaw = info.mainText ?? info.desc ?? ''
  const text = String(textRaw).toLowerCase()
  const textCN = String(textRaw)

  if (text.includes('thunder') || textCN.includes('雷')) return 'thunderstorm'
  if (text.includes('storm') || textCN.includes('暴风') || textCN.includes('台风')) return 'storm'
  if (text.includes('snow') || textCN.includes('雪') || (typeof info.snow === 'number' && info.snow > 0)) return 'snow'
  if (text.includes('rain') || text.includes('drizzle') || textCN.includes('雨') || (typeof info.rain === 'number' && info.rain > 0)) return 'rain'
  if (text.includes('fog') || text.includes('mist') || text.includes('haze') || textCN.includes('雾')) return 'fog'
  if (text.includes('wind') || textCN.includes('风') || (typeof info.windSpeed === 'number' && info.windSpeed >= 10)) return 'windy'
  if (text.includes('cloud') || text.includes('overcast') || textCN.includes('云') || (typeof info.cloud === 'number' && info.cloud >= 50)) return 'cloudy'
  if (text.includes('clear') || text.includes('sunny') || textCN.includes('晴')) return 'clear'
  return undefined
}

/**
 * 格式化天气数据
 * - 兼容字符串（纯描述或 JSON 字符串）与对象（OpenWeather/和风/自定义）
 * - 统一输出字段：main_weather, temperature, humidity, wind_speed, precipitation, cloudiness, intensity, description
 */
const normalizeWeatherData = (weather: any) => {
  if (!weather) return null

  // 字符串：尝试 JSON 解析，否则作为描述文本
  if (typeof weather === 'string') {
    try {
      const parsed = JSON.parse(weather)
      return normalizeWeatherData(parsed)
    } catch {
      const inferred = classifyWeather({ mainText: weather })
      const canonical = inferred ?? String(weather)
      return {
        main_weather: canonical,
        weather: canonical,
        type: canonical,
        description: String(weather)
      }
    }
  }

  if (typeof weather === 'object') {
    const wArr = Array.isArray(weather.weather) ? weather.weather : null
    const wObj = wArr?.[0] || (typeof weather.weather === 'object' && !Array.isArray(weather.weather) ? weather.weather : null)

    const description = weather.description || weather.desc || weather.weather_desc || weather.condition_text || weather.text || wObj?.description

    // 优先级：main_weather > weather[0].main > weather.weather.main > type/condition > description
    let mainText: any = weather.main_weather ?? wObj?.main ?? (typeof weather.weather === 'string' ? weather.weather : undefined) ?? weather.type ?? weather.weather_type ?? weather.condition ?? description

    if (typeof mainText === 'object' && mainText) {
      mainText = (mainText as any).main || (mainText as any).type || (mainText as any).status || ''
    }

    const temperature = weather.temperature ?? weather.temp ?? weather.main?.temp ?? weather.now?.temp ?? weather.temperature_c ?? weather.temperature_C
    const humidity = weather.humidity ?? weather.main?.humidity
    const wind_speed = weather.wind_speed ?? weather.wind?.speed ?? weather.windSpeed ?? weather.wind?.speed_mps

    const rain = (typeof weather.precipitation === 'number') ? weather.precipitation
      : (typeof weather.rain === 'number') ? weather.rain
      : (typeof weather?.rain?.['1h'] === 'number') ? weather.rain['1h']
      : (typeof weather?.rain?.['3h'] === 'number') ? weather.rain['3h']
      : (typeof weather.precip_mm === 'number') ? weather.precip_mm
      : undefined

    const snow = (typeof weather?.snow?.['1h'] === 'number') ? weather.snow['1h']
      : (typeof weather?.snow?.['3h'] === 'number') ? weather.snow['3h']
      : undefined

    const cloudiness = weather.cloudiness ?? weather.cloud_cover ?? weather.clouds?.all
    const intensity = weather.intensity ?? wObj?.intensity

    const inferred = classifyWeather({ mainText, desc: description, rain, snow, windSpeed: wind_speed, cloud: cloudiness })

    // Fallback 逻辑：
    // 1) 有推断则用推断
    // 2) 有 mainText 则用 mainText
    // 3) 无法推断但存在温度/湿度/风/云/降水等字段 => 默认 clear（晴朗）
    // 4) 仍无任何线索 => unknown
    const hasWeatherFields = (
      temperature !== undefined ||
      humidity !== undefined ||
      wind_speed !== undefined ||
      cloudiness !== undefined ||
      rain !== undefined ||
      snow !== undefined
    )

    let canonical: string
    if (inferred) {
      canonical = inferred
    } else if (typeof mainText === 'string' && mainText) {
      canonical = mainText
    } else if (hasWeatherFields) {
      canonical = 'clear'
    } else {
      canonical = 'unknown'
    }

    return {
      main_weather: canonical,
      weather: canonical,
      type: canonical,
      description,
      temperature,
      humidity,
      wind_speed,
      precipitation: typeof rain === 'number' ? rain : (typeof snow === 'number' ? snow : undefined),
      cloudiness,
      intensity
    }
  }

  return null
}

/**
 * 格式化天气类型（展示文案）
 */
const formatWeatherType = (): string => {
  if (!weatherConditions.value) return '未知天气'

  const normalized = normalizeWeatherData(weatherConditions.value)
  if (!normalized) return '未知天气'

  const classification = classifyWeather({
    mainText: normalized.main_weather,
    desc: (normalized as any).description,
    rain: normalized.precipitation as any,
    windSpeed: normalized.wind_speed as any,
    cloud: (normalized as any).cloudiness as any
  })

  const typeMap: Record<string, string> = {
    rain: '雨天',
    rainy: '雨天',
    drizzle: '毛毛雨',
    snow: '雪天',
    snowy: '雪天',
    wind: '大风',
    windy: '大风',
    cloud: '多云',
    cloudy: '多云',
    sunny: '晴天',
    clear: '晴朗',
    fog: '雾天',
    foggy: '有雾',
    storm: '暴风雨',
    thunderstorm: '雷暴',
    unknown: '未知天气'
  }

  if (classification && typeMap[classification]) return typeMap[classification]

  const weatherText = String(normalized.main_weather || normalized.weather || normalized.type || '未知天气')
  const lower = weatherText.toLowerCase()
  for (const [key, val] of Object.entries(typeMap)) {
    if (lower.includes(key)) return val
  }
  // 中文关键字兜底
  if (weatherText.includes('雨')) return '雨天'
  if (weatherText.includes('雪')) return '雪天'
  if (weatherText.includes('风')) return '大风'
  if (weatherText.includes('云')) return '多云'
  if (weatherText.includes('晴')) return '晴朗'
  if (weatherText.includes('雾')) return '雾天'
  if (weatherText.includes('雷')) return '雷暴'

  // 最后兜底
  if (lower === 'unknown') return '未知天气'

  return weatherText
}

/**
 * 获取天气动画类
 */
const getWeatherAnimationClass = (): string => {
  if (!weatherConditions.value) return 'weather-default'
  
  const normalized = normalizeWeatherData(weatherConditions.value)
  if (!normalized) return 'weather-default'
  
  const weather = String(normalized.main_weather || normalized.weather || normalized.type || '').toLowerCase()
  
  // 精确匹配数据库中的 main_weather 值
  if (weather === 'rain' || weather.includes('rain') || weather.includes('rainy') || weather.includes('drizzle')) return 'weather-rain'
  if (weather === 'snow' || weather.includes('snow') || weather.includes('snowy')) return 'weather-snow'
  if (weather === 'windy' || weather.includes('wind') || weather.includes('windy')) return 'weather-wind'
  if (weather === 'thunderstorm' || weather.includes('thunder') || weather.includes('storm')) return 'weather-wind'
  if (weather === 'cloudy' || weather.includes('cloud') || weather.includes('cloudy')) return 'weather-cloudy'
  if (weather === 'sunny' || weather === 'clear' || weather.includes('sun') || weather.includes('sunny') || weather.includes('clear')) return 'weather-sunny'
  
  return 'weather-default'
}

/**
 * 获取天气图标
 */
const getWeatherIcon = (): string => {
  if (!weatherConditions.value) return 'el-icon-cloudy'
  
  const normalized = normalizeWeatherData(weatherConditions.value)
  if (!normalized) return 'el-icon-cloudy'
  
  const weather = String(normalized.main_weather || normalized.weather || normalized.type || '').toLowerCase()
  
  if (weather.includes('rain') || weather.includes('rainy') || weather.includes('drizzle')) return 'el-icon-heavy-rain'
  if (weather.includes('snow') || weather.includes('snowy')) return 'el-icon-snow'
  if (weather.includes('wind') || weather.includes('windy')) return 'el-icon-wind-power'
  if (weather.includes('cloud') || weather.includes('cloudy')) return 'el-icon-cloudy'
  if (weather.includes('sun') || weather.includes('sunny') || weather.includes('clear')) return 'el-icon-sunny'
  if (weather.includes('storm') || weather.includes('thunder')) return 'el-icon-lightning'
  
  return 'el-icon-cloudy'
}

/**
 * 格式化历史数据键名
 */
const formatHistoryKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    period: '时期',
    risk_level: '风险等级',
    incidents: '事件数量',
    severity: '严重程度',
    recovery_time: '恢复时间',
    economic_loss: '经济损失',
    affected_population: '受影响人口'
  }
  return keyMap[key] || key.replace(/_/g, ' ')
}

/**
 * 格式化历史数据值
 */
const formatHistoryValue = (value: any): string => {
  if (typeof value === 'number') {
    if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value > 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }
  return String(value)
}

// 监听数据变化
watch(() => props.contributing, (newVal) => {
  contributingFactors.value = newVal
  if (newVal) {
    nextTick(() => initContributingChart())
  }
}, { deep: true })

watch(() => props.weather, (newVal) => {
  weatherConditions.value = normalizeWeatherData(newVal)
}, { deep: true })

watch(() => props.history, (newVal) => {
  historicalComparison.value = newVal
  if (newVal && isTimeSeriesData()) {
    nextTick(() => initHistoryChart())
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  // 初始化数据
  weatherConditions.value = normalizeWeatherData(props.weather)
  
  if (contributingFactors.value) {
    initContributingChart()
  }
  if (historicalComparison.value && isTimeSeriesData()) {
    initHistoryChart()
  }
})

// 组件卸载
onBeforeUnmount(() => {
  if (contributingChartInstance) {
    contributingChartInstance.dispose()
    contributingChartInstance = null
  }
  if (historyChartInstance) {
    historyChartInstance.dispose()
    historyChartInstance = null
  }
})
</script>

<style scoped>
.risk-visuals {
  padding: 16px 0;
}

.visual-section {
  margin-bottom: 24px;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.visual-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

/* 影响因素样式 */
.visual-content {
  display: flex;
  gap: 12px;
  align-items: center; /* 使右侧 factors-grid 垂直居中到截图位置 */
  --chart-height: 220px; /* 统一控制图表高度变量，避免硬编码分散 */
  min-height: var(--chart-height); /* 提供足够高度以启用垂直居中 */
}

.chart-container {
  width: 340px;
  height: var(--chart-height); /* 使用变量控制环形图高度 */
  flex-shrink: 0;
  align-self: flex-start; /* 保持环形图靠上，避免被整体居中 */
}

.factors-grid {
  flex: 1 1 520px;
  max-width: 680px;
  display: grid;
  grid-template-columns: repeat(4, minmax(110px, 1fr)); /* 固定为四列，符合期望视觉 */
  gap: 6px; /* 更紧凑的间距 */
  align-items: start;
  align-content: start;
  align-self: center; /* 垂直居中到容器中，位置更贴近截图蓝框 */
  /* 取消固定高度以自适应内容高度，避免被拉伸 */
}

.factor-card {
  background: white;
  border-radius: 6px;
  padding: 4px; /* 紧凑内边距 */
  text-align: center;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  min-height: 40px; /* 行高控制仍保持，避免因内容过少太扁 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 内容垂直居中 */
}

.factor-card.level-high {
  border-color: #f56c6c;
  background: #fef0f0;
}

.factor-card.level-medium {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.factor-card.level-low {
  border-color: #409eff;
  background: #ecf5ff;
}

.factor-card.level-minimal {
  border-color: #67c23a;
  background: #f0f9ff;
}

.factor-name {
  font-size: 10px;
  color: #606266;
  margin-bottom: 0;
  line-height: 1.05; /* 更紧凑 */
}

.factor-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  line-height: 1.05; /* 更紧凑 */
}

/* 天气条件样式 */
.weather-content {
  display: flex;
  gap: 12px;
  align-items: center;
}

.weather-animation {
  width: 160px;
  height: 120px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.weather-bg {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
}

.weather-bg.weather-rain {
  background: linear-gradient(160deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
  box-shadow: inset 0 0 30px rgba(30, 60, 114, 0.4);
}

.weather-bg.weather-snow {
  background: linear-gradient(160deg, #dfe9f3 0%, #f4f8fc 60%, #ffffff 100%);
  box-shadow: inset 0 0 20px rgba(162, 196, 255, 0.3);
}

.weather-bg.weather-wind {
  background: linear-gradient(160deg, #667db6 0%, #0082c8 50%, #667db6 100%);
  box-shadow: inset 0 0 40px rgba(102, 125, 182, 0.3);
}

.weather-bg.weather-cloudy {
  background: linear-gradient(160deg, #bdc3c7 0%, #95a5a6 50%, #7f8c8d 100%);
  box-shadow: inset 0 0 25px rgba(149, 165, 166, 0.3);
}

.weather-bg.weather-sunny {
  background: linear-gradient(160deg, #ff9a9e 0%, #fecfef 30%, #fecfef 70%, #ff9a9e 100%);
  box-shadow: inset 0 0 30px rgba(255, 154, 158, 0.4);
}

.weather-bg.weather-default {
  background: linear-gradient(160deg, #4e54c8 0%, #8f94fb 100%);
}

.weather-icon {
  font-size: 48px;
  color: white;
  z-index: 2;
  position: relative;
  text-shadow: 0 0 15px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
}

.weather-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.7);
  animation: fall linear infinite;
}

@keyframes fall {
  0% {
    transform: translateY(-100px);
    opacity: 1;
  }
  100% {
    transform: translateY(200px);
    opacity: 0;
  }
}

.weather-details {
  flex: 1;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.weather-type {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.temperature {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.weather-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.metric {
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 历史对比样式 */
.history-content {
  min-height: 200px;
}

.history-chart .chart-container {
  width: 100%;
  height: 300px;
}

.history-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.history-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.card-content {
  margin-top: 8px;
}

.card-content > .sub-item + .sub-item {
  margin-top: 8px;
}

.sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sub-label {
  font-size: 12px;
  color: #606266;
}

.sub-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.single-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

@media (max-width: 768px) {
  .visual-content {
    flex-direction: column;
  }
  
  .weather-content {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-container {
    width: 100%;
  }
}
</style>

<style scoped>
/* ===== 新增：背景动画效果层 ===== */
.weather-bg-effects {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

/* 云层 */
.cloud-layer { position: absolute; inset: 0; overflow: hidden; }
.cloud {
  position: absolute;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  border-radius: 50px;
  filter: blur(0.5px);
  animation: cloud-move 18s linear infinite;
}
.cloud-1 { width: 120px; height: 50px; top: 20px; left: -150px; }
.cloud-2 { width: 160px; height: 60px; top: 60px; left: -200px; animation-duration: 22s; opacity: 0.85; }
.cloud-3 { width: 100px; height: 40px; top: 90px; left: -120px; animation-duration: 16s; opacity: 0.8; }

@keyframes cloud-move {
  0% { transform: translateX(0); }
  100% { transform: translateX(420px); }
}

/* 太阳层 */
.sun-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.sun {
  width: 60px; height: 60px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff7cc, #ffd166 60%, #fcb43a 100%);
  box-shadow: 0 0 20px rgba(255, 196, 0, 0.6), inset 0 0 10px rgba(255,255,255,0.6);
  position: relative;
  animation: sun-pulse 4s ease-in-out infinite;
}
.sun-rays {
  position: absolute; inset: -12px; border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(255,214,102,0.0), rgba(255,214,102,0.6), rgba(255,214,102,0.0) 30%);
  filter: blur(6px);
  animation: sun-rotate 12s linear infinite;
}
@keyframes sun-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes sun-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }

/* 雷电层（风暴/大风时闪烁） */
.lightning-layer { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: center; }
.lightning {
  width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 24px solid rgba(255,255,255,0.9);
  filter: drop-shadow(0 0 8px rgba(255,255,255,0.9));
  animation: lightning-flash 3.2s infinite;
  margin-top: 20px;
}
@keyframes lightning-flash {
  0%, 96%, 100% { opacity: 0; transform: translateY(-6px) rotate(0deg); }
  2% { opacity: 1; transform: translateY(0) rotate(5deg); }
  4% { opacity: .2; }
  6% { opacity: 1; transform: translateY(2px) rotate(-6deg); }
  10% { opacity: 0; }
}

/* 涟漪效果 */
.weather-ripple { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 0; }
.weather-ripple .ripple {
  position: absolute; width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35);
  animation: ripple-zoom 3.6s ease-out infinite;
}
.weather-ripple .ripple:nth-child(2) { animation-delay: 1.2s; }
@keyframes ripple-zoom { from { transform: scale(0.6); opacity: .6; } to { transform: scale(2.2); opacity: 0; } }

/* 粒子基础与区分 */
.weather-particles { z-index: 2; }
.particle { position: absolute; background: rgba(255, 255, 255, 0.95); animation: fall linear infinite; filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4)); }
.particle-rain { width: 2px; height: 14px; border-radius: 2px; background: linear-gradient(to bottom, rgba(173, 216, 230, 0.9), rgba(255, 255, 255, 0.95)); }
.particle-snow { width: 5px; height: 5px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(220, 240, 255, 0.9)); box-shadow: 0 0 8px rgba(255, 255, 255, 0.7), inset 0 0 4px rgba(255, 255, 255, 0.6); }

/* 覆盖 fall 距离，保证更自然 */
@keyframes fall {
  0% { transform: translateY(-80px); }
  100% { transform: translateY(220px); }
}
</style>