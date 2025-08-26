<template>
  <div class="dashboard-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>系统概览</h1>
      <el-button :icon="Refresh" @click="refreshData" size="small">刷新</el-button>
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
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Refresh, Monitor, Warning, MapLocation, House 
} from '@element-plus/icons-vue'
import MapComponent from '@/components/MapComponent.vue'
import { dashboardApi } from '@/api/modules/dashboard'
import type { DashboardStats, RiskLevelStats, SystemStatus, RecentWarning } from '@/api/modules/dashboard'

// 路由
const router = useRouter()

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

// 定时器
let timeInterval: number | null = null
let dataInterval: number | null = null

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
    
    // 并行获取所有数据
    const [statsRes, riskLevelsRes, warningsRes, statusRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRiskLevelStats(),
      dashboardApi.getRecentWarnings(5),
      dashboardApi.getSystemStatus()
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
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('获取仪表板数据失败:', error)
    ElMessage.error('获取仪表板数据失败')
    
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

// 获取仪表板数据
const fetchDashboardData = refreshData



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

// 组件挂载
onMounted(() => {
  // 立即更新时间
  updateCurrentTime()
  // 设置时间更新定时器
  timeInterval = setInterval(updateCurrentTime, 1000)
  
  // 获取初始数据
  fetchDashboardData()
  // 设置数据更新定时器（每30秒更新一次）
  dataInterval = setInterval(fetchDashboardData, 30000)
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (dataInterval) {
    clearInterval(dataInterval)
  }
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
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
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
</style>