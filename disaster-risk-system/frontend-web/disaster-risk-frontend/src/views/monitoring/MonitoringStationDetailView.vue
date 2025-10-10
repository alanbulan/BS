<template>
  <div class="monitoring-station-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </el-button>
        <div class="header-title">
          <h2>{{ station?.name || '监测站详情' }}</h2>
          <p>{{ station?.station_id }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="editStation">
          <el-icon><Edit /></el-icon>
          编辑站点
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 站点信息 -->
    <div v-else-if="station" class="station-content">
      <!-- 基本信息卡片 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="info-item">
              <label>站点编码：</label>
              <span>{{ station.station_id }}</span>
            </div>
            <div class="info-item">
              <label>站点名称：</label>
              <span>{{ station.name }}</span>
            </div>
            <div class="info-item">
              <label>监测类型：</label>
              <el-tag :type="getTypeTagType(station.station_type)">
                {{ station.station_type_name || getTypeText(station.station_type) }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>所属区域：</label>
              <span>{{ station.zone_name || '未分配' }}</span>
            </div>
            <div class="info-item">
              <label>状态：</label>
              <el-tag :type="getStatusTagType(station.is_active)">
                {{ getStatusText(station.is_active) }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>坐标位置：</label>
              <span v-if="station.longitude && station.latitude">
                {{ station.longitude.toFixed(6) }}, {{ station.latitude.toFixed(6) }}
              </span>
              <span v-else>未设置</span>
            </div>
            <div class="info-item">
              <label>最后数据时间：</label>
              <span>{{ formatTime(station.last_data_time || null) }}</span>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ formatTime(station.created_at) }}</span>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <!-- 实时数据图表 -->
          <el-card class="chart-card">
            <template #header>
              <span>实时监测数据</span>
            </template>
            <div ref="chartContainer" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史数据表格 -->
      <el-card class="data-table-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>历史数据</span>
            <div class="header-actions">
              <el-select
                v-model="selectedDataType"
                placeholder="数据类型"
                clearable
                filterable
                style="width: 160px"
                @change="onFilterChange"
              >
                <el-option
                  v-for="dt in availableDataTypes"
                  :key="dt"
                  :label="dt"
                  :value="dt"
                />
              </el-select>

              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="onFilterChange"
              />

              <el-select v-model="exportFormat" placeholder="导出格式" style="width: 120px">
                <el-option label="CSV" value="csv" />
                <el-option label="Excel" value="excel" />
              </el-select>
              <el-button @click="exportData">导出数据</el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="historyData" v-loading="dataLoading">
          <el-table-column prop="timestamp" label="记录时间" width="180">
            <template #default="scope">
              {{ formatTime(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="data_type" label="数据类型" width="120" />
          <el-table-column prop="value" label="数值" width="100" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quality_flag" label="质量标识" width="100">
            <template #default="scope">
              <el-tag :type="getQualityTagType(scope.row.quality_flag)">
                {{ getQualityText(scope.row.quality_flag) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 新增：原始数据 JSON 友好显示 -->
          <el-table-column prop="raw_data" label="原始数据" min-width="260">
            <template #default="scope">
              <div v-if="isJson(scope.row.raw_data)" class="json-cell">
                <div class="json-tools">
                  <el-button link type="primary" size="small" @click="toggleExpand(scope.row.id, 'raw')">
                    {{ expandedRaw[scope.row.id] ? '收起' : '展开' }}
                  </el-button>
                  <el-button link size="small" @click="copyJson(scope.row.raw_data)">复制</el-button>
                </div>
                <div
                  class="json-content"
                  :class="{ collapsed: !expandedRaw[scope.row.id] }"
                  v-html="highlightJson(scope.row.raw_data)"
                ></div>
              </div>
              <div v-else class="json-empty">—</div>
            </template>
          </el-table-column>

          <!-- 新增：处理后数据 JSON 友好显示 -->
          <el-table-column prop="processed_data" label="处理后数据" min-width="260">
            <template #default="scope">
              <div v-if="isJson(scope.row.processed_data)" class="json-cell">
                <div class="json-tools">
                  <el-button link type="primary" size="small" @click="toggleExpand(scope.row.id, 'processed')">
                    {{ expandedProcessed[scope.row.id] ? '收起' : '展开' }}
                  </el-button>
                  <el-button link size="small" @click="copyJson(scope.row.processed_data)">复制</el-button>
                </div>
                <div
                  class="json-content"
                  :class="{ collapsed: !expandedProcessed[scope.row.id] }"
                  v-html="highlightJson(scope.row.processed_data)"
                ></div>
              </div>
              <div v-else class="json-empty">—</div>
            </template>
          </el-table-column>

        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalData"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-empty description="未找到监测站信息" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, shallowRef, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Refresh } from '@element-plus/icons-vue'
import { monitoringStationsApi, monitoringDataApi } from '@/api/modules/monitoring'
import type { MonitoringStation, MonitoringData } from '@/api/modules/monitoring'
import { monitoringStationTypesApi } from '@/api/modules/monitoring-station-types'
import type { MonitoringStationType } from '@/types'
import * as echarts from 'echarts'
import { useAppStore } from '@/stores/app'

// 路由
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const dataLoading = ref(false)
const station = ref<MonitoringStation | null>(null)
const historyData = ref<MonitoringData[]>([])
const realtimeData = ref<MonitoringData[]>([])
const dateRange = ref<[Date, Date] | null>(null)
const selectedDataType = ref<string | undefined>(undefined)
const availableDataTypes = ref<string[]>([])
const exportFormat = ref<'csv' | 'excel'>('csv')
const chartContainer = ref<HTMLElement>()
const chartInstance = shallowRef<echarts.ECharts | null>(null)
const realtimeTimer = ref<number | null>(null)
const expandedRaw = ref<Record<number, boolean>>({})
const expandedProcessed = ref<Record<number, boolean>>({})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const totalData = ref(0)

// 监测站类型字典
const stationTypeOptions = ref<MonitoringStationType[]>([])

// 获取站点ID
const stationId = route.params.id as string

// 获取站点详情
const fetchStationDetail = async () => {
  try {
    loading.value = true
    const response = await monitoringStationsApi.getStation(Number(stationId))
    if (response.success) {
      station.value = response.data
    } else {
      ElMessage.error('获取站点详情失败')
    }
  } catch (error) {
    console.error('获取站点详情失败:', error)
    ElMessage.error('获取站点详情失败')
  } finally {
    loading.value = false
  }
}

// 汇总可用数据类型（回退方案）
const collectAvailableDataTypes = (list: MonitoringData[]) => {
  const set = new Set<string>()
  list.forEach(d => d?.data_type && set.add(d.data_type))
  // 仅当接口未返回类型时才更新
  if (availableDataTypes.value.length === 0) {
    availableDataTypes.value = Array.from(set)
  }
}

/**
 * 从后端加载全局数据类型
 * 优先用于填充下拉框，避免“No data”
 */
const loadDataTypes = async () => {
  try {
    const resp = await monitoringDataApi.getDataTypes()
    if (resp.success && Array.isArray(resp.data)) {
      const types = resp.data
        .filter(t => t && t.type)
        .map(t => t.type)
      // 去重并按字母排序
      availableDataTypes.value = Array.from(new Set(types)).sort()
    }
  } catch (e) {
    console.error('加载数据类型失败:', e)
  }
}

// 获取历史数据
const loadHistoryData = async () => {
  try {
    dataLoading.value = true
    const params: any = {
      station_id: station.value?.station_id || undefined,
      page: currentPage.value,
      limit: pageSize.value
    }

    if (selectedDataType.value) {
      params.data_type = selectedDataType.value
    }

    if (dateRange.value) {
      params.start_time = dateRange.value[0].toISOString()
      params.end_time = dateRange.value[1].toISOString()
    }
    
    const response = await monitoringDataApi.getData(params)
    if (response.success) {
      historyData.value = response.data || []
      totalData.value = response.pagination?.total || 0
      // 当接口未提供类型或用户未选类型时，使用回退收集
      if (!selectedDataType.value) {
        collectAvailableDataTypes(historyData.value)
      }
      updateChart()
    }
  } catch (error) {
    console.error('获取历史数据失败:', error)
    ElMessage.error('获取历史数据失败')
  } finally {
    dataLoading.value = false
  }
}

// 组件挂载
onMounted(async () => {
  await Promise.all([
    loadStationTypes(),
    fetchStationDetail(),
    loadDataTypes()
  ])
  await loadHistoryData()
  await initChart()
  startRealtimeTimer()
})

// 获取实时数据
const loadRealtimeData = async () => {
  try {
    const sid = station.value?.station_id || stationId
    if (!sid) return
    const response = await monitoringDataApi.getRealTimeData({ 
      station_id: sid, 
      data_type: selectedDataType.value || undefined,
      minutes: Math.max(1, Math.floor(appStore.dataUpdateInterval / 60000)) * 5, 
      limit: 200 
    })
    if (response.success && response.data) {
      realtimeData.value = response.data
      if (!selectedDataType.value) {
        collectAvailableDataTypes(realtimeData.value)
      }
      updateChart()
    }
  } catch (error) {
    console.error('获取实时数据失败:', error)
  }
}

// 过滤条件变化
const onFilterChange = () => {
  currentPage.value = 1
  loadHistoryData()
  loadRealtimeData()
}

// 加载监测站类型（仅取激活）
const loadStationTypes = async () => {
  try {
    const response = await monitoringStationTypesApi.getTypes(true)
    if (response.success) {
      stationTypeOptions.value = response.data || []
    } else {
      ElMessage.error(response.message || '加载监测站类型失败')
      stationTypeOptions.value = []
    }
  } catch (error) {
    console.error('加载监测站类型失败:', error)
    ElMessage.error('加载监测站类型失败')
    stationTypeOptions.value = []
  }
}

// 初始化图表
const initChart = async () => {
  await nextTick()
  if (chartContainer.value) {
    try {
      chartInstance.value = markRaw(echarts.init(chartContainer.value))
      updateChart()
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize)
    } catch (error) {
      console.error('图表初始化失败:', error)
    }
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance.value) return

  // 如果没有实时数据，显示历史数据
  const dataToUse = realtimeData.value && realtimeData.value.length > 0 ? realtimeData.value : historyData.value
  
  if (!dataToUse || dataToUse.length === 0) {
    // 显示无数据状态
    const option = {
      title: {
        text: '暂无监测数据',
        left: 'center',
        top: 'middle',
        color: '#999',
        fontSize: 16
      },
      grid: { show: false },
      xAxis: { show: false },
      yAxis: { show: false },
      series: []
    }
    
    if (chartInstance.value) {
      try {
        chartInstance.value.setOption(option, true)
      } catch (error) {
        console.error('设置空数据图表失败:', error)
      }
    }
    return
  }

  // 按数据类型分组
  const groupedData = dataToUse.reduce((acc: any, item) => {
    if (!acc[item.data_type]) {
      acc[item.data_type] = []
    }
    acc[item.data_type].push(item)
    return acc
  }, {})

  // 按时间排序
  Object.keys(groupedData).forEach(dataType => {
    groupedData[dataType].sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  })

  const series = Object.keys(groupedData).map((dataType, index) => {
    const data = groupedData[dataType]
    return {
      name: dataType,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: data.map((item: any) => [
        new Date(item.timestamp).getTime(),
        parseFloat(item.value) || 0
      ]),
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: getDataTypeColor(dataType, index)
      },
      emphasis: {
        focus: 'series'
      }
    }
  })

  const option = {
    title: {
      text: `${station.value?.name || ''} - 监测数据趋势`,
      left: 'center',
      fontSize: 16,
      fontWeight: 'bold'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params: any) {
        if (!params || params.length === 0) return ''
        
        const time = new Date(params[0].value[0]).toLocaleString('zh-CN')
        let result = `时间: ${time}<br/>`
        
        params.forEach((param: any) => {
          const originalData = dataToUse.find((item: any) => 
            new Date(item.timestamp).getTime() === param.value[0] && 
            item.data_type === param.seriesName
          )
          
          result += `${param.marker}${param.seriesName}: ${param.value[1]}`
          if (originalData?.unit) {
            result += ` ${originalData.unit}`
          }
          
          // 显示质量标志
          if (originalData?.quality_flag !== undefined) {
            const qualityText = getQualityText(originalData.quality_flag)
            result += ` (${qualityText})`
          }
          result += '<br/>'
        })
        
        return result
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      top: 30,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: function(value: any) {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '数值',
      nameLocation: 'middle',
      nameGap: 35,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      axisLabel: {
        formatter: function(value: any) {
          return parseFloat(value).toFixed(2)
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 10
      }
    ],
    series
  }

  try {
    if (chartInstance.value) {
      chartInstance.value.setOption(option, true)
    }
  } catch (error) {
    console.error('图表更新失败:', error)
    // 若出错，尝试重新初始化
    if (chartContainer.value) {
      try {
        if (chartInstance.value && !chartInstance.value.isDisposed()) {
          chartInstance.value.dispose()
        }
        chartInstance.value = markRaw(echarts.init(chartContainer.value))
        chartInstance.value.setOption(option, true)
      } catch (retryError) {
        console.error('图表重建失败:', retryError)
      }
    }
  }
}

// 获取数据类型对应的颜色
const getDataTypeColor = (dataType: string, index: number) => {
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f'
  ]
  
  // 根据数据类型名称生成稳定的颜色
  const colorMap: { [key: string]: string } = {
    '温度': '#ee6666',
    '湿度': '#5470c6', 
    '降雨量': '#91cc75',
    '风速': '#fac858',
    '气压': '#73c0de',
    '水位': '#3ba272',
    '流量': '#fc8452',
    '土壤湿度': '#9a60b4'
  }
  
  return colorMap[dataType] || colors[index % colors.length]
}

// 获取质量标志文本
const getQualityText = (qualityFlag: number | string) => {
  const flag = typeof qualityFlag === 'string' ? parseInt(qualityFlag) : qualityFlag
  switch (flag) {
    case 1: return '差'
    case 2: return '一般'
    case 3: return '良好'
    case 4: return '优秀'
    case 5: return '极佳'
    default: return '未知'
  }
}

// JSON 工具
const isJson = (val: any) => {
  if (val === null || val === undefined) return false
  if (typeof val === 'object') return true
  if (typeof val === 'string') {
    try { JSON.parse(val); return true } catch { return false }
  }
  return false
}

const prettyJson = (val: any) => {
  try {
    if (typeof val === 'string') return JSON.stringify(JSON.parse(val), null, 2)
    return JSON.stringify(val ?? {}, null, 2)
  } catch (e) {
    return String(val ?? '')
  }
}

/**
 * 对 JSON 文本进行语法高亮并返回安全 HTML
 * - 仅用于展示（通过 v-html 渲染）
 * - 复制/导出仍使用 prettyJson 生成的纯文本
 */
function highlightJson(obj: unknown): string {
  let jsonStr = ''
  try {
    if (typeof obj === 'string') {
      const parsed = JSON.parse(obj)
      jsonStr = JSON.stringify(parsed, null, 2)
    } else {
      jsonStr = JSON.stringify(obj ?? {}, null, 2)
    }
  } catch (e) {
    jsonStr = String(obj ?? '')
  }
  const esc = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(
    /(\"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\"\s*:)|(\"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\")|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?/g,
    (m) => {
      if (/^\".*\":$/.test(m)) return `<span class=\"json-key\">${m}</span>`
      if (/^\"/.test(m)) return `<span class=\"json-string\">${m}</span>`
      if (/true|false/.test(m)) return `<span class=\"json-boolean\">${m}</span>`
      if (/null/.test(m)) return `<span class=\"json-null\">${m}</span>`
      return `<span class=\"json-number\">${m}</span>`
    }
  )
}
const copyJson = async (val: any) => {
  try {
    await navigator.clipboard.writeText(prettyJson(val))
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const toggleExpand = (id: number, field: 'raw' | 'processed') => {
  if (field === 'raw') {
    expandedRaw.value[id] = !expandedRaw.value[id]
  } else {
    expandedProcessed.value[id] = !expandedProcessed.value[id]
  }
}

// 启动实时数据定时器
const startRealtimeTimer = () => {
  loadRealtimeData() // 立即加载一次
  realtimeTimer.value = setInterval(() => {
    loadRealtimeData()
  }, appStore.dataUpdateInterval)
}

// 刷新数据
const refreshData = async () => {
  // 先确保拿到站点详情以获取正确的 station_id
  await fetchStationDetail()
  await Promise.all([
    loadHistoryData(),
    loadRealtimeData()
  ])
  ElMessage.success('数据刷新成功')
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/monitoring')
  }
}

// 编辑站点
const editStation = () => {
  // 跳转回监测管理页面并触发编辑
  if (station.value) {
    router.push({
      path: '/monitoring',
      query: { editId: station.value.id }
    })
  }
}

// 导出数据
const exportData = async () => {
  try {
    const sid = station.value?.station_id
    if (!sid) {
      ElMessage.warning('缺少站点编号，无法导出')
      return
    }

    // 必须选择时间范围，确保导出规模可控
    if (!dateRange.value) {
      ElMessage.warning('请先选择时间范围再导出')
      return
    }

    const params = {
      station_id: sid,
      data_type: selectedDataType.value || undefined,
      start_time: dateRange.value[0].toISOString(),
      end_time: dateRange.value[1].toISOString(),
      format: exportFormat.value
    }

    const blob = await monitoringDataApi.exportData(params)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    const start = params.start_time.replace(/[:T]/g, '-').slice(0, 16)
    const end = params.end_time.replace(/[:T]/g, '-').slice(0, 16)
    const ext = exportFormat.value === 'excel' ? 'xlsx' : 'csv'
    a.href = url
    a.download = `monitoring_${sid}_${selectedDataType.value || 'all'}_${start}_to_${end}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadHistoryData()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadHistoryData()
}

// 格式化时间
const formatTime = (time: string | Date | null) => {
  if (!time) return '暂无数据'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'geological': 'warning',
    'meteorological': 'primary',
    'hydrological': 'success',
    'environmental': 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const found = stationTypeOptions.value.find(t => t.code === type)
  return found ? found.name_zh : type
}

// 获取状态标签类型
const getStatusTagType = (isActive: boolean) => {
  return isActive ? 'success' : 'danger'
}

// 获取状态文本
const getStatusText = (isActive: boolean) => {
  return isActive ? '在线' : '离线'
}

// 获取质量标签类型
const getQualityTagType = (flag: number) => {
  const flagMap: Record<number, string> = {
    1: 'danger',   // 差
    2: 'warning',  // 一般
    3: 'info',     // 良好
    4: 'success',  // 优秀
    5: 'success'   // 极佳
  }
  return flagMap[flag] || 'info'
}

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}



// 组件卸载
onUnmounted(() => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
  }
  if (chartInstance.value && !chartInstance.value.isDisposed()) {
    chartInstance.value.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.monitoring-station-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  margin-left: 16px;
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-title p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.loading-container {
  padding: 20px;
}

.info-card .info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.info-card .info-item label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.info-card .info-item span {
  color: #303133;
}

.chart-container {
  height: 380px;
  width: 100%;
}

.data-table-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.json-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.json-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.json-content {
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 10px;
  font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
  max-height: 160px;
  overflow: auto;
}

.json-content.collapsed {
  max-height: 48px;
  overflow: hidden;
}

.json-empty {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* JSON 语法高亮配色 */
.json-key { color: #c41d7f; }
.json-string { color: #52c41a; }
.json-number { color: #1a76d2; }
.json-boolean { color: #d48806; }
.json-null { color: #909399; }
</style>