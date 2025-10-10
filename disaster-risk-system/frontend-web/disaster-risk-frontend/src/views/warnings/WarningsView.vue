<template>
  <div class="warnings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>预警管理</h2>
        <p>发布和管理各类灾害预警信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          发布预警
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 预警统计 -->
    <div class="warning-stats">
      <div class="stat-card active">
        <div class="stat-icon">
          <el-icon size="24"><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ activeWarnings }}</div>
          <div class="stat-label">活跃预警</div>
        </div>
      </div>
      <div class="stat-card high">
        <div class="stat-icon">
          <el-icon size="24"><WarnTriangleFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ highLevelWarnings }}</div>
          <div class="stat-label">高级预警</div>
        </div>
      </div>
      <div class="stat-card today">
        <div class="stat-icon">
          <el-icon size="24"><Bell /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ todayWarnings }}</div>
          <div class="stat-label">今日预警</div>
        </div>
      </div>
      <div class="stat-card total">
        <div class="stat-icon">
          <el-icon size="24"><DataAnalysis /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalWarnings }}</div>
          <div class="stat-label">总预警数</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="预警标题">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入预警标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="预警等级">
          <el-select
            v-model="queryParams.warning_level"
            placeholder="请选择预警等级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="level in warningLevels"
              :key="level.id"
              :label="level.name"
              :value="level.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预警状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择预警状态"
            clearable
            style="width: 120px"
          >
            <el-option label="活跃" value="active" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已过期" value="expired" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="灾害类型">
          <el-select
            v-model="queryParams.disaster_type_id"
            placeholder="请选择灾害类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="type in disasterTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险区域">
          <el-select
            v-model="queryParams.zone_id"
            placeholder="请选择风险区域"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="zone in riskZones"
              :key="zone.id"
              :label="zone.name"
              :value="zone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadWarnings">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="warnings"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="warning_id" label="预警编号" width="120" />
        <el-table-column prop="title" label="预警标题" min-width="200" />
        <el-table-column prop="warning_level" label="预警等级" width="100">
          <template #default="{ row }">
            <el-tag
              :color="getWarningLevelColor(row.warning_level)"
              effect="dark"
              size="small"
            >
              {{ getWarningLevelText(row.warning_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="disaster_type" label="灾害类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getDisasterTypeName(row.disaster_type_id) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="zone_name" label="风险区域" width="150">
          <template #default="{ row }">
            {{ getZoneName(row.zone_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="evacuation_required" label="疏散要求" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.evacuation_required ? 'danger' : 'info'"
              size="small"
            >
              {{ row.evacuation_required ? '需要疏散' : '无需疏散' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="issue_time" label="发布时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.issue_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiry_time" label="过期时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.expiry_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="viewDetail(row)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.status === 'active'"
                type="warning"
                size="small"
                @click="updateWarning(row)"
              >
                更新
              </el-button>
              <el-button
                v-if="row.status === 'active'"
                type="danger"
                size="small"
                @click="cancelWarning(row.id)"
              >
                取消
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="editWarning(row)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadWarnings"
          @current-change="loadWarnings"
        />
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedRows.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedRows.length} 项`"
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="batch-buttons">
            <el-button size="small" @click="batchCancel">
              <el-icon><CircleClose /></el-icon>
              批量取消
            </el-button>
            <el-button size="small" @click="batchExport">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-popconfirm
              title="确定要删除选中的预警吗？"
              @confirm="batchDelete"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  批量删除
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingWarning ? '编辑预警' : '发布预警'"
      width="900px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预警编号" prop="warning_id">
              <el-input v-model="formData.warning_id" placeholder="请输入预警编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警等级" prop="warning_level">
              <el-select v-model="formData.warning_level" placeholder="请选择预警等级" style="width: 100%">
                <el-option
                  v-for="level in warningLevels"
                  :key="level.id"
                  :label="level.name + '预警'"
                  :value="level.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="风险区域" prop="zone_id">
              <el-select v-model="formData.zone_id" placeholder="请选择风险区域" style="width: 100%">
                <el-option
                  v-for="zone in riskZones"
                  :key="zone.id"
                  :label="zone.name"
                  :value="zone.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灾害类型" prop="disaster_type_id">
              <el-select v-model="formData.disaster_type_id" placeholder="请选择灾害类型" style="width: 100%">
                <el-option
                  v-for="type in disasterTypes"
                  :key="type.id"
                  :label="type.name"
                  :value="type.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="预警标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入预警标题" />
        </el-form-item>
        
        <el-form-item label="预警内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的预警内容"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效时间" prop="effective_time">
              <el-date-picker
                v-model="formData.effective_time"
                type="datetime"
                placeholder="选择生效时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expiry_time">
              <el-date-picker
                v-model="formData.expiry_time"
                type="datetime"
                placeholder="选择过期时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="疏散要求">
          <el-switch
            v-model="formData.evacuation_required"
            active-text="需要疏散"
            inactive-text="无需疏散"
          />
        </el-form-item>
        
        <el-form-item label="应急措施">
          <el-input
            v-model="formData.emergency_measures"
            type="textarea"
            :rows="3"
            placeholder="请输入应急措施建议"
          />
        </el-form-item>
        
        <el-form-item label="联系方式">
          <el-input
            v-model="formData.contact_info"
            placeholder="请输入应急联系方式"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingWarning ? '更新预警' : '发布预警' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="预警详情"
      width="900px"
    >
      <div v-if="currentWarning" class="warning-detail">
        <div class="warning-header">
          <div class="warning-title">
            <h3>{{ currentWarning.title }}</h3>
            <el-tag
              :color="getWarningLevelColor(currentWarning.warning_level)"
              effect="dark"
              size="large"
            >
              {{ getWarningLevelText(currentWarning.warning_level) }}
            </el-tag>
          </div>
          <div class="warning-meta">
            <el-tag
              :type="getStatusType(currentWarning.status)"
              size="small"
            >
              {{ getStatusText(currentWarning.status) }}
            </el-tag>
            <span class="warning-id">编号: {{ currentWarning.warning_id }}</span>
          </div>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险区域">{{ getZoneName(currentWarning.zone_id) }}</el-descriptions-item>
          <el-descriptions-item label="灾害类型">{{ getDisasterTypeName(currentWarning.disaster_type_id) }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDateTime(currentWarning.issue_time) }}</el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ currentWarning.effective_time ? formatDateTime(currentWarning.effective_time) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ currentWarning.expiry_time ? formatDateTime(currentWarning.expiry_time) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="疏散要求">
            <el-tag
              :type="currentWarning.evacuation_required ? 'danger' : 'info'"
              size="small"
            >
              {{ currentWarning.evacuation_required ? '需要疏散' : '无需疏散' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新序号">第 {{ currentWarning.update_sequence }} 次</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentWarning.created_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="warning-content-section">
          <h4>预警内容</h4>
          <div class="content-text">{{ currentWarning.content }}</div>
        </div>
        
        <div v-if="currentWarning.emergency_measures" class="emergency-section">
          <h4>应急措施</h4>
          <div class="content-text">{{ currentWarning.emergency_measures }}</div>
        </div>
        
        <div v-if="currentWarning.contact_info" class="contact-section">
          <h4>联系方式</h4>
          <div class="content-text">{{ currentWarning.contact_info }}</div>
        </div>
        
        <!-- 预警历史 -->
        <div class="warning-history">
          <h4>更新历史</h4>
          <el-timeline>
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
        </div>
      </div>
    </el-dialog>

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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { Warning, RiskZone, DisasterType } from '../../types'
import {
  formatDateTime,
  getWarningLevelColor,
  getWarningLevelText
} from '../../utils'
import { warningsApi, riskZonesApi, disasterTypesApi, systemConfigApi } from '../../api'
import {
  Plus,
  Refresh,
  Search,
  WarnTriangleFilled,
  Bell,
  DataAnalysis,
  CircleClose,
  Download,
  Delete
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showUpdateDialog = ref(false)
const editingWarning = ref<Warning | null>(null)
const currentWarning = ref<Warning | null>(null)
const selectedRows = ref<Warning[]>([])
const formRef = ref<FormInstance>()
const updateFormRef = ref<FormInstance>()

// 数据列表
const warnings = ref<Warning[]>([])
const riskZones = ref<RiskZone[]>([])
const disasterTypes = ref<DisasterType[]>([])
const warningLevels = ref<any[]>([])
const warningHistory = ref<any[]>([])
const total = ref(0)

// 统计数据
const activeWarnings = computed(() => 
  warnings.value.filter(w => w.status === 'active').length
)
const highLevelWarnings = computed(() => 
  warnings.value.filter(w => w.warning_level >= 3 && w.status === 'active').length
)
const todayWarnings = computed(() => {
  const today = new Date().toDateString()
  return warnings.value.filter(w => {
    const issueDate = new Date(w.issue_time).toDateString()
    return issueDate === today
  }).length
})
const totalWarnings = computed(() => warnings.value?.length || 0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  title: '',
  warning_level: undefined as number | undefined,
  status: undefined as 'active' | 'expired' | 'cancelled' | undefined,
  disaster_type_id: undefined as number | undefined,
  zone_id: undefined as number | undefined
})

// 表单数据
const formData = reactive({
  warning_id: '',
  zone_id: undefined as number | undefined,
  disaster_type_id: undefined as number | undefined,
  warning_level: undefined as number | undefined,
  title: '',
  content: '',
  effective_time: '',
  expiry_time: '',
  evacuation_required: false,
  emergency_measures: '',
  contact_info: ''
})

// 更新数据
const updateData = reactive({
  content: '',
  expiry_time: '',
  warning_level: undefined as number | undefined
})

// 表单验证规则
const formRules = {
  warning_id: [
    { required: true, message: '请输入预警编号', trigger: 'blur' }
  ],
  zone_id: [
    { required: true, message: '请选择风险区域', trigger: 'change' }
  ],
  disaster_type_id: [
    { required: true, message: '请选择灾害类型', trigger: 'change' }
  ],
  warning_level: [
    { required: true, message: '请选择预警等级', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入预警标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入预警内容', trigger: 'blur' }
  ],
  effective_time: [
    { required: true, message: '请选择生效时间', trigger: 'change' }
  ],
  expiry_time: [
    { required: true, message: '请选择过期时间', trigger: 'change' }
  ]
}

// 更新验证规则
const updateRules = {
  content: [
    { required: true, message: '请输入更新内容', trigger: 'blur' }
  ]
}

// 获取灾害类型名称
const getDisasterTypeName = (typeId: number): string => {
  const type = disasterTypes.value.find(t => t.id === typeId)
  return type ? type.name : '未知'
}

// 获取区域名称
const getZoneName = (zoneId: number | undefined): string => {
  if (!zoneId) return '未知区域'
  const zone = riskZones.value.find(z => z.id === zoneId)
  return zone ? zone.name : '未知区域'
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

// 加载预警列表
const loadWarnings = async () => {
  loading.value = true
  try {
    const response = await warningsApi.getWarnings(queryParams)
    if (response.success) {
      warnings.value = response.data
      total.value = response.pagination.total
    } else {
      ElMessage.error('获取预警列表失败')
    }
  } catch (error) {
    console.error('加载预警列表失败:', error)
    ElMessage.error('加载数据失败')
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

// 刷新数据
const refreshData = () => {
  loadWarnings()
  ElMessage.success('数据已刷新')
}

// 重置查询条件
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    limit: 20,
    title: '',
    warning_level: undefined,
    status: undefined,
    disaster_type_id: undefined,
    zone_id: undefined
  })
  loadWarnings()
}

// 选择变化处理
const handleSelectionChange = (selection: Warning[]) => {
  selectedRows.value = selection
}

// 查看详情
const viewDetail = async (warning: Warning) => {
  currentWarning.value = warning
  showDetailDialog.value = true
  
  // 预警历史暂时为空
  warningHistory.value = []
}

// 更新预警
const updateWarning = (warning: Warning) => {
  currentWarning.value = warning
  Object.assign(updateData, {
    content: '',
     expiry_time: '',
     warning_level: undefined
  })
  showUpdateDialog.value = true
}

// 取消预警
const cancelWarning = async (id: number) => {
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
    
    // 调用API取消预警
    const result = await warningsApi.cancelWarning(id)
    if (result.success) {
      ElMessage.success('预警已取消')
      loadWarnings()
    } else {
      ElMessage.error('取消失败')
    }
  } catch (error) {
    console.error('取消预警失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 编辑预警
const editWarning = (warning: Warning) => {
  editingWarning.value = warning
  Object.assign(formData, {
    warning_id: warning.warning_id,
    zone_id: warning.zone_id,
    disaster_type_id: warning.disaster_type_id,
    warning_level: warning.warning_level,
    title: warning.title,
    content: warning.content,
    effective_time: warning.effective_time,
    expiry_time: warning.expiry_time,
    evacuation_required: warning.evacuation_required,
    emergency_measures: warning.emergency_measures,
    contact_info: warning.contact_info
  })
  showCreateDialog.value = true
}

// 批量取消
const batchCancel = async () => {
  try {
    const activeWarnings = selectedRows.value.filter(w => w.status === 'active')
    if (activeWarnings.length === 0) {
      ElMessage.warning('没有可取消的活跃预警')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要取消选中的 ${activeWarnings.length} 个活跃预警吗？`,
      '确认批量取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量取消预警
    const promises = activeWarnings.map(warning => warningsApi.cancelWarning(warning.id))
    const results = await Promise.allSettled(promises)
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`成功取消 ${successCount} 个预警`)
    } else {
      ElMessage.warning(`${successCount} 个取消成功，${failCount} 个取消失败`)
    }
    
    selectedRows.value = []
    loadWarnings()
  } catch (error) {
    console.error('批量取消失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('批量取消失败')
    }
  }
}

// 批量导出
const batchExport = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要导出的预警')
      return
    }
    
    const ids = selectedRows.value.map(row => row.id)
    
    const blob = await warningsApi.exportWarnings({ ids })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `预警数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedRows.value.length} 个预警数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要删除的预警')
      return
    }
    
    const ids = selectedRows.value.map(row => row.id)
    
    // 批量删除预警
    const promises = ids.map(id => warningsApi.deleteWarning(id))
    const results = await Promise.allSettled(promises)
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`成功删除 ${successCount} 个预警`)
    } else {
      ElMessage.warning(`${successCount} 个删除成功，${failCount} 个删除失败`)
    }
    
    selectedRows.value = []
    loadWarnings()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 重置表单
const resetForm = () => {
  editingWarning.value = null
  Object.assign(formData, {
    warning_id: '',
    zone_id: undefined,
    disaster_type_id: undefined,
    warning_level: undefined,
    title: '',
    content: '',
    effective_time: '',
    expiry_time: '',
    evacuation_required: false,
    emergency_measures: '',
    contact_info: ''
  })
  formRef.value?.resetFields()
}



// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (editingWarning.value) {
      await warningsApi.updateWarning(editingWarning.value.id, formData)
      ElMessage.success('预警更新成功')
    } else {
      await warningsApi.createWarning(formData)
      ElMessage.success('预警发布成功')
    }
    
    showCreateDialog.value = false
    resetForm()
    loadWarnings()
  } catch (error) {
    console.error('提交失败:', error)
    if (error !== false) { // 不是验证失败
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 提交更新
const submitUpdate = async () => {
  if (!updateFormRef.value) return
  
  try {
    await updateFormRef.value.validate()
    submitting.value = true
    
    if (!currentWarning.value) {
      ElMessage.error('未找到要更新的预警信息')
      return
    }
    
    await warningsApi.updateWarning(currentWarning.value.id, updateData)
    ElMessage.success('预警更新已发布')
    showUpdateDialog.value = false
    loadWarnings()
  } catch (error) {
    console.error('更新失败:', error)
    if (error !== false) { // 不是验证失败
      ElMessage.error('更新失败')
    }
  } finally {
    submitting.value = false
  }
}

// 组件挂载
onMounted(() => {
  loadBaseData()
  loadWarnings()
})
</script>

<style scoped>
.warnings-container {
  padding: 20px;
}

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
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.warning-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
}

.stat-card.active .stat-icon {
  background: #e6a23c;
}

.stat-card.high .stat-icon {
  background: #f56c6c;
}

.stat-card.today .stat-icon {
  background: #409eff;
}

.stat-card.total .stat-icon {
  background: #67c23a;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #e4e7ed;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 400px;
}

.batch-buttons {
  margin-top: 8px;
}

.batch-buttons .el-button {
  margin-right: 8px;
}

.warning-detail {
  padding: 20px 0;
}

.warning-header {
  margin-bottom: 20px;
}

.warning-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.warning-title h3 {
  margin: 0;
  color: #303133;
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

.warning-content-section,
.emergency-section,
.contact-section {
  margin-top: 24px;
}

.warning-content-section h4,
.emergency-section h4,
.contact-section h4,
.warning-history h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.content-text {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
}

.warning-history {
  margin-top: 30px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .warnings-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .warning-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .filter-section .el-form {
    display: block;
  }
  
  .filter-section .el-form-item {
    display: block;
    margin-bottom: 16px;
  }
  
  .batch-actions {
    left: 10px;
    right: 10px;
    transform: none;
    min-width: auto;
  }
  
  .warning-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>