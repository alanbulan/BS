<template>
  <div class="risk-assessments-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>风险评估管理</h2>
        <p>管理和查看各区域的风险评估结果</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增评估
        </el-button>
        <el-button type="success" @click="showBatchAssessDialog = true">
          <el-icon><DataAnalysis /></el-icon>
          批量评估
        </el-button>
        <el-button @click="loadAssessments">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><DataBoard /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalAssessments }}</div>
          <div class="stat-label">总评估数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon high-risk">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ highRiskCount }}</div>
          <div class="stat-label">高风险区域</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon medium-risk">
          <el-icon><InfoFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ mediumRiskCount }}</div>
          <div class="stat-label">中风险区域</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon low-risk">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ lowRiskCount }}</div>
          <div class="stat-label">低风险区域</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="风险区域">
          <el-select
            v-model="queryParams.zone_id"
            placeholder="请选择风险区域"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="zone in riskZones"
              :key="zone.id"
              :label="zone.name"
              :value="zone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前风险等级">
          <el-select
            v-model="queryParams.current_risk_level"
            placeholder="请选择风险等级"
            clearable
            style="width: 150px"
          >
            <el-option label="1级 - 很低" :value="1" />
            <el-option label="2级 - 低" :value="2" />
            <el-option label="3级 - 中等" :value="3" />
            <el-option label="4级 - 高" :value="4" />
            <el-option label="5级 - 很高" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估方法">
          <el-select
            v-model="queryParams.assessment_method"
            placeholder="请选择评估方法"
            clearable
            style="width: 150px"
          >
            <el-option label="专家评估" value="expert" />
            <el-option label="模型计算" value="model" />
            <el-option label="历史数据" value="historical" />
            <el-option label="综合评估" value="comprehensive" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAssessments">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="assessments"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="评估ID" width="100" />
        <el-table-column prop="zone_name" label="风险区域" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="viewZoneDetails(row.zone_id)">
              {{ row.zone?.name || `区域${row.zone_id}` }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="assessment_time" label="评估时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.assessment_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="current_risk_level" label="当前风险" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRiskLevelType(row.current_risk_level)"
              size="small"
            >
              {{ getRiskLevelText(row.current_risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="predicted_risk_24h" label="24h预测" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRiskLevelType(row.predicted_risk_24h)"
              size="small"
            >
              {{ getRiskLevelText(row.predicted_risk_24h) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence_score" label="置信度" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.confidence_score * 100)"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="confidence-text">{{ Math.round((row.confidence_score || 0) * 100) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="assessment_method" label="评估方法" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ getMethodText(row.assessment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model_version" label="模型版本" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetails(row)"
            >
              详情
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editAssessment(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除这个评估记录吗？"
              @confirm="deleteAssessment(row.id)"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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
          @size-change="loadAssessments"
          @current-change="loadAssessments"
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
            <el-button size="small" @click="exportSelected">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-popconfirm
              title="确定要删除选中的评估记录吗？"
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
      :title="editingAssessment ? '编辑风险评估' : '新增风险评估'"
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
            <el-form-item label="评估时间" prop="assessment_time">
              <el-date-picker
                v-model="formData.assessment_time"
                type="datetime"
                placeholder="选择评估时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="当前风险等级" prop="current_risk_level">
              <el-select v-model="formData.current_risk_level" placeholder="请选择" style="width: 100%">
                <el-option label="1级 - 很低" :value="1" />
                <el-option label="2级 - 低" :value="2" />
                <el-option label="3级 - 中等" :value="3" />
                <el-option label="4级 - 高" :value="4" />
                <el-option label="5级 - 很高" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="24h预测风险" prop="predicted_risk_24h">
              <el-select v-model="formData.predicted_risk_24h" placeholder="请选择" style="width: 100%">
                <el-option label="1级 - 很低" :value="1" />
                <el-option label="2级 - 低" :value="2" />
                <el-option label="3级 - 中等" :value="3" />
                <el-option label="4级 - 高" :value="4" />
                <el-option label="5级 - 很高" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置信度" prop="confidence_score">
              <el-input-number
                v-model="formData.confidence_score"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评估方法" prop="assessment_method">
              <el-select v-model="formData.assessment_method" placeholder="请选择评估方法" style="width: 100%">
                <el-option label="专家评估" value="expert" />
                <el-option label="模型计算" value="model" />
                <el-option label="历史数据" value="historical" />
                <el-option label="综合评估" value="comprehensive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型版本">
              <el-input v-model="formData.model_version" placeholder="请输入模型版本" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="影响因素">
          <el-input
            v-model="contributingFactorsJson"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的影响因素"
          />
        </el-form-item>
        
        <el-form-item label="天气条件">
          <el-input
            v-model="weatherConditionsJson"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的天气条件"
          />
        </el-form-item>
        
        <el-form-item label="历史对比">
          <el-input
            v-model="historicalComparisonJson"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的历史对比数据"
          />
        </el-form-item>
        
        <el-form-item label="建议措施">
          <el-input
            v-model="formData.recommendations"
            type="textarea"
            :rows="4"
            placeholder="请输入建议措施"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingAssessment ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量评估对话框 -->
    <el-dialog
      v-model="showBatchAssessDialog"
      title="批量风险评估"
      width="600px"
    >
      <el-form :model="batchAssessForm" label-width="120px">
        <el-form-item label="选择区域">
          <el-select
            v-model="batchAssessForm.zone_ids"
            multiple
            placeholder="请选择要评估的区域"
            style="width: 100%"
          >
            <el-option
              v-for="zone in riskZones"
              :key="zone.id"
              :label="zone.name"
              :value="zone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="灾害类型">
          <el-select
            v-model="batchAssessForm.disaster_type_id"
            placeholder="请选择灾害类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in disasterTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="评估方法">
          <el-select v-model="batchAssessForm.assessment_method" placeholder="请选择评估方法" style="width: 100%">
            <el-option label="专家评估" value="expert" />
            <el-option label="模型计算" value="model" />
            <el-option label="历史数据" value="historical" />
            <el-option label="综合评估" value="comprehensive" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型版本">
          <el-input v-model="batchAssessForm.model_version" placeholder="请输入模型版本" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showBatchAssessDialog = false">取消</el-button>
        <el-button type="primary" @click="performBatchAssessment" :loading="batchAssessing">
          开始评估
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="风险评估详情"
      width="1000px"
    >
      <div v-if="currentAssessment" class="assessment-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="评估ID">{{ currentAssessment.id }}</el-descriptions-item>
          <el-descriptions-item label="风险区域">{{ currentAssessment.risk_zone?.name || `区域${currentAssessment.risk_zone_id}` }}</el-descriptions-item>
          <el-descriptions-item label="评估时间">{{ formatDateTime(currentAssessment.assessment_time) }}</el-descriptions-item>
          <el-descriptions-item label="当前风险等级">
            <el-tag :type="getRiskLevelType(currentAssessment.current_risk_level)">
              {{ getRiskLevelText(currentAssessment.current_risk_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="24h预测风险">
            <el-tag :type="getRiskLevelType(currentAssessment.predicted_risk_24h)">
              {{ getRiskLevelText(currentAssessment.predicted_risk_24h) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">{{ currentAssessment.confidence_score !== undefined ? Math.round(currentAssessment.confidence_score * 100) + '%' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="评估方法">{{ getMethodText(currentAssessment.assessment_method || '') }}</el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ currentAssessment.model_version || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAssessment.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="建议措施" :span="3">{{ currentAssessment.recommendations || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentAssessment.contributing_factors" class="detail-section">
          <h4>影响因素</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentAssessment.contributing_factors, null, 2) }}</pre>
          </el-card>
        </div>
        
        <div v-if="currentAssessment.weather_conditions" class="detail-section">
          <h4>天气条件</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentAssessment.weather_conditions, null, 2) }}</pre>
          </el-card>
        </div>
        
        <div v-if="currentAssessment.historical_comparison" class="detail-section">
          <h4>历史对比</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentAssessment.historical_comparison, null, 2) }}</pre>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { RiskAssessment, RiskZone, DisasterType } from '../../types'
import { formatDateTime } from '../../utils'
import { riskAssessmentsApi, riskZonesApi, disasterTypesApi } from '../../api/modules'
import router from '../../router'
import {
  Plus,
  Refresh,
  Search,
  DataBoard,
  Warning,
  InfoFilled,
  Check,
  Delete,
  Download,
  DataAnalysis
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const batchAssessing = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBatchAssessDialog = ref(false)
const editingAssessment = ref<RiskAssessment | null>(null)
const currentAssessment = ref<RiskAssessment | null>(null)
const selectedRows = ref<RiskAssessment[]>([])
const formRef = ref<FormInstance>()
const dateRange = ref<[string, string] | null>(null)

// JSON字段
const contributingFactorsJson = ref('')
const weatherConditionsJson = ref('')
const historicalComparisonJson = ref('')

// 数据列表
const assessments = ref<RiskAssessment[]>([])
const riskZones = ref<RiskZone[]>([])
const disasterTypes = ref<DisasterType[]>([])
const total = ref(0)

// 统计数据
const totalAssessments = computed(() => assessments.value?.length || 0)
const highRiskCount = computed(() => assessments.value?.filter(a => a.current_risk_level !== undefined && a.current_risk_level >= 4).length || 0)
const mediumRiskCount = computed(() => assessments.value?.filter(a => a.current_risk_level !== undefined && a.current_risk_level === 3).length || 0)
const lowRiskCount = computed(() => assessments.value?.filter(a => a.current_risk_level !== undefined && a.current_risk_level <= 2).length || 0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  zone_id: undefined as number | undefined,
  current_risk_level: undefined as number | undefined,
  assessment_method: '',
  start_time: '',
  end_time: ''
})

// 表单数据
const formData = reactive({
  zone_id: undefined as number | undefined,
  assessment_time: '',
  current_risk_level: undefined as number | undefined,
  predicted_risk_24h: undefined as number | undefined,
  predicted_risk_72h: undefined as number | undefined,
  confidence_score: 0.8,
  assessment_method: '',
  model_version: '',
  recommendations: ''
})

// 批量评估表单
const batchAssessForm = reactive({
  zone_ids: [] as number[],
  disaster_type_id: undefined as number | undefined,
  assessment_method: 'model',
  model_version: 'v1.0'
})

// 表单验证规则
const formRules = {
  zone_id: [
    { required: true, message: '请选择风险区域', trigger: 'change' }
  ],
  assessment_time: [
    { required: true, message: '请选择评估时间', trigger: 'change' }
  ],
  current_risk_level: [
    { required: true, message: '请选择当前风险等级', trigger: 'change' }
  ],
  predicted_risk_24h: [
    { required: true, message: '请选择24h预测风险等级', trigger: 'change' }
  ],
  assessment_method: [
    { required: true, message: '请选择评估方法', trigger: 'change' }
  ]
}

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal) {
    queryParams.start_time = newVal[0]
    queryParams.end_time = newVal[1]
  } else {
    queryParams.start_time = ''
    queryParams.end_time = ''
  }
})

// 获取风险等级类型
const getRiskLevelType = (level: number | undefined): string => {
  if (level === undefined) return 'info'
  const typeMap: Record<number, string> = {
    1: 'success',
    2: 'info',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return typeMap[level] || 'info'
}

// 获取风险等级文本
const getRiskLevelText = (level: number | undefined): string => {
  if (level === undefined) return '未知'
  const textMap: Record<number, string> = {
    1: '1级 - 很低',
    2: '2级 - 低',
    3: '3级 - 中等',
    4: '4级 - 高',
    5: '5级 - 很高'
  }
  return textMap[level] || `${level}级`
}

// 获取评估方法文本
const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    expert: '专家评估',
    model: '模型计算',
    historical: '历史数据',
    comprehensive: '综合评估'
  }
  return methodMap[method] || method
}

// 加载风险评估列表
const loadAssessments = async () => {
  try {
    loading.value = true
    const response = await riskAssessmentsApi.getRiskAssessments(queryParams)
    if (response.success) {
      assessments.value = response.data || []
      total.value = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载风险评估失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载风险区域列表
const loadRiskZones = async () => {
  try {
    const response = await riskZonesApi.getRiskZones({ page: 1, limit: 1000 })
    if (response.success) {
      riskZones.value = response.data || []
    }
  } catch (error) {
    console.error('加载风险区域失败:', error)
  }
}

// 加载灾害类型列表
const loadDisasterTypes = async () => {
  try {
    const response = await disasterTypesApi.getDisasterTypes({ page: 1, limit: 1000 })
    if (response.success) {
      disasterTypes.value = response.data || []
    }
  } catch (error) {
    console.error('加载灾害类型失败:', error)
  }
}

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    limit: 20,
    zone_id: undefined,
    current_risk_level: undefined,
    assessment_method: '',
    start_time: '',
    end_time: ''
  })
  dateRange.value = null
  loadAssessments()
}

// 选择变化
const handleSelectionChange = (selection: RiskAssessment[]) => {
  selectedRows.value = selection
}

// 查看详情
const viewDetails = (row: RiskAssessment) => {
  currentAssessment.value = row
  showDetailDialog.value = true
}

// 查看区域详情
const viewZoneDetails = (zoneId: number) => {
  // 跳转到风险区域详情页面
  router.push({
    name: 'RiskZones',
    query: {
      id: zoneId,
      action: 'view'
    }
  })
}

// 编辑风险评估
const editAssessment = (row: RiskAssessment) => {
  editingAssessment.value = row
  Object.assign(formData, {
    zone_id: row.zone_id,
    assessment_time: row.assessment_time,
    current_risk_level: row.current_risk_level,
    predicted_risk_24h: row.predicted_risk_24h,
    predicted_risk_72h: row.predicted_risk_72h,
    confidence_score: row.confidence_score,
    assessment_method: row.assessment_method,
    model_version: row.model_version || '',
    recommendations: row.recommendations || ''
  })
  
  contributingFactorsJson.value = row.contributing_factors ? JSON.stringify(row.contributing_factors, null, 2) : ''
  weatherConditionsJson.value = row.weather_conditions ? JSON.stringify(row.weather_conditions, null, 2) : ''
  historicalComparisonJson.value = row.historical_comparison ? JSON.stringify(row.historical_comparison, null, 2) : ''
  
  showCreateDialog.value = true
}

// 删除风险评估
const deleteAssessment = async (id: number) => {
  try {
    const response = await riskAssessmentsApi.deleteRiskAssessment(id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadAssessments()
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    const promises = selectedRows.value.map(row => 
      riskAssessmentsApi.deleteRiskAssessment(row.id)
    )
    await Promise.all(promises)
    ElMessage.success('批量删除成功')
    loadAssessments()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 导出选中
const exportSelected = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要导出的风险评估')
      return
    }
    
    const ids = selectedRows.value.map(row => row.id)
    
    const blob = await riskAssessmentsApi.exportRiskAssessments({ ids })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `风险评估数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedRows.value.length} 个风险评估数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量评估
const performBatchAssessment = async () => {
  if (batchAssessForm.zone_ids.length === 0) {
    ElMessage.warning('请选择要评估的区域')
    return
  }
  
  if (!batchAssessForm.disaster_type_id) {
    ElMessage.warning('请选择灾害类型')
    return
  }
  
  try {
    batchAssessing.value = true
    const response = await riskAssessmentsApi.batchAssessRisk({
      zone_ids: batchAssessForm.zone_ids,
      disaster_type_id: batchAssessForm.disaster_type_id as number,
      assessment_factors: {
        assessment_method: batchAssessForm.assessment_method,
        model_version: batchAssessForm.model_version
      }
    })
    
    if (response.success) {
      ElMessage.success('批量评估完成')
      showBatchAssessDialog.value = false
      loadAssessments()
    }
  } catch (error) {
    console.error('批量评估失败:', error)
    ElMessage.error('批量评估失败')
  } finally {
    batchAssessing.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    zone_id: undefined,
    assessment_time: '',
    current_risk_level: undefined,
    predicted_risk_24h: undefined,
    predicted_risk_72h: undefined,
    confidence_score: 0.8,
    assessment_method: '',
    model_version: '',
    recommendations: ''
  })
  
  contributingFactorsJson.value = ''
  weatherConditionsJson.value = ''
  historicalComparisonJson.value = ''
  editingAssessment.value = null
  formRef.value?.resetFields()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitting.value = true
    
    // 处理JSON字段
    let contributingFactors = null
    let weatherConditions = null
    let historicalComparison = null
    
    if (contributingFactorsJson.value.trim()) {
      try {
        contributingFactors = JSON.parse(contributingFactorsJson.value)
      } catch (error) {
        ElMessage.error('影响因素格式错误，请输入有效的JSON')
        return
      }
    }
    
    if (weatherConditionsJson.value.trim()) {
      try {
        weatherConditions = JSON.parse(weatherConditionsJson.value)
      } catch (error) {
        ElMessage.error('天气条件格式错误，请输入有效的JSON')
        return
      }
    }
    
    if (historicalComparisonJson.value.trim()) {
      try {
        historicalComparison = JSON.parse(historicalComparisonJson.value)
      } catch (error) {
        ElMessage.error('历史对比格式错误，请输入有效的JSON')
        return
      }
    }
    
    const data = {
      ...formData,
      contributing_factors: contributingFactors,
      weather_conditions: weatherConditions,
      historical_comparison: historicalComparison
    }
    
    let response
    if (editingAssessment.value) {
      response = await riskAssessmentsApi.updateRiskAssessment(editingAssessment.value.id, data)
    } else {
      response = await riskAssessmentsApi.createRiskAssessment(data)
    }
    
    if (response.success) {
      ElMessage.success(editingAssessment.value ? '更新成功' : '创建成功')
      showCreateDialog.value = false
      resetForm()
      loadAssessments()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载
onMounted(() => {
  loadAssessments()
  loadRiskZones()
  loadDisasterTypes()
})
</script>

<style scoped>
.risk-assessments-container {
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

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-overview {
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

.stat-icon.total {
  background: #409eff;
}

.stat-icon.high-risk {
  background: #f56c6c;
}

.stat-icon.medium-risk {
  background: #e6a23c;
}

.stat-icon.low-risk {
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
  display: flex;
  justify-content: center;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.confidence-text {
  margin-left: 8px;
  font-size: 12px;
  color: #606266;
}

.assessment-detail {
  padding: 20px 0;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.detail-section pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
}
</style>