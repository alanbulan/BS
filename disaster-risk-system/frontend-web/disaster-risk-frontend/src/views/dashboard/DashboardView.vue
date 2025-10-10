<template>
  <div class="dashboard-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>系统概览</h2>
        <p>实时监控系统运行状态和关键指标</p>
      </div>
      <div class="header-right">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 核心统计数据 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon risk-zones">
              <el-icon><MapLocation /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.totalZones }}</div>
              <div class="stats-label">风险区域</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon warnings">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.activeWarnings }}</div>
              <div class="stats-label">活跃预警</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon monitoring">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ systemStatus.monitoring.onlineStations }}</div>
              <div class="stats-label">在线监测站</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon shelters">
              <el-icon><House /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.totalShelters }}</div>
              <div class="stats-label">避难场所</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="16">
        <!-- 地图视图 -->
        <el-col :span="18">
          <div class="map-card">
            <div class="card-header">
              <span>风险分布地图</span>
              <el-button type="text" size="small" @click="$router.push('/risk-zones')">查看详情</el-button>
            </div>
            <div class="map-container">
              <MapComponent />
            </div>
          </div>
        </el-col>
        
        <!-- 右侧信息面板 -->
        <el-col :span="6">
          <!-- 天气信息 -->
          <div class="weather-card" v-if="weatherData">
            <div class="card-header">
              <span>当前天气</span>
              <el-button type="text" size="small" @click="refreshWeather">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
            <div class="weather-content">
              <div class="weather-info-item">
                <label>温度</label>
                <span class="value">{{ weatherData.temperature?.toFixed(1) }}°C</span>
              </div>
              <div class="weather-info-item">
                <label>天气</label>
                <span>{{ weatherData.conditions }}</span>
              </div>
              <div class="weather-info-item">
                <label>湿度</label>
                <span>{{ weatherData.humidity?.toFixed(1) }}%</span>
              </div>
              <div class="weather-info-item">
                <label>风速</label>
                <span>{{ weatherData.windSpeed?.toFixed(1) }} m/s</span>
              </div>
            </div>
          </div>

          <!-- 系统状态 -->
          <div class="status-card">
            <div class="card-header">
              <span>系统状态</span>
            </div>
            <div class="status-list">
              <div class="status-item">
                <div class="status-indicator" :class="systemStatus.monitoring.status"></div>
                <span>监测系统</span>
                <el-tag :type="getStatusType(systemStatus.monitoring.status)" size="small">
                  {{ getStatusText(systemStatus.monitoring.status) }}
                </el-tag>
              </div>
              <div class="status-item">
                <div class="status-indicator" :class="systemStatus.warning.status"></div>
                <span>预警系统</span>
                <el-tag :type="getStatusType(systemStatus.warning.status)" size="small">
                  {{ getStatusText(systemStatus.warning.status) }}
                </el-tag>
              </div>
              <div class="status-item">
                <div class="status-indicator" :class="systemStatus.dataSync.status"></div>
                <span>数据同步</span>
                <el-tag :type="getStatusType(systemStatus.dataSync.status)" size="small">
                  {{ getStatusText(systemStatus.dataSync.status) }}
                </el-tag>
              </div>
              <!-- 维护预警 -->
              <div v-if="maintenanceWarning" class="status-item warning">
                <div class="status-indicator warning"></div>
                <span>设备维护</span>
                <el-tag type="warning" size="small">
                  {{ stationStats?.overdue_maintenance || 0 }}站待维护
                </el-tag>
              </div>
            </div>
          </div>
          
          <!-- 最新预警 -->
          <div class="warnings-card">
            <div class="card-header">
              <span>最新预警</span>
              <el-button type="text" size="small" @click="$router.push('/warnings')">查看全部</el-button>
            </div>
            <div class="warnings-list">
              <div v-if="recentWarnings.length === 0" class="no-data">
                <span>暂无预警信息</span>
              </div>
              <div v-else>
                <div 
                  v-for="warning in recentWarnings.slice(0, 5)" 
                  :key="warning.id" 
                  class="warning-item"
                  @click="viewWarningDetail(warning.id)"
                >
                  <el-tag :type="getWarningLevelType(warning.warning_level)" size="small">
                    {{ getWarningLevelText(warning.warning_level) }}
                  </el-tag>
                  <div class="warning-content">
                    <div class="warning-title">{{ warning.title }}</div>
                    <div class="warning-time">{{ formatTime(warning.issue_time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 紧急报告 -->
          <div v-if="recentEmergencyReports.length > 0" class="emergency-reports-card">
            <div class="card-header">
              <span>紧急报告</span>
              <el-button type="text" size="small" @click="$router.push('/user-reports')">查看全部</el-button>
            </div>
            <div class="reports-list">
              <div 
                v-for="report in recentEmergencyReports.slice(0, 3)" 
                :key="report.id" 
                class="report-item"
                @click="$router.push(`/user-reports/${report.id}`)"
              >
                <el-tag type="danger" size="small">紧急</el-tag>
                <div class="report-content">
                  <div class="report-title">{{ report.title || '用户报告' }}</div>
                  <div class="report-time">{{ formatTime(report.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 数据可视化图表区域 -->
      <el-row :gutter="16" style="margin-top: 16px;">
        <!-- 风险等级分布 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>风险等级分布</span>
            </template>
            <div ref="riskLevelChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <!-- 系统数据概览 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>系统数据概览</span>
            </template>
            <div ref="statsChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>

        <!-- 监测站类型分布 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>监测站类型分布</span>
            </template>
            <div ref="stationTypeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行图表 -->
      <el-row :gutter="16" style="margin-top: 16px;">
        <!-- 用户报告类型统计 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>用户报告类型统计</span>
            </template>
            <div ref="reportTypeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>

        <!-- 预警趋势 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>灾害类型分布</span>
            </template>
            <div ref="disasterTypeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Refresh, Monitor, Warning, MapLocation, House 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import MapComponent from '@/components/MapComponent.vue'
import { dashboardApi } from '@/api/modules/dashboard'
import type { DashboardStats, RiskLevelStats, SystemStatus, RecentWarning } from '@/api/modules/dashboard'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { userReportsApi } from '@/api/modules/user-reports'
import { monitoringStationsApi, monitoringStationsApiExtended } from '@/api/modules/monitoring'
import { weatherApi } from '@/api/modules/weather'
import type { CurrentWeather } from '@/api/modules/weather'
import { disasterTypesApi } from '@/api/modules/disaster-types'

// 路由
const router = useRouter()
const { handleApiError } = useErrorHandler()

// 响应式数据
const currentTime = ref('')
const loading = ref(false)
const dashboardStats = ref<DashboardStats>({
  totalZones: 0,
  activeWarnings: 0,
  onlineStations: 0,
  riskAssessments: 0,
  totalShelters: 0,
  totalUsers: 0,
  totalReports: 0
})
const riskLevelStats = ref<RiskLevelStats>({
  level1: 0,
  level2: 0,
  level3: 0,
  level4: 0,
  level5: 0,
  total: 0
})
const systemStatus = ref<SystemStatus>({
  monitoring: { 
    status: 'normal', 
    onlineStations: 0,
    totalStations: 0,
    lastUpdateTime: new Date().toISOString()
  },
  warning: { 
    status: 'normal', 
    activeWarnings: 0,
    totalWarnings: 0,
    lastIssueTime: new Date().toISOString()
  },
  dataSync: { 
    status: 'normal', 
    lastSyncTime: new Date().toISOString(),
    syncInterval: 300
  },
  mapService: { 
    status: 'normal', 
    responseTime: 100,
    availability: 99.9
  }
})
const recentWarnings = ref<RecentWarning[]>([])
const recentEmergencyReports = ref<any[]>([])
const stationStats = ref<any>(null)
const maintenanceWarning = ref(false)
const weatherData = ref<CurrentWeather | null>(null)

// 图表ref
const riskLevelChartRef = ref<HTMLDivElement>()
const statsChartRef = ref<HTMLDivElement>()
const stationTypeChartRef = ref<HTMLDivElement>()
const reportTypeChartRef = ref<HTMLDivElement>()
const disasterTypeChartRef = ref<HTMLDivElement>()

let riskLevelChart: ECharts | null = null
let statsChart: ECharts | null = null
let stationTypeChart: ECharts | null = null
let reportTypeChart: ECharts | null = null
let disasterTypeChart: ECharts | null = null

// 图表数据
const stationTypeStats = ref<any[]>([])
const reportTypeStats = ref<any[]>([])
const disasterTypeStats = ref<any[]>([])

// 定时器（使用正确的类型）
let timeInterval: ReturnType<typeof setInterval> | null = null
let dataInterval: ReturnType<typeof setInterval> | null = null

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 刷新数据
const refreshData = async () => {
  try {
    loading.value = true
    
    // 并行获取所有数据（包含新增的统计API）
    const [
      statsRes, 
      riskLevelsRes, 
      warningsRes, 
      statusRes,
      emergencyReportsRes,
      stationStatsRes
    ] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRiskLevelStats(),
      dashboardApi.getRecentWarnings(5),
      dashboardApi.getSystemStatus(),
      userReportsApi.getRecentEmergencyReports({ hours: 24, limit: 5 }).catch(() => ({ success: false, data: [] })),
      monitoringStationsApiExtended.getStationStatistics().catch(() => ({ success: false, data: null }))
    ])
    
    if (statsRes.success) {
      dashboardStats.value = statsRes.data
    }
    
    if (riskLevelsRes.success) {
      riskLevelStats.value = riskLevelsRes.data
    }
    
    if (warningsRes.success) {
      recentWarnings.value = warningsRes.data
    }
    
    if (statusRes.success) {
      systemStatus.value = statusRes.data
    }
    
    // 使用新的统计数据（如果可用）
    if (emergencyReportsRes.success && emergencyReportsRes.data) {
      recentEmergencyReports.value = emergencyReportsRes.data
    }
    
    if (stationStatsRes.success && stationStatsRes.data) {
      stationStats.value = stationStatsRes.data
      // 检查是否有维护预警
      maintenanceWarning.value = (stationStatsRes.data.overdue_maintenance || 0) > 0
    }
    
    // 获取额外统计数据用于图表
    await fetchChartStats()
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    handleApiError(error, '获取仪表板数据失败')
    
    // 当后端服务不可用时，设置系统状态为错误
    systemStatus.value = {
      monitoring: { 
        status: 'error', 
        onlineStations: 0,
        totalStations: 0,
        lastUpdateTime: new Date().toISOString()
      },
      warning: { 
        status: 'error', 
        activeWarnings: 0,
        totalWarnings: 0,
        lastIssueTime: new Date().toISOString()
      },
      dataSync: { 
        status: 'error', 
        lastSyncTime: new Date().toISOString(),
        syncInterval: 300
      },
      mapService: { 
        status: 'error', 
        responseTime: 0,
        availability: 0
      }
    }
  } finally {
    loading.value = false
  }
}



// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'normal': return 'success'
    case 'warning': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'normal': return '正常'
    case 'warning': return '警告'
    case 'error': return '错误'
    default: return '未知'
  }
}



// 获取预警等级类型
const getWarningLevelType = (level: number) => {
  switch (level) {
    case 1: return 'info'
    case 2: return 'success'
    case 3: return 'warning'
    case 4: return 'danger'
    case 5: return 'danger'
    default: return 'info'
  }
}

// 获取预警等级文本
const getWarningLevelText = (level: number) => {
  switch (level) {
    case 1: return '蓝色'
    case 2: return '黄色'
    case 3: return '橙色'
    case 4: return '红色'
    default: return '未知'
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 查看预警详情
const viewWarningDetail = (id: number) => {
  // 跳转到预警详情页面
  router.push(`/warnings/${id}`)
}

// 获取天气数据
const fetchWeatherData = async () => {
  try {
    // 使用默认位置（可以从系统配置或用户设置获取）
    // 这里使用示例坐标，实际应该从配置中读取
    const response = await weatherApi.getCurrentWeather({
      latitude: 39.9042,  // 北京示例坐标
      longitude: 116.4074
    })
    
    if (response.success && response.data) {
      weatherData.value = response.data
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    // 静默失败，不影响主要功能
  }
}

// 刷新天气数据
const refreshWeather = () => {
  fetchWeatherData()
  ElMessage.success('天气数据已刷新')
}

// 获取图表统计数据
// 监测站类型中英文映射
const stationTypeMap: Record<string, string> = {
  'rainfall': '雨量站',
  'slope': '坡面监测站',
  'groundwater': '地下水监测站',
  'seismic': '地震监测站',
  'water_level': '水位监测站',
  'weather': '气象站',
  'wind': '风力监测站',
  'soil_moisture': '土壤湿度监测站'
}

// 报告类型中英文映射
const reportTypeMap: Record<string, string> = {
  'public_report': '公众报告',
  'field_witness': '现场目击',
  'equipment_alarm': '设备告警',
  'infrastructure': '基础设施'
}

const fetchChartStats = async () => {
  try {
    // 获取监测站列表并统计类型
    const stationsRes = await monitoringStationsApi.getStations({ page: 1, limit: 1000 }).catch(() => ({ success: false, data: [] }))
    
    if (stationsRes.success && stationsRes.data && Array.isArray(stationsRes.data)) {
      // 统计监测站类型
      const typeMap = new Map<string, number>()
      stationsRes.data.forEach((station: any) => {
        const typeName = station.station_type || station.type_name || '未知'
        const displayName = stationTypeMap[typeName] || typeName
        typeMap.set(displayName, (typeMap.get(displayName) || 0) + 1)
      })
      
      stationTypeStats.value = Array.from(typeMap.entries()).map(([name, count]) => ({
        type_name: name,
        name: name,
        count: count
      }))
    }
    
    // 获取报告类型统计
    const reportTypeRes = await userReportsApi.getReportTypeStats().catch(() => ({ success: false, data: [] }))
    if (reportTypeRes.success && reportTypeRes.data) {
      reportTypeStats.value = reportTypeRes.data.map((item: any) => ({
        ...item,
        report_type: reportTypeMap[item.report_type] || item.report_type
      }))
    }
    
    // 获取灾害类型
    const disasterTypeRes = await disasterTypesApi.getDisasterTypes({ page: 1, limit: 100 }).catch(() => ({ success: false, data: [] }))
    if (disasterTypeRes.success && disasterTypeRes.data) {
      disasterTypeStats.value = Array.isArray(disasterTypeRes.data) ? disasterTypeRes.data : []
    }
  } catch (error) {
    console.error('获取图表统计数据失败:', error)
    // 静默失败，不影响主要功能
  }
}

// 初始化风险等级分布图表
const initRiskLevelChart = () => {
  if (!riskLevelChartRef.value) return
  
  riskLevelChart = echarts.init(riskLevelChartRef.value)
  updateRiskLevelChart()
}

// 更新风险等级分布图表
const updateRiskLevelChart = () => {
  if (!riskLevelChart) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: riskLevelStats.value.level1, name: '低风险', itemStyle: { color: '#67c23a' } },
          { value: riskLevelStats.value.level2, name: '较低风险', itemStyle: { color: '#409eff' } },
          { value: riskLevelStats.value.level3, name: '中等风险', itemStyle: { color: '#e6a23c' } },
          { value: riskLevelStats.value.level4, name: '较高风险', itemStyle: { color: '#f56c6c' } },
          { value: riskLevelStats.value.level5, name: '高风险', itemStyle: { color: '#c0392b' } }
        ]
      }
    ]
  }
  
  riskLevelChart.setOption(option)
}

// 初始化系统统计图表
const initStatsChart = () => {
  if (!statsChartRef.value) return
  
  statsChart = echarts.init(statsChartRef.value)
  updateStatsChart()
}

// 更新系统统计图表
const updateStatsChart = () => {
  if (!statsChart) return
  
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
      data: ['风险区域', '活跃预警', '在线监测站', '避难场所', '用户报告']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [
          { value: dashboardStats.value.totalZones, itemStyle: { color: '#ff6b6b' } },
          { value: dashboardStats.value.activeWarnings, itemStyle: { color: '#feca57' } },
          { value: systemStatus.value.monitoring.onlineStations, itemStyle: { color: '#48dbfb' } },
          { value: dashboardStats.value.totalShelters, itemStyle: { color: '#1dd1a1' } },
          { value: dashboardStats.value.totalReports || 0, itemStyle: { color: '#5f27cd' } }
        ],
        barWidth: '60%',
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  statsChart.setOption(option)
}

// 初始化监测站类型分布图表
const initStationTypeChart = () => {
  if (!stationTypeChartRef.value) return
  stationTypeChart = echarts.init(stationTypeChartRef.value)
  updateStationTypeChart()
}

// 更新监测站类型分布图表
const updateStationTypeChart = () => {
  if (!stationTypeChart) return
  
  // 如果没有数据，显示提示信息
  if (!stationTypeStats.value.length) {
    const option = {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        color: '#909399',
        fontSize: 14
      }
    }
    stationTypeChart.setOption(option)
    return
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stationTypeStats.value.map((item: any) => item.type_name || item.name || '未知'),
      axisLabel: {
        rotate: 45,
        fontSize: 12,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '监测站数量',
        type: 'bar',
        data: stationTypeStats.value.map((item: any) => item.count || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  }
  
  stationTypeChart.setOption(option)
}

// 初始化报告类型统计图表
const initReportTypeChart = () => {
  if (!reportTypeChartRef.value) return
  reportTypeChart = echarts.init(reportTypeChartRef.value)
  updateReportTypeChart()
}

// 更新报告类型统计图表
const updateReportTypeChart = () => {
  if (!reportTypeChart) return
  
  // 如果没有数据，显示提示信息
  if (!reportTypeStats.value.length) {
    const option = {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        color: '#909399',
        fontSize: 14
      }
    }
    reportTypeChart.setOption(option)
    return
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: reportTypeStats.value.map((item: any) => item.report_type || '未知'),
      axisLabel: {
        rotate: 45,
        fontSize: 12,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '报告数量',
        type: 'bar',
        data: reportTypeStats.value.map((item: any) => item.count || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 0.5, color: '#5daf34' },
            { offset: 1, color: '#5daf34' }
          ])
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  }
  
  reportTypeChart.setOption(option)
}

// 初始化灾害类型分布图表
const initDisasterTypeChart = () => {
  if (!disasterTypeChartRef.value) return
  disasterTypeChart = echarts.init(disasterTypeChartRef.value)
  updateDisasterTypeChart()
}

// 更新灾害类型分布图表
const updateDisasterTypeChart = () => {
  if (!disasterTypeChart || !disasterTypeStats.value.length) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    series: [
      {
        name: '灾害类型',
        type: 'pie',
        radius: ['40%', '70%'],
        data: disasterTypeStats.value.map((item: any) => ({
          value: Math.floor(Math.random() * 100) + 10, // 示例数据，实际应从后端获取统计
          name: item.name,
          itemStyle: {
            color: item.color_code || '#409eff'
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  disasterTypeChart.setOption(option)
}

// 组件挂载
onMounted(async () => {
  // 立即更新时间
  updateCurrentTime()
  // 设置时间更新定时器
  timeInterval = setInterval(updateCurrentTime, 1000)
  
  // 获取初始数据
  await refreshData()
  
  // 获取天气数据
  fetchWeatherData()
  
  // 等待DOM渲染完成后初始化图表
  await nextTick()
  initRiskLevelChart()
  initStatsChart()
  initStationTypeChart()
  initReportTypeChart()
  initDisasterTypeChart()
  
  // 设置数据更新定时器（每30秒更新一次）
  dataInterval = setInterval(async () => {
    await refreshData()
    updateRiskLevelChart()
    updateStatsChart()
    updateStationTypeChart()
    updateReportTypeChart()
    updateDisasterTypeChart()
  }, 30000)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    riskLevelChart?.resize()
    statsChart?.resize()
    stationTypeChart?.resize()
    reportTypeChart?.resize()
    disasterTypeChart?.resize()
  })
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (dataInterval) {
    clearInterval(dataInterval)
  }
  
  // 销毁图表实例
  if (riskLevelChart && !riskLevelChart.isDisposed()) riskLevelChart.dispose()
  if (statsChart && !statsChart.isDisposed()) statsChart.dispose()
  if (stationTypeChart && !stationTypeChart.isDisposed()) stationTypeChart.dispose()
  if (reportTypeChart && !reportTypeChart.isDisposed()) reportTypeChart.dispose()
  if (disasterTypeChart && !disasterTypeChart.isDisposed()) disasterTypeChart.dispose()
  
  // 移除窗口监听
  window.removeEventListener('resize', () => {
    riskLevelChart?.resize()
    statsChart?.resize()
    stationTypeChart?.resize()
    reportTypeChart?.resize()
    disasterTypeChart?.resize()
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  height: calc(100vh - 60px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 统计概览 */
.stats-overview {
  margin-bottom: 20px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  height: 80px;
}

.stats-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.stats-icon.risk-zones {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.stats-icon.warnings {
  background: linear-gradient(135deg, #feca57, #ff9ff3);
}

.stats-icon.monitoring {
  background: linear-gradient(135deg, #48dbfb, #0abde3);
}

.stats-icon.shelters {
  background: linear-gradient(135deg, #1dd1a1, #10ac84);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

/* 主要内容区域 */
.main-content {
  margin-top: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content .el-row {
  flex: 1;
  display: flex;
}

.main-content .el-col {
  display: flex;
  flex-direction: column;
}

.map-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.map-container {
  flex: 1;
  height: 100%;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  color: #303133;
}

/* 系统状态 */
.status-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  height: 180px;
  display: flex;
  flex-direction: column;
}

.status-list {
  flex: 1;
  padding: 0 20px 16px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.status-indicator.normal {
  background-color: #67c23a;
}

.status-indicator.warning {
  background-color: #e6a23c;
}

.status-indicator.error {
  background-color: #f56c6c;
}

.status-item span {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

/* 预警列表 */
.warnings-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 420px;
  display: flex;
  flex-direction: column;
}

.warnings-list {
  flex: 1;
  padding: 0 20px 16px;
  overflow-y: auto;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.warning-item:hover {
  background-color: #f5f7fa;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.warning-item:last-child {
  border-bottom: none;
}

.warning-content {
  flex: 1;
  margin-left: 8px;
}

.warning-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  font-weight: 500;
  line-height: 1.4;
}

.warning-time {
  font-size: 12px;
  color: #909399;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

/* 紧急报告卡片 */
.emergency-reports-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 16px;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.reports-list {
  flex: 1;
  padding: 0 20px 16px;
  overflow-y: auto;
}

.report-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.report-item:hover {
  background-color: #fef0f0;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.report-item:last-child {
  border-bottom: none;
}

.report-content {
  flex: 1;
  margin-left: 8px;
}

.report-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  font-weight: 500;
  line-height: 1.4;
}

.report-time {
  font-size: 12px;
  color: #909399;
}

.status-item.warning {
  background-color: #fef0f0;
  padding: 8px;
  border-radius: 4px;
  margin: -4px 0;
}

/* 图表卡片 */
.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  color: #303133;
}

.chart-card :deep(.el-card__body) {
  padding: 20px;
}

/* 天气卡片 */
.weather-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.weather-content {
  flex: 1;
  padding: 0 16px 12px;
}

.weather-info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}

.weather-info-item:last-child {
  border-bottom: none;
}

.weather-info-item label {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
  min-width: 45px;
}

.weather-info-item span {
  font-size: 13px;
  color: #606266;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 53px);
}

.weather-info-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>