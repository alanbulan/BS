<template>
  <div class="shelters-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>避难所管理</h2>
        <p>管理应急避难场所信息和容量状态</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加避难所
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 避难所统计 -->
    <div class="shelter-stats">
      <div class="stat-card total">
        <div class="stat-icon">
          <el-icon size="24"><House /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalShelters }}</div>
          <div class="stat-label">总避难所</div>
        </div>
      </div>
      <div class="stat-card available">
        <div class="stat-icon">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ availableShelters }}</div>
          <div class="stat-label">可用避难所</div>
        </div>
      </div>
      <div class="stat-card capacity">
        <div class="stat-icon">
          <el-icon size="24"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalCapacity }}</div>
          <div class="stat-label">总容量</div>
        </div>
      </div>
      <div class="stat-card occupied">
        <div class="stat-icon">
          <el-icon size="24"><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ occupiedCapacity }}</div>
          <div class="stat-label">已占用</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="避难所名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入避难所名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="避难所类型">
          <el-select
            v-model="queryParams.shelter_type"
            placeholder="请选择避难所类型"
            clearable
            style="width: 150px"
          >
            <el-option label="学校" value="school" />
            <el-option label="体育馆" value="gymnasium" />
            <el-option label="社区中心" value="community_center" />
            <el-option label="公园" value="park" />
            <el-option label="广场" value="square" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select
            v-model="queryParams.is_active"
            placeholder="请选择启用状态"
            clearable
            style="width: 120px"
          >
            <el-option label="激活" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="管理机构">
          <el-input
            v-model="queryParams.management_agency"
            placeholder="请输入管理机构"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadShelters">
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
        :data="shelters"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="shelter_id" label="避难所编号" width="120" />
        <el-table-column prop="name" label="避难所名称" min-width="200" />
        <el-table-column prop="shelter_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getShelterTypeText(row.shelter_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="capacity" label="容量" width="80" align="center" />
        <el-table-column prop="current_occupancy" label="当前人数" width="100" align="center">
          <template #default="{ row }">
            <span :class="getOccupancyClass(row)">{{ row.current_occupancy }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="getOccupancyPercentage(row)"
              :color="getProgressColor(row)"
              :stroke-width="8"
            />
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
        <el-table-column prop="management_agency" label="管理机构" width="150" show-overflow-tooltip />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
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
                type="warning"
                size="small"
                @click="editShelter(row)"
              >
                编辑
              </el-button>
              <el-popconfirm
                title="确定要删除这个避难所吗？"
                @confirm="deleteShelter(row.id)"
              >
                <template #reference>
                  <el-button
                    type="danger"
                    size="small"
                  >
                    删除
                  </el-button>
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
          @size-change="loadShelters"
          @current-change="loadShelters"
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
            <el-button size="small" @click="batchUpdateStatus">
              <el-icon><Edit /></el-icon>
              批量更新状态
            </el-button>
            <el-button size="small" @click="batchExport">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-popconfirm
              title="确定要删除选中的避难所吗？"
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
      :title="editingShelter ? '编辑避难所' : '添加避难所'"
      width="800px"
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
            <el-form-item label="避难所编号" prop="shelter_id">
              <el-input v-model="formData.shelter_id" placeholder="请输入避难所编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="避难所类型" prop="shelter_type">
              <el-select v-model="formData.shelter_type" placeholder="请选择避难所类型" style="width: 100%">
                <el-option label="学校" value="school" />
                <el-option label="体育馆" value="gymnasium" />
                <el-option label="社区中心" value="community_center" />
                <el-option label="公园" value="park" />
                <el-option label="广场" value="square" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="避难所名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入避难所名称" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入详细地址" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="经度" prop="longitude">
              <el-input-number
                v-model="formData.longitude"
                :precision="6"
                :min="-180"
                :max="180"
                style="width: 100%"
                placeholder="经度"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number
                v-model="formData.latitude"
                :precision="6"
                :min="-90"
                :max="90"
                style="width: 100%"
                placeholder="纬度"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="海拔" prop="elevation">
              <el-input-number
                v-model="formData.elevation"
                :precision="2"
                style="width: 100%"
                placeholder="海拔(米)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="容量" prop="capacity">
              <el-input-number
                v-model="formData.capacity"
                :min="1"
                style="width: 100%"
                placeholder="容量(人)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前人数" prop="current_occupancy">
              <el-input-number
                v-model="formData.current_occupancy"
                :min="0"
                :max="formData.capacity || 999999"
                style="width: 100%"
                placeholder="当前人数"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="可用" value="available" />
                <el-option label="维护中" value="maintenance" />
                <el-option label="已满" value="full" />
                <el-option label="不可用" value="unavailable" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="管理机构" prop="management_agency">
          <el-input v-model="formData.management_agency" placeholder="请输入管理机构" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="formData.contact_person" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="设施描述">
          <el-input
            v-model="formData.facilities"
            type="textarea"
            :rows="3"
            placeholder="请描述避难所的设施情况"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="其他备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingShelter ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 避难所详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="避难所详情"
      width="900px"
    >
      <div v-if="currentShelter" class="shelter-detail">
        <div class="shelter-header">
          <div class="shelter-title">
            <h3>{{ currentShelter.name }}</h3>
            <el-tag size="large">{{ getShelterTypeText(currentShelter.shelter_type || '') }}</el-tag>
          </div>
          <div class="shelter-meta">
            <el-tag
              :type="currentShelter.is_active ? 'success' : 'danger'"
              size="small"
            >
              {{ currentShelter.is_active ? '运行中' : '停用' }}
            </el-tag>
            <span class="shelter-id">编号: {{ currentShelter.id }}</span>
          </div>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="地址">{{ currentShelter.address }}</el-descriptions-item>
          <el-descriptions-item label="管理机构">{{ currentShelter.contact_info?.agency }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentShelter.contact_info?.person }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentShelter.contact_info?.phone }}</el-descriptions-item>
          <el-descriptions-item label="经纬度">
            {{ currentShelter.location?.[0] }}, {{ currentShelter.location?.[1] }}
          </el-descriptions-item>
          <el-descriptions-item label="海拔">{{ currentShelter.elevation }}米</el-descriptions-item>
          <el-descriptions-item label="容量">{{ currentShelter.capacity }}人</el-descriptions-item>
          <el-descriptions-item label="当前人数">
            <span :class="getOccupancyClass(currentShelter)">{{ currentShelter.current_occupancy || 0 }}人</span>
          </el-descriptions-item>
          <el-descriptions-item label="使用率" :span="2">
            <el-progress
              :percentage="getOccupancyPercentage(currentShelter)"
              :color="getProgressColor(currentShelter)"
              :stroke-width="12"
              :show-text="true"
            />
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentShelter.facilities" class="facilities-section">
          <div class="content-text">
            <template v-if="getFacilitiesList(currentShelter).length">
              <el-tag
                v-for="label in getFacilitiesList(currentShelter)"
                :key="label"
                size="small"
                type="success"
                effect="light"
                style="margin-right: 6px; margin-bottom: 6px;"
              >
                {{ label }}
              </el-tag>
            </template>
            <template v-else>无</template>
          </div>
        </div>
        
        <div v-if="currentShelter.special_requirements" class="notes-section">
          <h4>特殊要求</h4>
          <div class="content-text">{{ currentShelter.special_requirements }}</div>
        </div>
        
        <!-- 容量变化历史 -->
        <div class="capacity-history">
          <h4>容量变化历史</h4>
          <el-table :data="capacityHistory" size="small">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="occupancy" label="人数" width="80" />
            <el-table-column prop="change" label="变化" width="80">
              <template #default="{ row }">
                <span :class="row.change > 0 ? 'increase' : row.change < 0 ? 'decrease' : ''">
                  {{ row.change > 0 ? '+' : '' }}{{ row.change }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 批量状态更新对话框 -->
    <el-dialog
      v-model="showBatchStatusDialog"
      title="批量更新状态"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="新状态">
          <el-select v-model="batchStatus" placeholder="请选择状态" style="width: 100%">
            <el-option label="激活" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showBatchStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchStatus" :loading="submitting">
          确定更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { Shelter, ShelterListItem } from '../../types'
import { sheltersApi } from '../../api/modules/shelters'

import {
  Plus,
  Refresh,
  Search,
  House,
  CircleCheck,
  User,
  UserFilled,
  Edit,
  Download,
  Delete
} from '@element-plus/icons-vue'

// ================= 工具函数与常量 =================
/**
 * 安全解析 JSON 字符串，失败时返回原值或空对象
 */
const parseJSONSafe = (value: any, fallback: any = undefined) => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      const trimmed = value.trim()
      if (trimmed === '') return fallback
      return JSON.parse(trimmed)
    } catch (e) {
      return fallback ?? value
    }
  }
  return fallback ?? value
}

/**
 * 归一化 contact_info 字段，兼容不同历史键名
 * 数据库表: shelters.contact_info JSONB
 * 可能包含的键: management_agency/agency/contact, contact_person/person, contact_phone/phone/emergency_phone
 */
const normalizeContactInfo = (raw: any) => {
  const ci = parseJSONSafe(raw, {}) || {}
  const agency = ci.management_agency ?? ci.agency ?? ci.contact ?? ''
  const person = ci.contact_person ?? ci.person ?? ''
  const phone = ci.contact_phone ?? ci.phone ?? ci.emergency_phone ?? ''
  return {
    ...ci,
    management_agency: agency,
    agency,
    contact_person: person,
    person,
    contact_phone: phone,
    phone
  }
}

/**
 * 设施显示标签映射（键 -> 中文标签）
 * 数据库表: shelters.facilities JSONB
 */
const FACILITY_LABELS: Record<string, string> = {
  food: '食品',
  water: '饮用水',
  heating: '供暖',
  power: '供电',
  medical: '医疗点',
  parking: '停车位',
  restrooms: '卫生间',
  sanitation: '清洁消杀',
  communication: '通信保障',
  air_conditioning: '空调',
  wifi: 'Wi-Fi',
  blanket: '棉被',
  shelter_tent: '帐篷'
}

/**
 * 从避难所数据中提取设施标签列表
 */
const getFacilitiesList = (s: any): string[] => {
  const raw = typeof s?.facilities === 'string' ? parseJSONSafe(s.facilities, {}) : (s?.facilities || {})
  if (!raw || typeof raw !== 'object') return []
  const labels: string[] = []
  Object.keys(raw).forEach((key) => {
    const val = (raw as any)[key]
    if (val === true || val === 'true' || (typeof val === 'number' && val > 0)) {
      labels.push(FACILITY_LABELS[key] || key)
    }
  })
  return labels
}

/**
 * 富化避难所对象: 解析 JSONB 字段并派生常用字段
 */
const enrichShelter = (s: any): any => {
  if (!s || typeof s !== 'object') return s
  const contactInfo = normalizeContactInfo(s.contact_info)
  const facilities = typeof s.facilities === 'string' ? parseJSONSafe(s.facilities, {}) : (s.facilities || {})
  return {
    ...s,
    contact_info: contactInfo,
    management_agency: s.management_agency || contactInfo.management_agency || '',
    contact_person: s.contact_person || contactInfo.contact_person || '',
    contact_phone: s.contact_phone || contactInfo.contact_phone || '',
    facilities
  }
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBatchStatusDialog = ref(false)
const editingShelter = ref<Shelter | null>(null)
const currentShelter = ref<Shelter | null>(null)
const selectedRows = ref<(Shelter | ShelterListItem)[]>([])
const formRef = ref<FormInstance>()
const batchStatus = ref<boolean | undefined>(undefined)

// 数据列表
const shelters = ref<Shelter[]>([])
const capacityHistory = ref<any[]>([])
const total = ref(0)

// 统计数据
const totalShelters = computed(() => shelters.value?.length || 0)
const availableShelters = computed(() => 
  shelters.value?.filter(s => s.is_active).length || 0
)
const totalCapacity = computed(() => 
  shelters.value?.reduce((sum, s) => sum + s.capacity, 0) || 0
)
const occupiedCapacity = computed(() => 
  shelters.value?.reduce((sum, s) => sum + (s.current_occupancy || 0), 0) || 0
)

// 查询参数
const queryParams = reactive({
  page: 1,
  page_size: 20,
  name: '',
  shelter_type: undefined as string | undefined,
  // 移除无效的 status 字段，使用数据库真实字段 is_active
  is_active: undefined as boolean | undefined,
  management_agency: ''
})

// 表单数据
const formData = reactive({
  name: '',
  shelter_id: '',
  shelter_type: undefined as string | undefined,
  address: '',
  location: undefined as any,
  longitude: undefined as number | undefined,
  latitude: undefined as number | undefined,
  elevation: undefined as number | undefined,
  capacity: undefined as number | undefined,
  current_occupancy: 0,
  facilities: undefined as any,
  contact_info: undefined as any,
  contact_phone: '',
  contact_person: '',
  management_agency: '',
  access_routes: undefined as any,
  safety_level: undefined as number | undefined,
  operating_hours: undefined as any,
  special_requirements: '',
  notes: '',
  status: '',
  is_active: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入避难所名称', trigger: 'blur' }
  ],
  capacity: [
    { required: true, message: '请输入容量', trigger: 'blur' },
    { type: 'number', min: 1, message: '容量必须大于0', trigger: 'blur' }
  ],
  current_occupancy: [
    { type: 'number', min: 0, message: '当前人数不能小于0', trigger: 'blur' }
  ]
}

// 获取避难所类型文本
const getShelterTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    school: '学校',
    gymnasium: '体育馆',
    community_center: '社区中心',
    park: '公园',
    square: '广场',
    other: '其他'
  }
  return typeMap[type] || type
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: 'success',
    maintenance: 'warning',
    full: 'danger',
    unavailable: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: '可用',
    maintenance: '维护中',
    full: '已满',
    unavailable: '不可用'
  }
  return statusMap[status] || status
}

// 获取使用率百分比
const getOccupancyPercentage = (shelter: Shelter): number => {
  if (!shelter.capacity) return 0
  return Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100)
}

// 获取使用率颜色
const getProgressColor = (shelter: Shelter): string => {
  const percentage = getOccupancyPercentage(shelter)
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

// 获取人数样式类
const getOccupancyClass = (shelter: Shelter): string => {
  const percentage = getOccupancyPercentage(shelter)
  if (percentage >= 90) return 'high-occupancy'
  if (percentage >= 70) return 'medium-occupancy'
  return 'low-occupancy'
}

// 加载避难所列表
const loadShelters = async () => {
  loading.value = true
  try {
    const response = await sheltersApi.getShelters(queryParams)
    if (response.success) {
      // 统一富化映射
      shelters.value = (response.data || []).map((s: any) => enrichShelter(s))
      total.value = response.pagination?.total || shelters.value.length || 0
    } else {
      ElMessage.error(response.message || '加载避难所列表失败')
    }
  } catch (error) {
    console.error('加载避难所列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadShelters()
  ElMessage.success('数据已刷新')
}

// 重置查询条件
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    page_size: 20,
    name: '',
    shelter_type: undefined,
    // 重置为未选择状态
    is_active: undefined as boolean | undefined,
    management_agency: ''
  })
  loadShelters()
}

// 选择变化处理
const handleSelectionChange = (selection: Shelter[]) => {
  selectedRows.value = selection
}

// 查看详情
const viewDetail = async (shelter: Shelter) => {
  currentShelter.value = shelter
  showDetailDialog.value = true
  
  // 加载容量变化历史
  try {
    const response = await sheltersApi.getCapacityHistory(shelter.id)
    if (response.success) {
      capacityHistory.value = response.data
    } else {
      capacityHistory.value = []
    }
  } catch (error) {
    console.error('获取容量历史失败:', error)
    capacityHistory.value = []
  }
}

// 编辑避难所
const editShelter = (shelter: any) => {
  editingShelter.value = shelter
  const ci = normalizeContactInfo(shelter?.contact_info)
  // 从后端返回的数据中提取字段，兼容 shelter_id 和派生字段
  Object.assign(formData, {
    name: shelter.name,
    shelter_id: shelter.shelter_id || shelter.id,
    shelter_type: shelter.shelter_type,
    address: shelter.address,
    location: shelter.location,
    longitude: shelter.location?.coordinates?.[0],
    latitude: shelter.location?.coordinates?.[1],
    elevation: shelter.elevation,
    capacity: shelter.capacity,
    current_occupancy: shelter.current_occupancy,
    facilities: typeof shelter.facilities === 'string' ? parseJSONSafe(shelter.facilities) : shelter.facilities,
    contact_info: ci,
    // 从后端派生字段或原始 contact_info 中提取
    contact_person: shelter.contact_person || ci?.person || '',
    contact_phone: shelter.contact_phone || ci?.phone || ci?.emergency_phone || '',
    management_agency: shelter.management_agency || ci?.management_agency || ci?.agency || ci?.contact || '',
    access_routes: shelter.access_routes,
    safety_level: shelter.safety_level,
    operating_hours: shelter.operating_hours,
    special_requirements: shelter.special_requirements,
    notes: shelter.notes || '',
    status: shelter.status || '',
    is_active: shelter.is_active
  } as any)
  showCreateDialog.value = true
}

// 删除避难所
const deleteShelter = async (id: number) => {
  try {
    const response = await sheltersApi.deleteShelter(id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadShelters()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 批量更新状态
const batchUpdateStatus = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要更新的避难所')
    return
  }
  batchStatus.value = undefined
  showBatchStatusDialog.value = true
}

// 确认批量状态更新
const confirmBatchStatus = async () => {
  if (batchStatus.value === undefined) {
    ElMessage.warning('请选择状态')
    return
  }
  
  try {
    submitting.value = true
    const ids = selectedRows.value.map(row => (row as any).shelter_id || row.id)
    
    const response = await sheltersApi.batchUpdateStatus({
      ids,
      status: batchStatus.value
    })
    
    if (response.success) {
      ElMessage.success(`成功更新 ${ids.length} 个避难所的状态`)
      showBatchStatusDialog.value = false
      selectedRows.value = []
      loadShelters()
    } else {
      ElMessage.error(response.message || '批量更新失败')
    }
  } catch (error) {
    console.error('批量更新失败:', error)
    ElMessage.error('批量更新失败')
  } finally {
    submitting.value = false
  }
}

// 批量导出
const batchExport = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要导出的避难所')
      return
    }
    
    const ids = selectedRows.value.map(row => (row as any).shelter_id || row.id)
    
    const response = await sheltersApi.exportShelters({ ids })
    
    if (response.success && response.data) {
      // 创建下载链接
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `避难所数据_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success(`成功导出 ${selectedRows.value.length} 个避难所数据`)
    } else {
      ElMessage.error(response.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    const ids = selectedRows.value.map(row => (row as any).shelter_id || row.id)
    const response = await sheltersApi.batchDelete(ids)
    
    if (response.success) {
      ElMessage.success(`成功删除 ${ids.length} 个避难所`)
      selectedRows.value = []
      loadShelters()
    } else {
      ElMessage.error(response.message || '批量删除失败')
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 重置表单
const resetForm = () => {
  editingShelter.value = null
  Object.assign(formData, {
    name: '',
    shelter_type: undefined,
    address: '',
    location: undefined,
    elevation: undefined,
    capacity: undefined,
    current_occupancy: 0,
    facilities: undefined,
    contact_info: undefined,
    access_routes: undefined,
    safety_level: undefined,
    operating_hours: undefined,
    special_requirements: '',
    is_active: true
  })
  formRef.value?.resetFields()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true

    // 统一组装 location（经纬度为 number）
    const lon = Number(formData.longitude ?? formData.location?.coordinates?.[0] ?? 0)
    const lat = Number(formData.latitude ?? formData.location?.coordinates?.[1] ?? 0)
    const location = {
      type: 'Point',
      coordinates: [lon, lat]
    }

    // 统一组装 contact_info JSON
    const contact_info = {
      contact_person: formData.contact_person || undefined,
      contact_phone: formData.contact_phone || undefined,
      management_agency: formData.management_agency || undefined
    }

    // 设施解析（字符串->JSON）
    const facilities = typeof (formData as any).facilities === 'string'
      ? parseJSONSafe((formData as any).facilities, {})
      : (formData as any).facilities
    
    // 组装提交数据并确保数值类型
    const submitData = {
      ...formData,
      location,
      contact_info,
      facilities,
      elevation: Number((formData as any).elevation ?? 0),
      capacity: Number((formData as any).capacity ?? 0),
      current_occupancy: Number((formData as any).current_occupancy ?? 0),
      safety_level: Number((formData as any).safety_level ?? 0),
      is_active: !!(formData as any).is_active
    }
    
    const id = editingShelter.value ? (editingShelter.value.id || (editingShelter.value as any).shelter_id) : undefined
    const response = editingShelter.value 
      ? await sheltersApi.updateShelter(id as number, submitData)
      : await sheltersApi.createShelter(submitData)
    
    if (response.success) {
      ElMessage.success(editingShelter.value ? '更新成功' : '创建成功')
      showCreateDialog.value = false
      resetForm()
      loadShelters()
    } else {
      ElMessage.error(response.message || '操作失败')
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
onMounted(() => {
  loadShelters()
})
</script>

<style scoped>
.shelters-container {
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

.shelter-stats {
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

.stat-card.total .stat-icon {
  background: #409eff;
}

.stat-card.available .stat-icon {
  background: #67c23a;
}

.stat-card.capacity .stat-icon {
  background: #e6a23c;
}

.stat-card.occupied .stat-icon {
  background: #f56c6c;
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

.high-occupancy {
  color: #f56c6c;
  font-weight: bold;
}

.medium-occupancy {
  color: #e6a23c;
  font-weight: bold;
}

.low-occupancy {
  color: #67c23a;
}

.shelter-detail {
  padding: 20px 0;
}

.shelter-header {
  margin-bottom: 20px;
}

.shelter-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.shelter-title h3 {
  margin: 0;
  color: #303133;
}

.shelter-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shelter-id {
  font-size: 14px;
  color: #909399;
}

.facilities-section,
.notes-section {
  margin-top: 24px;
}

.facilities-section h4,
.notes-section h4,
.capacity-history h4 {
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

.capacity-history {
  margin-top: 30px;
}

.increase {
  color: #67c23a;
  font-weight: bold;
}

.decrease {
  color: #f56c6c;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shelters-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .shelter-stats {
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
  
  .shelter-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>