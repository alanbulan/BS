<template>
  <div class="risk-zones-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>风险区域管理</h2>
        <p>管理和监控各类灾害风险区域</p>
      </div>
      <div class="header-right">
        <el-button 
          type="success" 
          @click="handleBatchAssess"
          :disabled="selectedZones.length === 0"
        >
          <el-icon><DataAnalysis /></el-icon>
          批量评估 {{ selectedZones.length > 0 ? `(${selectedZones.length})` : '' }}
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增风险区域
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="区域名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入区域名称"
            clearable
            style="width: 200px"
          />
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
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.risk_level_min"
            placeholder="最低风险等级"
            clearable
            style="width: 140px"
          >
            <el-option label="极低" :value="1" />
            <el-option label="低" :value="2" />
            <el-option label="中" :value="3" />
            <el-option label="高" :value="4" />
            <el-option label="极高" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="监测状态">
          <el-select
            v-model="queryParams.is_monitored"
            placeholder="请选择监测状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已监测" :value="true" />
            <el-option label="未监测" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRiskZones">
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
        :data="riskZones"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="区域编号" width="120" />
        <el-table-column prop="name" label="区域名称" min-width="150" />
        <el-table-column prop="disaster_type" label="灾害类型" width="120">
          <template #default="{ row }">
            <el-tag 
              size="small"
              :color="row.disaster_type?.color_code"
            >
              {{ row.disaster_type?.name || getDisasterTypeName(row.disaster_type_id) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="base_risk_level" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag
              :color="getRiskLevelColor(row.base_risk_level)"
              effect="dark"
              size="small"
            >
              {{ getRiskLevelText(row.base_risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="elevation_avg" label="平均海拔(m)" width="120">
          <template #default="{ row }">
            {{ row.elevation_avg ? row.elevation_avg.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="population_density" label="人口密度" width="120">
          <template #default="{ row }">
            {{ row.population_density ? row.population_density.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="is_monitored" label="监测状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.is_monitored ? 'success' : 'danger'"
              size="small"
            >
              {{ row.is_monitored ? '监测中' : '未监测' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="elevation_max" label="最高海拔(m)" width="120">
          <template #default="{ row }">
            {{ row.elevation_max ? row.elevation_max.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="elevation_min" label="最低海拔(m)" width="120">
          <template #default="{ row }">
            {{ row.elevation_min ? row.elevation_min.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="slope_avg" label="平均坡度(°)" width="120">
          <template #default="{ row }">
            {{ row.slope_avg ? row.slope_avg.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="slope_max" label="最大坡度(°)" width="120">
          <template #default="{ row }">
            {{ row.slope_max ? row.slope_max.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="land_use_type" label="土地利用类型" width="120">
          <template #default="{ row }">
            {{ row.land_use_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="vegetation_coverage" label="植被覆盖率" width="120">
          <template #default="{ row }">
            {{ row.vegetation_coverage ? (row.vegetation_coverage * 100).toFixed(1) + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="administrative_level" label="行政级别" width="120">
          <template #default="{ row }">
            {{ row.administrative_level || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="responsible_department" label="负责部门" width="150">
          <template #default="{ row }">
            {{ row.responsible_department || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="geological_structure" label="地质结构" width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.geological_structure" :content="formatGeologicalStructure(row.geological_structure)" placement="top">
              <span class="text-truncate">{{ formatGeologicalStructure(row.geological_structure) }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="emergency_contact" label="应急联系方式" width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.emergency_contact" :content="formatEmergencyContact(row.emergency_contact)" placement="top">
              <span class="text-truncate">{{ formatEmergencyContact(row.emergency_contact) }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="最后更新" width="120">
          <template #default="{ row }">
            {{ row.updated_at ? formatDate(row.updated_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="success" @click="handleAssess(row)" :loading="assessingZoneId === row.id">
                <el-icon><DataAnalysis /></el-icon>
                评估
              </el-button>
              <el-button size="small" type="primary" @click="viewDetail(row)">
                详情
              </el-button>
              <el-button size="small" type="warning" @click="editRiskZone(row)">
                编辑
              </el-button>
              <el-popconfirm title="确定删除该风险区域吗？" @confirm="deleteRiskZone(row.id)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRiskZones"
          @current-change="loadRiskZones"
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
            <el-button size="small" @click="batchExport">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-popconfirm
              title="确定要删除选中的风险区域吗？"
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
      :title="editingZone ? '编辑风险区域' : '新增风险区域'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="form-container"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="区域编号" prop="code">
              <el-input v-model="formData.code" placeholder="请输入区域编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入区域名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="风险等级" prop="base_risk_level">
              <el-select v-model="formData.base_risk_level" placeholder="请选择风险等级" style="width: 100%">
                <el-option label="极低" :value="1" />
                <el-option label="低" :value="2" />
                <el-option label="中" :value="3" />
                <el-option label="高" :value="4" />
                <el-option label="极高" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="平均海拔(m)" prop="elevation_avg">
              <el-input-number
                v-model="formData.elevation_avg"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人口密度(人/km²)" prop="population_density">
              <el-input-number
                v-model="formData.population_density"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行政级别" prop="administrative_level">
              <el-input v-model="formData.administrative_level" placeholder="请输入行政级别" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责部门" prop="responsible_department">
              <el-input v-model="formData.responsible_department" placeholder="请输入负责部门" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="土地利用类型" prop="land_use_type">
              <el-input v-model="formData.land_use_type" placeholder="请输入土地利用类型" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="植被覆盖率" prop="vegetation_coverage">
              <el-input-number
                v-model="formData.vegetation_coverage"
                :min="0"
                :max="1"
                :precision="2"
                :step="0.01"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否监测" prop="is_monitored">
              <el-switch
                v-model="formData.is_monitored"
                active-text="监测中"
                inactive-text="未监测"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 空列，保持布局平衡 -->
          </el-col>
        </el-row>
        
        <el-form-item label="地理边界(GeoJSON)" prop="geometry">
          <el-input
            v-model="formData.geometry"
            type="textarea"
            :rows="3"
            placeholder="请输入GeoJSON格式的地理边界数据"
          />
        </el-form-item>
        
        <el-form-item label="应急联系方式" prop="emergency_contact">
          <el-input
            v-model="formData.emergency_contact"
            type="textarea"
            :rows="2"
            placeholder="请输入应急联系方式(JSON格式)"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingZone ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="风险区域详情"
      width="900px"
    >
      <div v-if="currentZone" class="zone-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="区域编号">{{ currentZone.code }}</el-descriptions-item>
          <el-descriptions-item label="区域名称">{{ currentZone.name }}</el-descriptions-item>
          <el-descriptions-item label="灾害类型">
            <el-tag size="small">{{ getDisasterTypeName(currentZone.disaster_type_id) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag
              :color="getRiskLevelColor(currentZone.base_risk_level)"
              effect="dark"
              size="small"
            >
              {{ getRiskLevelText(currentZone.base_risk_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="平均海拔">{{ currentZone.elevation_avg ? currentZone.elevation_avg + 'm' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="人口密度">{{ currentZone.population_density ? currentZone.population_density + '人/km²' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="最大海拔">{{ currentZone.elevation_max ? currentZone.elevation_max + 'm' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="最小海拔">{{ currentZone.elevation_min ? currentZone.elevation_min + 'm' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="平均坡度">{{ currentZone.slope_avg ? currentZone.slope_avg + '°' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="最大坡度">{{ currentZone.slope_max ? currentZone.slope_max + '°' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="地质结构">
            <div style="white-space: pre-wrap; font-family: inherit;">{{ formatGeologicalStructure(currentZone.geological_structure) }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="土地利用类型">{{ currentZone.land_use_type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="植被覆盖率">{{ currentZone.vegetation_coverage ? currentZone.vegetation_coverage + '%' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="行政级别">{{ currentZone.administrative_level || '-' }}</el-descriptions-item>
          <el-descriptions-item label="监测状态">
            <el-tag
              :type="currentZone.is_monitored ? 'success' : 'danger'"
              size="small"
            >
              {{ currentZone.is_monitored ? '监测中' : '未监测' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ currentZone.updated_at ? formatDate(currentZone.updated_at) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentZone.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="负责部门">{{ currentZone.responsible_department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="应急联系方式" :span="2">
            <div v-if="currentZone.emergency_contact">
              <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">{{ formatEmergencyContact(currentZone.emergency_contact) }}</pre>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 地理边界信息 -->
        <div class="boundary-section">
          <h4>地理边界</h4>
          <div class="boundary-map">
            <RiskZoneMapComponent 
              :risk-zone="currentZone"
              :height="'300px'"
              :disaster-types="disasterTypes"
            />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { RiskZone, DisasterType } from '../../types'
import {
  formatDate,
  getRiskLevelColor,
  getRiskLevelText
} from '../../utils'
import {
  Plus,
  Search,
  Refresh,
  Download,
  Delete,
  DataAnalysis
} from '@element-plus/icons-vue'
import { riskZonesApi } from '../../api/modules/riskZones'
import { riskAssessmentsApi } from '../../api/modules/riskAssessments'
import { disasterTypesApi } from '../../api/modules/disaster-types'
import RiskZoneMapComponent from '../../components/RiskZoneMapComponent.vue'

// 路由
const route = useRoute()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingZone = ref<RiskZone | null>(null)
const currentZone = ref<RiskZone | null>(null)
const selectedRows = ref<RiskZone[]>([])
const selectedZones = ref<RiskZone[]>([])
const assessingZoneId = ref<number | null>(null)
const formRef = ref<FormInstance>()

// 数据列表
const riskZones = ref<RiskZone[]>([])
const disasterTypes = ref<DisasterType[]>([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  page_size: 20,
  name: '',
  disaster_type_id: undefined as number | undefined,
  risk_level_min: undefined as number | undefined,
  risk_level_max: undefined as number | undefined,
  is_monitored: undefined as boolean | undefined
})

// 表单数据
const formData = reactive({
  code: '',
  name: '',
  disaster_type_id: undefined as number | undefined,
  base_risk_level: undefined as number | undefined,
  geometry: '',
  population_density: undefined as number | undefined,
  administrative_level: '',
  responsible_department: '',
  elevation_avg: undefined as number | undefined,
  elevation_max: undefined as number | undefined,
  elevation_min: undefined as number | undefined,
  slope_avg: undefined as number | undefined,
  slope_max: undefined as number | undefined,
  geological_structure: '',
  vegetation_coverage: undefined as number | undefined,
  land_use_type: '',
  emergency_contact: '',
  is_monitored: false
})

// 表单验证规则
const formRules = {
  code: [
    { required: true, message: '请输入区域编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入区域名称', trigger: 'blur' }
  ],
  disaster_type_id: [
    { required: true, message: '请选择灾害类型', trigger: 'change' }
  ],
  base_risk_level: [
    { required: true, message: '请选择风险等级', trigger: 'change' }
  ],
  geometry: [
    { required: true, message: '请输入几何信息', trigger: 'blur' }
  ],
  administrative_level: [
    { required: true, message: '请输入行政级别', trigger: 'blur' }
  ],
  responsible_department: [
    { required: true, message: '请输入负责部门', trigger: 'blur' }
  ]
}

// 获取灾害类型名称
const getDisasterTypeName = (typeId: number): string => {
  const type = disasterTypes.value.find(t => t.id === typeId)
  return type ? type.name : '未知'
}

// 格式化应急联系方式
const formatEmergencyContact = (contact: string | object): string => {
  try {
    let contactObj
    if (typeof contact === 'string') {
      contactObj = JSON.parse(contact)
    } else if (typeof contact === 'object' && contact !== null) {
      contactObj = contact
    } else {
      return String(contact)
    }
    
    if (typeof contactObj === 'object' && contactObj !== null) {
      return Object.entries(contactObj)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    }
    return String(contact)
  } catch {
    return String(contact)
  }
}

// 格式化地质结构信息
const formatGeologicalStructure = (structure: string | object | null): string => {
  if (!structure) return '暂无'
  
  try {
    let structureObj
    if (typeof structure === 'string') {
      structureObj = JSON.parse(structure)
    } else if (typeof structure === 'object' && structure !== null) {
      structureObj = structure
    } else {
      return '暂无'
    }
    
    const parts = []
    
    if (structureObj.rock_type) {
      const rockTypeMap: { [key: string]: string } = {
        'limestone': '石灰岩',
        'sandstone': '砂岩',
        'granite': '花岗岩',
        'shale': '页岩',
        'basalt': '玄武岩',
        'quartzite': '石英岩'
      }
      parts.push(`岩石类型：${rockTypeMap[structureObj.rock_type] || structureObj.rock_type}`)
    }
    
    if (structureObj.soil_type) {
      const soilTypeMap: { [key: string]: string } = {
        'clay': '粘土',
        'sand': '砂土',
        'loam': '壤土',
        'silt': '粉土',
        'gravel': '砾石土'
      }
      parts.push(`土壤类型：${soilTypeMap[structureObj.soil_type] || structureObj.soil_type}`)
    }
    
    if (structureObj.fault_density) {
      const faultDensityMap: { [key: string]: string } = {
        'low': '低',
        'medium': '中等',
        'high': '高'
      }
      parts.push(`断层密度：${faultDensityMap[structureObj.fault_density] || structureObj.fault_density}`)
    }
    
    if (structureObj.weathering_degree) {
      const weatheringMap: { [key: string]: string } = {
        'weak': '弱风化',
        'medium': '中等风化',
        'strong': '强风化',
        'complete': '全风化'
      }
      parts.push(`风化程度：${weatheringMap[structureObj.weathering_degree] || structureObj.weathering_degree}`)
    }
    
    return parts.join(' | ') || String(structure)
  } catch {
    return String(structure)
  }
}



// 加载风险区域列表
const loadRiskZones = async () => {
  loading.value = true
  try {
    const params: any = {
      page: queryParams.page,
      limit: queryParams.page_size,
      name: queryParams.name || undefined,
      disaster_type_id: queryParams.disaster_type_id || undefined,
      risk_level_min: queryParams.risk_level_min || undefined,
      risk_level_max: queryParams.risk_level_max || undefined,
      is_monitored: queryParams.is_monitored
    }
    
    // 移除undefined值
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await riskZonesApi.getRiskZones(params)
    riskZones.value = response.data || []
    total.value = response.pagination?.total || 0
  } catch (error) {
    console.error('加载风险区域列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载灾害类型
const loadDisasterTypes = async () => {
  try {
    const response = await disasterTypesApi.getDisasterTypes()
    disasterTypes.value = response.data
  } catch (error) {
    console.error('加载灾害类型失败:', error)
    ElMessage.error('加载灾害类型失败')
  }
}

// 重置查询条件
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    page_size: 20,
    name: '',
    disaster_type_id: undefined,
    risk_level_min: undefined,
    risk_level_max: undefined,
    is_monitored: undefined
  })
  loadRiskZones()
}

// 查看详情
const viewDetail = async (zone: RiskZone) => {
  try {
    console.log('查看详情，风险区域ID:', zone.id)
    // 重新从API获取完整的风险区域数据，确保包含完整的geometry信息
    const response = await riskZonesApi.getRiskZone(zone.id)
    
    if (response.success && response.data) {
      console.log('获取到完整的风险区域数据:', response.data)
      currentZone.value = response.data
      showDetailDialog.value = true
    } else {
      console.error('获取风险区域详情失败:', response.message)
      ElMessage.error('获取风险区域详情失败')
      // 如果API调用失败，仍然使用列表中的数据
      currentZone.value = zone
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error('获取风险区域详情出错:', error)
    ElMessage.error('获取风险区域详情出错')
    // 如果出现异常，仍然使用列表中的数据
    currentZone.value = zone
    showDetailDialog.value = true
  }
}

// 编辑风险区域
const editRiskZone = (zone: RiskZone) => {
  editingZone.value = zone
  Object.assign(formData, {
    code: zone.code,
    name: zone.name,
    disaster_type_id: zone.disaster_type_id,
    base_risk_level: zone.base_risk_level,
    geometry: typeof zone.geometry === 'string' ? zone.geometry : JSON.stringify(zone.geometry),
    population_density: zone.population_density,
    administrative_level: zone.administrative_level,
    responsible_department: zone.responsible_department,
    elevation_avg: zone.elevation_avg,
    elevation_max: zone.elevation_max,
    elevation_min: zone.elevation_min,
    slope_avg: zone.slope_avg,
    slope_max: zone.slope_max,
    geological_structure: typeof zone.geological_structure === 'string' ? zone.geological_structure : JSON.stringify(zone.geological_structure),
    vegetation_coverage: zone.vegetation_coverage,
    land_use_type: zone.land_use_type,
    emergency_contact: typeof zone.emergency_contact === 'string' ? zone.emergency_contact : JSON.stringify(zone.emergency_contact),
    is_monitored: zone.is_monitored
  })
  showCreateDialog.value = true
}

// 删除风险区域
const deleteRiskZone = async (id: number) => {
  try {
    const response = await riskZonesApi.deleteRiskZone(id)
    
    if (response.success) {
      ElMessage.success('删除成功')
      loadRiskZones()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 选择变化处理
const handleSelectionChange = (selection: RiskZone[]) => {
  selectedRows.value = selection
  selectedZones.value = selection
  console.log(`已选择 ${selection.length} 个风险区域`)
}

// 单个区域评估
const handleAssess = async (zone: RiskZone) => {
  try {
    assessingZoneId.value = zone.id
    console.log(`[评估] 开始评估风险区域：${zone.name} (id=${zone.id})`)
    
    const response = await riskAssessmentsApi.assessRisk(zone.id)
    
    if (response.success && response.data) {
      ElMessage.success(`${zone.name} 风险评估完成`)
      console.log(`[评估] 结果：风险等级${response.data.current_risk_level}级，置信度${response.data.confidence_score}`)
      
      // 刷新列表
      loadRiskZones()
    } else {
      ElMessage.error(response.message || '评估失败')
    }
  } catch (error: any) {
    console.error('[评估] 失败:', error)
    ElMessage.error(error.response?.data?.message || '评估失败')
  } finally {
    assessingZoneId.value = null
  }
}

// 批量评估
const handleBatchAssess = async () => {
  if (selectedZones.value.length === 0) {
    ElMessage.warning('请先选择要评估的风险区域')
    return
  }
  
  try {
    const zoneIds = selectedZones.value.map(z => z.id)
    const zoneNames = selectedZones.value.map(z => z.name).join('、')
    
    console.log(`[批量评估] 开始评估 ${zoneIds.length} 个风险区域: ${zoneNames}`)
    
    loading.value = true
    
    // 获取第一个区域的灾害类型作为默认值
    const disaster_type_id = selectedZones.value[0].disaster_type_id
    
    const response = await riskAssessmentsApi.batchAssessRisk({
      zone_ids: zoneIds,
      disaster_type_id: disaster_type_id
    })
    
    if (response.success && response.data) {
      const { successful, failed } = response.data
      ElMessage.success(`批量评估完成：成功${successful}个，失败${failed}个`)
      console.log(`[批量评估] 完成：成功${successful}个，失败${failed}个`)
      
      // 刷新列表
      loadRiskZones()
      selectedZones.value = []
    } else {
      ElMessage.error(response.message || '批量评估失败')
    }
  } catch (error: any) {
    console.error('[批量评估] 失败:', error)
    ElMessage.error(error.response?.data?.message || '批量评估失败')
  } finally {
    loading.value = false
  }
}

// 批量导出
const batchExport = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要导出的风险区域')
      return
    }
    
    const ids = selectedRows.value.map(row => row.id)
    
    const blob = await riskZonesApi.exportRiskZones({ ids })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `风险区域数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedRows.value.length} 个风险区域数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的风险区域')
    return
  }
  
  try {
    const deletePromises = selectedRows.value.map(row => riskZonesApi.deleteRiskZone(row.id))
    const results = await Promise.all(deletePromises)
    
    const failedCount = results.filter((result: any) => !result.success).length
    
    if (failedCount === 0) {
      ElMessage.success('批量删除成功')
    } else {
      ElMessage.warning(`删除完成，其中${failedCount}个失败`)
    }
    
    selectedRows.value = []
    loadRiskZones()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 重置表单
const resetForm = () => {
  editingZone.value = null
  Object.assign(formData, {
    code: '',
    name: '',
    disaster_type_id: undefined,
    base_risk_level: undefined,
    geometry: '',
    population_density: undefined,
    administrative_level: '',
    responsible_department: '',
    elevation_avg: undefined,
    elevation_max: undefined,
    elevation_min: undefined,
    slope_avg: undefined,
    slope_max: undefined,
    geological_structure: '',
    vegetation_coverage: undefined,
    land_use_type: '',
    emergency_contact: '',
    is_monitored: false
  })
  formRef.value?.resetFields()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    let response
    if (editingZone.value) {
      response = await riskZonesApi.updateRiskZone(editingZone.value.id, formData)
    } else {
      response = await riskZonesApi.createRiskZone(formData)
    }
    
    if (response.success) {
      ElMessage.success(editingZone.value ? '更新成功' : '创建成功')
      showCreateDialog.value = false
      resetForm()
      loadRiskZones()
    } else {
      ElMessage.error(response.message || (editingZone.value ? '更新失败' : '创建失败'))
    }
  } catch (error) {
    console.error('提交失败:', error)
    if (error !== false) { // 不是验证失败
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}


// 组件挂载
// 根据路由参数打开详情
const ensureDetailFromRoute = async () => {
  const idParam = route.query.id
  const idStr = Array.isArray(idParam) ? idParam[0] : (idParam ?? '')
  const id = typeof idStr === 'string' ? parseInt(idStr, 10) : NaN
  if (!isNaN(id)) {
    try {
      const resp = await riskZonesApi.getRiskZone(id)
      if (resp.success && resp.data) {
        currentZone.value = resp.data
        showDetailDialog.value = true
      }
    } catch (e) {
      console.error('根据路由参数加载详情失败', e)
    }
  }
}

watch(() => route.query.id, () => {
  ensureDetailFromRoute()
})
onMounted(() => {
  loadDisasterTypes()
  loadRiskZones()
  ensureDetailFromRoute()
})
</script>

<style scoped>
.risk-zones-container {
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
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
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

.zone-detail {
  padding: 20px 0;
}

.boundary-section {
  margin-top: 30px;
}

.boundary-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.boundary-map {
  height: 300px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.map-placeholder p {
  margin-top: 12px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .risk-zones-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
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
}
</style>