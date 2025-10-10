<template>
  <div class="warning-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </el-button>
        <h2>预警详情</h2>
      </div>
      <div class="header-right" v-if="warning && warning.status === 'active'">
        <el-button type="warning" @click="showUpdateDialog = true">
          <el-icon><Edit /></el-icon>
          更新预警
        </el-button>
        <el-button type="danger" @click="handleCancelWarning">
          <el-icon><CircleClose /></el-icon>
          取消预警
        </el-button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    
    <!-- 预警内容 -->
    <div v-else-if="warning" class="warning-content">
      <!-- 预警标题卡片 -->
      <el-card class="warning-header-card">
        <div class="warning-header">
          <div class="warning-title">
            <h3>{{ warning.title }}</h3>
            <el-tag
              :color="getWarningLevelColor(warning.warning_level)"
              effect="dark"
              size="large"
            >
              {{ getWarningLevelText(warning.warning_level) }}
            </el-tag>
          </div>
          <div class="warning-meta">
            <el-tag
              :type="getStatusType(warning.status)"
              size="small"
            >
              {{ getStatusText(warning.status) }}
            </el-tag>
            <span class="warning-id">编号: {{ warning.warning_id }}</span>
          </div>
        </div>
      </el-card>

      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预警编号">{{ warning.warning_id }}</el-descriptions-item>
          <el-descriptions-item label="预警等级">
            <el-tag :color="getWarningLevelColor(warning.warning_level)" effect="dark">
              {{ getWarningLevelText(warning.warning_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险区域">{{ getZoneName(warning.zone_id) }}</el-descriptions-item>
          <el-descriptions-item label="灾害类型">{{ getDisasterTypeName(warning.disaster_type_id) }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDateTime(warning.issue_time) }}</el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ warning.effective_time ? formatDateTime(warning.effective_time) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ warning.expiry_time ? formatDateTime(warning.expiry_time) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="疏散要求">
            <el-tag
              :type="warning.evacuation_required ? 'danger' : 'info'"
              size="small"
            >
              {{ warning.evacuation_required ? '需要疏散' : '无需疏散' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新序号">第 {{ warning.update_sequence || 1 }} 次</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(warning.status)">
              {{ getStatusText(warning.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 预警内容 -->
      <el-card class="content-card">
        <template #header>
          <span>预警内容</span>
        </template>
        <div class="content-text">{{ warning.content }}</div>
      </el-card>

      <!-- 应急措施 -->
      <el-card class="emergency-card" v-if="warning.emergency_measures">
        <template #header>
          <span>应急措施</span>
        </template>
        <div class="content-text">{{ warning.emergency_measures }}</div>
      </el-card>

      <!-- 联系方式 -->
      <el-card class="contact-card" v-if="warning.contact_info">
        <template #header>
          <span>应急联系方式</span>
        </template>
        <div class="content-text">{{ warning.contact_info }}</div>
      </el-card>

      <!-- 受影响区域地图 -->
      <el-card class="map-card" v-if="warning.affected_area">
        <template #header>
          <span>受影响区域</span>
        </template>
        <div class="map-container">
          <MapComponent :height="'400px'" />
        </div>
      </el-card>

      <!-- 更新历史 -->
      <el-card class="history-card">
        <template #header>
          <div class="card-header">
            <span>更新历史</span>
            <el-button type="text" size="small" @click="loadHistory">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        <el-timeline v-if="warningHistory.length > 0">
          <el-timeline-item
            v-for="(history, index) in warningHistory"
            :key="index"
            :timestamp="formatDateTime(history.timestamp)"
            placement="top"
          >
            <div class="history-item">
              <div class="history-action">{{ history.action }}</div>
              <div class="history-content">{{ history.content }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无更新记录" :image-size="100" />
      </el-card>
    </div>
    
    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-empty description="预警信息不存在">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 更新预警对话框 -->
    <el-dialog
      v-model="showUpdateDialog"
      title="更新预警"
      width="600px"
    >
      <el-form
        ref="updateFormRef"
        :model="updateData"
        :rules="updateRules"
        label-width="120px"
      >
        <el-form-item label="更新内容" prop="content">
          <el-input
            v-model="updateData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入更新内容"
          />
        </el-form-item>
        
        <el-form-item label="延长时间">
          <el-date-picker
            v-model="updateData.expiry_time"
            type="datetime"
            placeholder="选择新的过期时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="新预警等级">
          <el-select v-model="updateData.warning_level" placeholder="请选择新的预警等级" style="width: 100%">
            <el-option label="保持不变" :value="undefined" />
            <el-option
              v-for="level in warningLevels"
              :key="level.id"
              :label="level.name + '预警'"
              :value="level.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUpdateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate" :loading="submitting">
          发布更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { ArrowLeft, Edit, CircleClose, Refresh } from '@element-plus/icons-vue'
import { warningsApi, riskZonesApi, disasterTypesApi, systemConfigApi } from '@/api'
import type { Warning, RiskZone, DisasterType } from '@/types'
import { formatDateTime, getWarningLevelColor, getWarningLevelText } from '@/utils'
import { useErrorHandler } from '@/composables/useErrorHandler'
import MapComponent from '@/components/MapComponent.vue'

const route = useRoute()
const router = useRouter()
const { handleApiError } = useErrorHandler()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const warning = ref<Warning | null>(null)
const riskZones = ref<RiskZone[]>([])
const disasterTypes = ref<DisasterType[]>([])
const warningLevels = ref<any[]>([])
const warningHistory = ref<any[]>([])
const showUpdateDialog = ref(false)
const updateFormRef = ref<FormInstance>()

// 更新表单数据
const updateData = reactive({
  content: '',
  expiry_time: '',
  warning_level: undefined as number | undefined
})

// 更新验证规则
const updateRules = {
  content: [
    { required: true, message: '请输入更新内容', trigger: 'blur' }
  ]
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'success',
    cancelled: 'info',
    expired: 'warning',
    draft: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    cancelled: '已取消',
    expired: '已过期',
    draft: '草稿'
  }
  return statusMap[status] || status
}

// 获取区域名称
const getZoneName = (zoneId: number | undefined): string => {
  if (!zoneId) return '未知区域'
  const zone = riskZones.value.find(z => z.id === zoneId)
  return zone ? zone.name : '未知区域'
}

// 获取灾害类型名称
const getDisasterTypeName = (typeId: number): string => {
  const type = disasterTypes.value.find(t => t.id === typeId)
  return type ? type.name : '未知'
}

// 返回上一页
const goBack = () => {
  router.push('/warnings')
}

// 获取预警详情
const fetchWarningDetail = async () => {
  try {
    loading.value = true
    const warningId = Number(route.params.id)
    
    if (isNaN(warningId)) {
      ElMessage.error('无效的预警ID')
      goBack()
      return
    }

    const response = await warningsApi.getWarning(warningId)
    if (response.success) {
      warning.value = response.data
    } else {
      ElMessage.error('获取预警详情失败')
      goBack()
    }
  } catch (error) {
    handleApiError(error, '获取预警详情失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// 加载基础数据
const loadBaseData = async () => {
  try {
    const [riskZonesResponse, disasterTypesResponse, warningLevelsResponse] = await Promise.all([
      riskZonesApi.getRiskZones(),
      disasterTypesApi.getDisasterTypes(),
      systemConfigApi.getWarningLevels()
    ])
    
    if (riskZonesResponse.success) {
      riskZones.value = riskZonesResponse.data
    }
    
    if (disasterTypesResponse.success) {
      disasterTypes.value = disasterTypesResponse.data
    }
    
    if (warningLevelsResponse.success) {
      warningLevels.value = warningLevelsResponse.data
    }
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载更新历史
const loadHistory = async () => {
  if (!warning.value) return
  
  try {
    const response = await warningsApi.getWarningHistory(warning.value.id)
    if (response.success && response.data) {
      warningHistory.value = response.data.map((item: any) => ({
        timestamp: item.timestamp || item.created_at,
        action: item.action || `第${item.update_sequence}次更新`,
        content: item.content || '预警信息已更新'
      }))
    } else {
      // 降级：显示基础信息
      warningHistory.value = [
        {
          timestamp: warning.value.issue_time || warning.value.created_at,
          action: '预警发布',
          content: `发布${getWarningLevelText(warning.value.warning_level)}预警: ${warning.value.title}`
        }
      ]
      
      if (warning.value.update_sequence && warning.value.update_sequence > 1) {
        warningHistory.value.push({
          timestamp: warning.value.updated_at || warning.value.issue_time,
          action: `第${warning.value.update_sequence}次更新`,
          content: '预警信息已更新'
        })
      }
    }
  } catch (error) {
    console.error('加载历史失败:', error)
    handleApiError(error, '加载历史失败', true) // 静默错误
    // 降级显示基础信息
    warningHistory.value = [
      {
        timestamp: warning.value.issue_time || warning.value.created_at,
        action: '预警发布',
        content: `发布${getWarningLevelText(warning.value.warning_level)}预警`
      }
    ]
  }
}

// 取消预警
const handleCancelWarning = async () => {
  if (!warning.value) return

  try {
    await ElMessageBox.confirm(
      '取消预警后将无法恢复，确定要取消这个预警吗？',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await warningsApi.cancelWarning(warning.value.id)
    if (result.success) {
      ElMessage.success('预警已取消')
      fetchWarningDetail() // 重新加载数据
    } else {
      ElMessage.error('取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      handleApiError(error, '取消预警失败')
    }
  }
}

// 提交更新
const submitUpdate = async () => {
  if (!updateFormRef.value || !warning.value) return
  
  try {
    await updateFormRef.value.validate()
    submitting.value = true
    
    await warningsApi.updateWarning(warning.value.id, updateData)
    ElMessage.success('预警更新已发布')
    showUpdateDialog.value = false
    fetchWarningDetail() // 重新加载数据
  } catch (error) {
    if (error !== false) {
      handleApiError(error, '更新失败')
    }
  } finally {
    submitting.value = false
  }
}

// 组件挂载
onMounted(async () => {
  await loadBaseData()
  await fetchWarningDetail()
  loadHistory() // 加载更新历史
})
</script>

<style scoped>
.warning-detail-container {
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
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 10px;
}

.loading-container {
  padding: 40px;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.warning-header-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.warning-header {
  padding: 10px 0;
}

.warning-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.warning-title h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.warning-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-id {
  font-size: 14px;
  color: #909399;
}

.info-card,
.content-card,
.emergency-card,
.contact-card,
.map-card,
.history-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.content-text {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
  min-height: 60px;
}

.map-container {
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item {
  padding: 8px 0;
}

.history-action {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.history-content {
  color: #606266;
  font-size: 14px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>