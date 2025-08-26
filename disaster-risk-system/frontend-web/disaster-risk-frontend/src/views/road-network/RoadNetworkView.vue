<template>
  <div class="road-network-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>道路网络管理</h2>
        <p>管理道路网络信息和应急路线配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增道路
        </el-button>
        <el-button type="success" @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="loadRoads">
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
          <div class="stat-number">{{ totalRoads }}</div>
          <div class="stat-label">总道路数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon good">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ goodConditionRoads }}</div>
          <div class="stat-label">良好状态</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon emergency">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ emergencyRoutes }}</div>
          <div class="stat-label">应急路线</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon maintenance">
          <el-icon><Tools /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ maintenanceRoads }}</div>
          <div class="stat-label">维护中</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="道路编号">
          <el-input
            v-model="queryParams.road_id"
            placeholder="请输入道路编号"
            clearable
            @keyup.enter="loadRoads"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="道路名称">
          <el-input
            v-model="queryParams.search"
            placeholder="请输入道路名称"
            clearable
            @keyup.enter="loadRoads"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="道路类型">
          <el-select
            v-model="queryParams.road_type"
            placeholder="请选择道路类型"
            clearable
            style="width: 150px"
          >
            <el-option label="高速公路" value="highway" />
            <el-option label="国道" value="national" />
            <el-option label="省道" value="provincial" />
            <el-option label="县道" value="county" />
            <el-option label="乡道" value="rural" />
            <el-option label="城市道路" value="urban" />
          </el-select>
        </el-form-item>
        <el-form-item label="道路等级">
          <el-select
            v-model="queryParams.road_class"
            placeholder="请选择道路等级"
            clearable
            style="width: 120px"
          >
            <el-option label="一级" value="1" />
            <el-option label="二级" value="2" />
            <el-option label="三级" value="3" />
            <el-option label="四级" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select
            v-model="queryParams.maintenance_status"
            placeholder="请选择维护状态"
            clearable
            style="width: 120px"
          >
            <el-option label="良好" value="good" />
            <el-option label="一般" value="fair" />
            <el-option label="较差" value="poor" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="应急路线">
          <el-select
            v-model="queryParams.is_emergency_route"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRoads">
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
        :data="roads"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="road_id" label="道路编号" width="120">
           <template #default="{ row }">
             {{ row.road_id || '-' }}
           </template>
         </el-table-column>
        <el-table-column prop="name" label="道路名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="road_type" label="道路类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoadTypeTagType(row.road_type || '')">
              {{ getRoadTypeText(row.road_type || '') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="road_class" label="等级" width="80">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ row.road_class }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="width" label="宽度(m)" width="100" />
        <el-table-column prop="surface_type" label="路面类型" width="100">
          <template #default="{ row }">
            {{ getSurfaceTypeText(row.surface_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="max_speed" label="限速(km/h)" width="100" />
        <el-table-column prop="maintenance_status" label="维护状态" width="100">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="getMaintenanceStatusType(row.maintenance_status || 'unknown')"
            >
              {{ getMaintenanceStatusText(row.maintenance_status || 'unknown') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_emergency_route" label="应急路线" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_emergency_route"
              @change="toggleEmergencyRoute(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
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
              @click="editRoad(row)"
            >
              编辑
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="viewOnMap(row)"
            >
              地图
            </el-button>
            <el-popconfirm
              title="确定要删除这条道路吗？"
              @confirm="deleteRoad(row.id)"
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
          @size-change="loadRoads"
          @current-change="loadRoads"
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
            <el-button size="small" @click="batchSetEmergencyRoute(true)">
              <el-icon><Check /></el-icon>
              设为应急路线
            </el-button>
            <el-button size="small" @click="batchSetEmergencyRoute(false)">
              <el-icon><Close /></el-icon>
              取消应急路线
            </el-button>
            <el-button size="small" @click="batchUpdateCondition">
              <el-icon><Tools /></el-icon>
              批量更新状态
            </el-button>
            <el-button size="small" @click="exportSelected">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-popconfirm
              title="确定要删除选中的道路吗？"
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
      :title="editingRoad ? '编辑道路' : '新增道路'"
      width="1000px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="道路编号" prop="road_id">
            <el-input v-model="formData.road_id" placeholder="请输入道路编号" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="道路名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入道路名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="道路类型" prop="road_type">
              <el-select v-model="formData.road_type" placeholder="请选择道路类型" style="width: 100%">
                <el-option label="高速公路" value="highway" />
                <el-option label="国道" value="national" />
                <el-option label="省道" value="provincial" />
                <el-option label="县道" value="county" />
                <el-option label="乡道" value="rural" />
                <el-option label="城市道路" value="urban" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="道路等级" prop="road_class">
              <el-select v-model="formData.road_class" placeholder="请选择道路等级" style="width: 100%">
                <el-option label="一级" value="1" />
                <el-option label="二级" value="2" />
                <el-option label="三级" value="3" />
                <el-option label="四级" value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="路面类型">
              <el-select v-model="formData.surface_type" placeholder="请选择路面类型" style="width: 100%">
                <el-option label="沥青" value="asphalt" />
                <el-option label="水泥" value="concrete" />
                <el-option label="碎石" value="gravel" />
                <el-option label="土路" value="dirt" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="道路宽度(m)">
              <el-input-number v-model="formData.width" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="最大限速(km/h)">
              <el-input-number v-model="formData.max_speed" :min="10" :max="200" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="双向通行">
              <el-switch v-model="formData.is_bidirectional" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="应急路线">
              <el-switch v-model="formData.is_emergency_route" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="维护状态">
              <el-select v-model="formData.maintenance_status" placeholder="请选择维护状态" style="width: 100%">
                <el-option label="良好" value="good" />
                <el-option label="一般" value="fair" />
                <el-option label="较差" value="poor" />
                <el-option label="维护中" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通行能力(车/小时)">
              <el-input-number v-model="formData.traffic_capacity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="几何信息">
          <el-input
            v-model="geometryJson"
            type="textarea"
            :rows="4"
            placeholder="请输入GeoJSON格式的几何信息"
          />
        </el-form-item>
        
        <el-form-item label="高程剖面">
          <el-input
            v-model="elevationProfileJson"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的高程剖面数据"
          />
        </el-form-item>
        
        <el-form-item label="桥梁隧道信息">
          <el-input
            v-model="bridgeTunnelInfoJson"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的桥梁隧道信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingRoad ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入道路数据"
      width="600px"
    >
      <el-upload
        class="upload-demo"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleImportSuccess"
        :on-error="handleImportError"
        :before-upload="beforeUpload"
        accept=".csv,.xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 CSV、Excel 格式文件，文件大小不超过 10MB
          </div>
        </template>
      </el-upload>
      
      <div class="import-template">
        <el-divider>模板下载</el-divider>
        <el-button type="primary" @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载导入模板
        </el-button>
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="道路详情"
      width="1200px"
    >
      <div v-if="currentRoad" class="road-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="道路ID">{{ currentRoad.id }}</el-descriptions-item>
          <el-descriptions-item label="道路编号">{{ currentRoad.road_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="道路名称">{{ currentRoad.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="道路类型">
            <el-tag :type="getRoadTypeTagType(currentRoad.road_type || '')">
              {{ getRoadTypeText(currentRoad.road_type || '') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="道路等级">{{ currentRoad.road_class }}级</el-descriptions-item>
          <el-descriptions-item label="路面类型">{{ getSurfaceTypeText(currentRoad.surface_type || '') }}</el-descriptions-item>
          <el-descriptions-item label="道路宽度">{{ currentRoad.width || '-' }}米</el-descriptions-item>
          <el-descriptions-item label="最大限速">{{ currentRoad.max_speed || '-' }}km/h</el-descriptions-item>
          <el-descriptions-item label="双向通行">
            <el-tag :type="currentRoad.is_bidirectional ? 'success' : 'danger'">
              {{ currentRoad.is_bidirectional ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护状态">
            <el-tag :type="getMaintenanceStatusType(currentRoad.maintenance_status || 'unknown')">
              {{ getMaintenanceStatusText(currentRoad.maintenance_status || 'unknown') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="通行能力">{{ currentRoad.traffic_capacity || '-' }}车/小时</el-descriptions-item>
          <el-descriptions-item label="应急路线">
            <el-tag :type="currentRoad.is_emergency_route ? 'success' : 'info'">
              {{ currentRoad.is_emergency_route ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="3">{{ formatDateTime(currentRoad.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="3">{{ formatDateTime(currentRoad.updated_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentRoad.geometry" class="detail-section">
          <h4>几何信息</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentRoad.geometry, null, 2) }}</pre>
          </el-card>
        </div>
        
        <div v-if="currentRoad.elevation_profile" class="detail-section">
          <h4>高程剖面</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentRoad.elevation_profile, null, 2) }}</pre>
          </el-card>
        </div>
        
        <div v-if="currentRoad.bridge_tunnel_info" class="detail-section">
          <h4>桥梁隧道信息</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentRoad.bridge_tunnel_info, null, 2) }}</pre>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { RoadNetwork } from '../../types'
import { formatDateTime } from '../../utils'
import { roadNetworkApi } from '../../api/modules'
import router from '../../router'
import { useAuthStore } from '../../stores/auth'
import {
  Plus,
  Refresh,
  Search,
  DataBoard,
  Check,
  Warning,
  Tools,
  Close,
  Delete,
  Download,
  Upload,
  UploadFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const authStore = useAuthStore()
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showImportDialog = ref(false)
const editingRoad = ref<RoadNetwork | null>(null)
const currentRoad = ref<RoadNetwork | null>(null)
const selectedRows = ref<RoadNetwork[]>([])
const formRef = ref<FormInstance>()

// JSON字段
const geometryJson = ref('')
const elevationProfileJson = ref('')
const bridgeTunnelInfoJson = ref('')

// 数据列表
const roads = ref<RoadNetwork[]>([])
const total = ref(0)

// 统计数据
const totalRoads = computed(() => Array.isArray(roads.value) ? roads.value.length : 0)
const goodConditionRoads = computed(() => Array.isArray(roads.value) ? roads.value.filter(r => r.maintenance_status === 'good').length : 0)
const emergencyRoutes = computed(() => Array.isArray(roads.value) ? roads.value.filter(r => r.is_emergency_route).length : 0)
const maintenanceRoads = computed(() => Array.isArray(roads.value) ? roads.value.filter(r => r.maintenance_status === 'maintenance').length : 0)

// 上传配置
const uploadUrl = ref('/api/road-network/batch-import')
const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
})

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  search: '',
  road_id: '',
  road_type: '',
  road_class: '',
  maintenance_status: '',
  is_emergency_route: undefined as boolean | undefined
})

// 表单数据
const formData = reactive({
  road_id: '',
  name: '',
  road_type: '',
  road_class: 1,
  width: 10,
  surface_type: 'asphalt',
  max_speed: 60,
  is_bidirectional: true,
  maintenance_status: 'good',
  traffic_capacity: 1000,
  is_emergency_route: false
})

// 表单验证规则
const formRules = {
  road_id: [
    { required: true, message: '请输入道路编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入道路名称', trigger: 'blur' }
  ],
  road_type: [
    { required: true, message: '请选择道路类型', trigger: 'change' }
  ],
  road_class: [
    { required: true, message: '请选择道路等级', trigger: 'change' }
  ]
}

// 获取道路类型标签类型
const getRoadTypeTagType = (type: string): string => {
  const typeMap: Record<string, string> = {
    highway: 'danger',
    national: 'warning',
    provincial: 'success',
    county: 'info',
    rural: '',
    urban: 'primary'
  }
  return typeMap[type] || ''
}

// 获取道路类型文本
const getRoadTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    highway: '高速公路',
    national: '国道',
    provincial: '省道',
    county: '县道',
    rural: '乡道',
    urban: '城市道路'
  }
  return textMap[type] || type
}

// 获取路面类型文本
const getSurfaceTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    asphalt: '沥青',
    concrete: '水泥',
    gravel: '碎石',
    dirt: '土路'
  }
  return textMap[type] || type
}

// 获取维护状态类型
const getMaintenanceStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    good: 'success',
    fair: 'warning',
    poor: 'danger',
    maintenance: 'info',
    unknown: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取维护状态文本
const getMaintenanceStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    good: '良好',
    fair: '一般',
    poor: '较差',
    maintenance: '维护中',
    unknown: '未知'
  }
  return textMap[status] || status
}

// 加载道路列表
const loadRoads = async () => {
  try {
    loading.value = true
    
    // 检查用户是否已登录
    const token = localStorage.getItem('accessToken')
    if (!token) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }
    
    const response = await roadNetworkApi.getRoadNetworks(queryParams)
    if (response.success) {
      roads.value = Array.isArray(response.data) ? response.data : []
      total.value = response.pagination?.total || 0
    }
  } catch (error: any) {
    console.error('加载道路数据失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userInfo')
      router.push('/login')
    } else {
      ElMessage.error('加载数据失败')
    }
  } finally {
    loading.value = false
  }
}

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    limit: 20,
    search: '',
    road_id: '',
    road_type: '',
    road_class: '',
    maintenance_status: '',
    is_emergency_route: undefined
  })
  loadRoads()
}

// 选择变化
const handleSelectionChange = (selection: RoadNetwork[]) => {
  selectedRows.value = selection
}

// 切换应急路线状态
const toggleEmergencyRoute = async (row: RoadNetwork) => {
  try {
    const response = await roadNetworkApi.setEmergencyRoute(row.id, row.is_emergency_route || false)
    if (response.success) {
      ElMessage.success('应急路线状态更新成功')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    row.is_emergency_route = !row.is_emergency_route // 回滚状态
  }
}

// 查看详情
const viewDetails = (row: RoadNetwork) => {
  currentRoad.value = row
  showDetailDialog.value = true
}

// 在地图上查看
const viewOnMap = (row: RoadNetwork) => {
  // 跳转到地图页面并定位到该道路
  router.push({
    name: 'Map',
    query: {
      type: 'road',
      id: row.id,
      lat: row.geometry?.coordinates?.[0]?.[1] || 0,
      lng: row.geometry?.coordinates?.[0]?.[0] || 0
    }
  })
}

// 编辑道路
const editRoad = (row: RoadNetwork) => {
  editingRoad.value = row
  Object.assign(formData, {
    road_id: row.road_id,
    name: row.name,
    road_type: row.road_type,
    road_class: row.road_class,
    width: row.width,
    surface_type: row.surface_type,
    max_speed: row.max_speed,
    is_bidirectional: row.is_bidirectional,
    maintenance_status: row.maintenance_status,
    traffic_capacity: row.traffic_capacity,
    is_emergency_route: row.is_emergency_route
  })
  
  geometryJson.value = row.geometry ? JSON.stringify(row.geometry, null, 2) : ''
  elevationProfileJson.value = row.elevation_profile ? JSON.stringify(row.elevation_profile, null, 2) : ''
  bridgeTunnelInfoJson.value = row.bridge_tunnel_info ? JSON.stringify(row.bridge_tunnel_info, null, 2) : ''
  
  showCreateDialog.value = true
}

// 删除道路
const deleteRoad = async (id: number) => {
  try {
    const response = await roadNetworkApi.deleteRoadNetwork(id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadRoads()
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 批量设置应急路线
const batchSetEmergencyRoute = async (isEmergency: boolean) => {
  try {
    const promises = selectedRows.value.map(row => 
      roadNetworkApi.setEmergencyRoute(row.id, isEmergency)
    )
    await Promise.all(promises)
    ElMessage.success('批量操作成功')
    loadRoads()
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  }
}

// 批量更新状态
const batchUpdateCondition = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要更新的道路')
      return
    }
    
    const { value: condition } = await ElMessageBox.prompt('请输入新的维护状态', '批量更新状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (value: string) => {
        if (!value) return '请输入状态'
        return true
      }
    })
    
    const promises = selectedRows.value.map(row => 
      roadNetworkApi.updateRoadCondition(row.id, condition)
    )
    await Promise.all(promises)
    ElMessage.success('批量更新成功')
    loadRoads()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量更新失败:', error)
      ElMessage.error('批量更新失败')
    }
  }
}

// 导出选中
const exportSelected = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要导出的道路')
      return
    }
    
    const ids = selectedRows.value.map(row => row.id)
    
    const blob = await roadNetworkApi.exportRoads({ ids })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `道路网络数据_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedRows.value.length} 个道路数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    const promises = selectedRows.value.map(row => 
      roadNetworkApi.deleteRoadNetwork(row.id)
    )
    await Promise.all(promises)
    ElMessage.success('批量删除成功')
    loadRoads()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 下载模板
const downloadTemplate = () => {
  try {
    // 创建模板数据
    const templateData = [
      {
        name: '示例道路',
        road_type: 'highway',
        road_class: 'primary',
        width: 12.5,
        surface_type: 'asphalt',
        max_speed: 80,
        is_bidirectional: true,
        maintenance_status: 'good',
        traffic_capacity: 2000,
        is_emergency_route: false
      }
    ]
    
    // 导出为Excel
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '道路网络模板')
      XLSX.writeFile(wb, '道路网络导入模板.xlsx')
      ElMessage.success('模板下载成功')
    })
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  }
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isValidType = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isValidType) {
    ElMessage.error('只能上传 CSV 或 Excel 格式的文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

// 导入成功
const handleImportSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('导入成功')
    showImportDialog.value = false
    loadRoads()
  } else {
    ElMessage.error(response.message || '导入失败')
  }
}

// 导入失败
const handleImportError = () => {
  ElMessage.error('导入失败')
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    road_id: '',
    name: '',
    road_type: '',
    road_class: '',
    width: 10,
    surface_type: 'asphalt',
    max_speed: 60,
    is_bidirectional: true,
    maintenance_status: 'good',
    traffic_capacity: 1000,
    is_emergency_route: false
  })
  
  geometryJson.value = ''
  elevationProfileJson.value = ''
  bridgeTunnelInfoJson.value = ''
  editingRoad.value = null
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
    let geometry = null
    let elevationProfile = null
    let bridgeTunnelInfo = null
    
    if (geometryJson.value.trim()) {
      try {
        geometry = JSON.parse(geometryJson.value)
      } catch (error) {
        ElMessage.error('几何信息格式错误，请输入有效的JSON')
        return
      }
    }
    
    if (elevationProfileJson.value.trim()) {
      try {
        elevationProfile = JSON.parse(elevationProfileJson.value)
      } catch (error) {
        ElMessage.error('高程剖面格式错误，请输入有效的JSON')
        return
      }
    }
    
    if (bridgeTunnelInfoJson.value.trim()) {
      try {
        bridgeTunnelInfo = JSON.parse(bridgeTunnelInfoJson.value)
      } catch (error) {
        ElMessage.error('桥梁隧道信息格式错误，请输入有效的JSON')
        return
      }
    }
    
    const data = {
      ...formData,
      road_class: Number(formData.road_class),
      width: Number(formData.width),
      max_speed: Number(formData.max_speed),
      traffic_capacity: Number(formData.traffic_capacity),
      geometry,
      elevation_profile: elevationProfile,
      bridge_tunnel_info: bridgeTunnelInfo
    }
    
    let response
    if (editingRoad.value) {
      response = await roadNetworkApi.updateRoadNetwork(editingRoad.value.id, data)
    } else {
      response = await roadNetworkApi.createRoadNetwork(data)
    }
    
    if (response.success) {
      ElMessage.success(editingRoad.value ? '更新成功' : '创建成功')
      showCreateDialog.value = false
      resetForm()
      loadRoads()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载
onMounted(async () => {
  // 先初始化认证状态
  await authStore.initializeAuth()
  // 然后加载数据
  loadRoads()
})
</script>

<style scoped>
.road-network-container {
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

.stat-icon.good {
  background: #67c23a;
}

.stat-icon.emergency {
  background: #e6a23c;
}

.stat-icon.maintenance {
  background: #909399;
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

.road-detail {
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

.upload-demo {
  margin-bottom: 20px;
}

.import-template {
  text-align: center;
  margin-top: 20px;
}
</style>