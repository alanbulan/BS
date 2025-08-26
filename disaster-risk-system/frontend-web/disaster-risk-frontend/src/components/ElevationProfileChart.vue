<template>
  <div class="elevation-profile-chart-wrapper">
    <div ref="chartContainer" class="elevation-chart-container" :style="{ height }"></div>
    
    <!-- 错误提示覆盖层 -->
    <div v-if="error" class="chart-error-overlay">
      <div class="error-message">
        <i class="el-icon-warning"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

/**
 * 高程剖面图表组件
 * 使用ECharts展示道路高程数据，包括起始高程、最高最低高程等
 */

interface ElevationProfile {
  start_elevation?: number
  end_elevation?: number
  max_elevation?: number
  min_elevation?: number
  [key: string]: any
}

interface Props {
  elevationData?: ElevationProfile | null
  height?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  title: '高程剖面图'
})

// 响应式数据
const chartContainer = ref<HTMLElement>()
const error = ref<string>('')
let chart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 初始化图表
const initializeChart = async () => {
  if (!chartContainer.value) {
    error.value = '图表容器未找到'
    return
  }

  try {
    // 创建ECharts实例
    chart = echarts.init(chartContainer.value)

    // 设置ResizeObserver监听容器尺寸变化
    if (chartContainer.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (chart) {
          setTimeout(() => {
            chart?.resize()
          }, 100)
        }
      })
      resizeObserver.observe(chartContainer.value)
    }

    // 显示数据
    if (props.elevationData) {
      displayElevationProfile(props.elevationData)
    }

    error.value = ''
  } catch (err) {
    console.error('图表初始化失败:', err)
    error.value = '图表初始化失败'
  }
}

// 解析高程数据
const parseElevationData = (data: any): ElevationProfile | null => {
  if (!data) return null
  
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('高程数据解析失败:', e)
      return null
    }
  }
  
  return data
}

// 显示高程剖面
const displayElevationProfile = (elevation: ElevationProfile) => {
  if (!chart) return

  const elevationData = parseElevationData(elevation)
  if (!elevationData) {
    error.value = '高程数据格式不正确'
    return
  }

  try {
    // 构建图表数据
    const chartData = []
    const labels = []
    
    // 如果有起始和结束高程，构建简单的剖面
    if (elevationData.start_elevation !== undefined && elevationData.end_elevation !== undefined) {
      labels.push('起点')
      chartData.push(elevationData.start_elevation)
      
      // 如果有最高点和最低点，添加到中间
      if (elevationData.max_elevation !== undefined && elevationData.min_elevation !== undefined) {
        // 添加最低点
        labels.push('最低点')
        chartData.push(elevationData.min_elevation)
        
        // 添加最高点
        labels.push('最高点')
        chartData.push(elevationData.max_elevation)
      }
      
      labels.push('终点')
      chartData.push(elevationData.end_elevation)
    } else {
      // 如果只有最高最低点数据
      if (elevationData.min_elevation !== undefined) {
        labels.push('最低点')
        chartData.push(elevationData.min_elevation)
      }
      if (elevationData.max_elevation !== undefined) {
        labels.push('最高点')
        chartData.push(elevationData.max_elevation)
      }
    }

    if (chartData.length === 0) {
      error.value = '无有效的高程数据'
      return
    }

    // 配置图表选项
    const option = {
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `${data.name}: ${data.value}m`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '高程 (m)',
        nameTextStyle: {
          fontSize: 12,
          color: '#666'
        },
        axisLabel: {
          fontSize: 12,
          color: '#666',
          formatter: '{value}m'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '高程',
          type: 'line',
          data: chartData,
          smooth: true,
          lineStyle: {
            color: '#1890ff',
            width: 3
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#1890ff',
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              color: '#40a9ff',
              borderColor: '#fff',
              borderWidth: 3,
              shadowColor: 'rgba(24, 144, 255, 0.3)',
              shadowBlur: 10
            }
          }
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut' as const
    }

    // 设置图表配置
    chart.setOption(option, true)

    // 添加数据统计信息
    const elevationRange = Math.max(...chartData) - Math.min(...chartData)
    console.log(`高程统计 - 范围: ${elevationRange}m, 最高: ${Math.max(...chartData)}m, 最低: ${Math.min(...chartData)}m`)

  } catch (err) {
    console.error('显示高程剖面失败:', err)
    error.value = '显示高程剖面失败'
  }
}

// 监听高程数据变化
watch(() => props.elevationData, (newData) => {
  if (newData && chart) {
    displayElevationProfile(newData)
  }
}, { deep: true })

// 监听标题变化
watch(() => props.title, () => {
  if (props.elevationData && chart) {
    displayElevationProfile(props.elevationData)
  }
})

// 组件挂载
onMounted(async () => {
  await nextTick()
  initializeChart()
})

// 组件卸载
onUnmounted(() => {
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
  }
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.elevation-profile-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.elevation-chart-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.chart-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05);
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
</style>