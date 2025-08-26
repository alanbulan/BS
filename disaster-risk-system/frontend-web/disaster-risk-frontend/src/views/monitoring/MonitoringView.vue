<template>
  <div class="monitoring-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>监测管理</h2>
        <p>实时监控灾害风险指标，管理监测站点和数据</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="() => { isEditMode = false; editingStationId = null; showAddStationDialog = true }">
          <el-icon><Plus /></el-icon>
          添加监测站
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="success" :disabled="selectedStations.length === 0" @click="confirmBatchUpdate(true)">
          批量激活
        </el-button>
        <el-button type="warning" :disabled="selectedStations.length === 0" @click="confirmBatchUpdate(false)">
          批量停用
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon online">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stationStats.online }}</div>
              <div class="stats-label">在线站点</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon offline">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stationStats.offline }}</div>
              <div class="stats-label">离线站点</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon warning">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stationStats.warning }}</div>
              <div class="stats-label">预警站点</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-icon total">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stationStats.total }}</div>
              <div class="stats-label">总站点数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="站点名称">
          <el-input
            v-model="queryParams.name"
            placeholder="搜索站点名称或编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="监测类型">
          <el-select v-model="queryParams.station_type" placeholder="请选择监测类型" clearable style="width: 180px" filterable>
            <el-option
              v-for="opt in stationTypeOptions"
              :key="opt.code"
              :label="opt.name_zh"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="运行状态">
          <el-select v-model="queryParams.is_active" placeholder="请选择运行状态" clearable style="width: 120px">
            <el-option label="激活" value="true" />
            <el-option label="未激活" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetQuery">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 监测站点管理 -->
    <div class="stations-section">
      <!-- 监测站点表格 -->
      <div class="table-section">
        <el-table 
          ref="tableRef"
          :data="filteredStations" 
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
        >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="station_id" label="站点编码" width="120" />
        <el-table-column prop="name" label="站点名称" min-width="150" />
        <el-table-column prop="station_type" label="监测类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.station_type)">
              {{ scope.row.station_type_name || getTypeText(scope.row.station_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="zone_name" label="所属区域" min-width="150">
          <template #default="scope">
            {{ scope.row.zone_name || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column label="坐标位置" min-width="200">
          <template #default="scope">
            <span v-if="scope.row.longitude && scope.row.latitude">
              {{ scope.row.longitude.toFixed(6) }}, {{ scope.row.latitude.toFixed(6) }}
            </span>
            <span v-else>未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.is_active)">
              {{ getStatusText(scope.row.is_active) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_data_time" label="最后数据时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.last_data_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="viewStationDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" @click="editStation(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteStation(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalStations"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑监测站对话框 -->
    <el-dialog v-model="showAddStationDialog" :title="isEditMode ? '编辑监测站' : '添加监测站'" width="600px">
      <el-form :model="stationForm" :rules="stationRules" ref="stationFormRef" label-width="100px">
        <el-form-item label="站点编码" prop="station_id">
          <el-input v-model="stationForm.station_id" placeholder="请输入站点编码" />
        </el-form-item>
        <el-form-item label="站点名称" prop="name">
          <el-input v-model="stationForm.name" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="监测类型" prop="station_type">
          <el-select v-model="stationForm.station_type" placeholder="请选择监测类型" filterable>
            <el-option
              v-for="opt in stationTypeOptions"
              :key="opt.code"
              :label="opt.name_zh"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="stationForm.location" placeholder="请输入位置描述" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="stationForm.longitude" :precision="6" placeholder="经度" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="stationForm.latitude" :precision="6" placeholder="纬度" />
        </el-form-item>
        <el-form-item label="海拔(米)">
          <el-input-number v-model="stationForm.elevation" :precision="2" :min="-500" :max="9000" placeholder="海拔/高程" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stationForm.description" type="textarea" rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button type="primary" @click="submitStationForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Plus, Refresh, Search, Monitor, Warning, Bell, DataAnalysis 
} from '@element-plus/icons-vue'
import { monitoringStationsApi } from '@/api/modules/monitoring'
import { monitoringStationTypesApi } from '@/api/modules/monitoring-station-types'
import type { MonitoringStation } from '@/api/modules/monitoring'
import type { MonitoringStationType } from '@/types'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
// 表格Ref，用于清空选择
const tableRef = ref()
// 对话框模式：新增/编辑
let isEditMode = ref(false)
let editingStationId = ref<number | null>(null)
// 移除了顶部标签页，activeTab 不再需要
const showAddStationDialog = ref(false)

// 搜索和筛选
const queryParams = ref({
  name: '',
  station_type: '',
  is_active: ''
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const totalStations = ref(0)

// 监测站点数据
const allStations = ref<MonitoringStation[]>([])
const selectedStations = ref<MonitoringStation[]>([])

// 统计数据
const stationStats = ref({
  online: 0,
  offline: 0,
  warning: 0,
  total: 0
})

// 实时数据
// const selectedStation = ref<number | null>(null)
// const latestData = ref<MonitoringData[]>([])
// const chartContainer = ref<HTMLElement>()

// 历史数据查询
// const historyQuery = ref({
//   stationId: null as number | null,
//   dateRange: [] as string[]
// })
// const historyChartContainer = ref<HTMLElement>()

// 定时器
// // // let dataRefreshInterval: number | null = null

// 添加监测站表单
const stationFormRef = ref()
const stationForm = ref({
  station_id: '',
  name: '',
  station_type: '',
  location: '',
  longitude: undefined as number | undefined,
  latitude: undefined as number | undefined,
  elevation: undefined as number | undefined,
  description: ''
})

const stationRules = {
  station_id: [{ required: true, message: '请输入站点编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  station_type: [{ required: true, message: '请选择监测类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入位置描述', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }]
}

// 定时器
// let dataRefreshInterval: number | null = null

// 计算属性
const filteredStations = computed(() => {
  let result = allStations.value || []
  
  // 搜索过滤
  if (queryParams.value.name) {
    const query = queryParams.value.name.toLowerCase()
    result = result.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.station_id.toLowerCase().includes(query)
    )
  }
  
  // 类型过滤
  if (queryParams.value.station_type) {
    result = result.filter(station => station.station_type === queryParams.value.station_type)
  }
  
  // 状态过滤
  if (queryParams.value.is_active) {
    const isActive = queryParams.value.is_active === 'true'
    result = result.filter(station => station.is_active === isActive)
  }
  
  return result
})


// 获取监测站点列表
const fetchStations = async () => {
  try {
    loading.value = true
    
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageSize.value,
      search: queryParams.value.name || undefined,
      station_type: queryParams.value.station_type || undefined,
      is_active: queryParams.value.is_active || undefined
    }
    
    // 清理空值参数
    Object.keys(params).forEach((key: string) => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    
    const response = await monitoringStationsApi.getStations(params)
    
    if (response.success) {
      allStations.value = response.data || []
      totalStations.value = response.pagination?.total || 0
      updateStationStats()
    } else {
      console.error('API返回失败:', response)
      ElMessage.error(response.message || '获取监测站点失败')
    }
  } catch (error: any) {
    console.error('获取监测站点失败:', error)
    console.error('错误详情:', error.response || error.message || error)
    ElMessage.error('获取监测站点失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStationStats = () => {
  const stats = {
    online: 0,
    offline: 0,
    warning: 0,
    total: allStations.value.length
  }
  
  allStations.value.forEach(station => {
    if (station.is_active) {
      stats.online++
    } else {
      stats.offline++
    }
  })
  
  stationStats.value = stats
}

// 刷新数据
const refreshData = async () => {
  await fetchStations()
  ElMessage.success('数据刷新成功')
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchStations()
}

// 重置查询
const resetQuery = () => {
  queryParams.value = {
    name: '',
    station_type: '',
    is_active: ''
  }
  currentPage.value = 1
  fetchStations()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchStations()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchStations()
}

// 选择处理
const handleSelectionChange = (selection: MonitoringStation[]) => {
  selectedStations.value = selection
}

// 查看站点详情
const viewStationDetail = (station: MonitoringStation) => {
  // 跳转到站点详情页面
  router.push(`/monitoring/stations/${station.id}`)
}

// 编辑站点
const editStation = (station: MonitoringStation) => {
  // 填充表单数据（修正 location/notes 映射）
  stationForm.value = {
    station_id: station.station_id,
    name: station.name,
    station_type: station.station_type,
    location: station.location || '',
    longitude: station.longitude,
    latitude: station.latitude,
    elevation: station.elevation ?? station.altitude,
    description: station.notes || ''
  }
  isEditMode.value = true
  editingStationId.value = station.id
  // 显示编辑对话框
  showAddStationDialog.value = true
}

// 删除站点
const deleteStation = async (station: MonitoringStation) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除监测站 "${station.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await monitoringStationsApi.deleteStation(station.id)
    if (response.success) {
      ElMessage.success('删除成功')
      fetchStations()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除站点失败:', error)
      ElMessage.error('删除站点失败')
    }
  }
}

/**
 * 提交监测站表单
 * - 新增：POST /monitoring/stations
 * - 编辑：PUT /monitoring/stations/:id
 * - 字段映射：前端 description 字段映射为后端 notes 字段
 */
const submitStationForm = async () => {
  try {
    await stationFormRef.value?.validate()

    // 构造后端所需payload，映射 description -> notes
    const payload: any = {
      station_id: stationForm.value.station_id,
      name: stationForm.value.name,
      station_type: stationForm.value.station_type,
      location: stationForm.value.location,
      longitude: stationForm.value.longitude,
      latitude: stationForm.value.latitude,
      elevation: stationForm.value.elevation,
      notes: stationForm.value.description || undefined
    }

    let response
    if (isEditMode.value && editingStationId.value) {
      response = await monitoringStationsApi.updateStation(editingStationId.value, payload)
    } else {
      response = await monitoringStationsApi.createStation(payload)
    }

    if (response.success) {
      ElMessage.success(isEditMode.value ? '更新监测站成功' : '添加监测站成功')
      showAddStationDialog.value = false
      resetStationForm()
      // 清理编辑状态
      isEditMode.value = false
      editingStationId.value = null
      fetchStations()
    }
  } catch (error) {
    console.error(isEditMode.value ? '更新监测站失败:' : '添加监测站失败:', error)
    ElMessage.error(isEditMode.value ? '更新监测站失败' : '添加监测站失败')
  }
}

// 取消对话框
const handleDialogCancel = () => {
  showAddStationDialog.value = false
  // 重置编辑状态
  isEditMode.value = false
  editingStationId.value = null
  resetStationForm()
}

// 重置表单
const resetStationForm = () => {
  stationForm.value = {
    station_id: '',
    name: '',
    station_type: '',
    location: '',
    longitude: undefined,
    latitude: undefined,
    elevation: undefined,
    description: ''
  }
  stationFormRef.value?.resetFields()
}

/**
 * 批量状态更新确认框
 * @param isActive 目标状态：true 激活，false 停用
 */
const confirmBatchUpdate = async (isActive: boolean) => {
  if (!selectedStations.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定对选中的 ${selectedStations.value.length} 个监测站执行“${isActive ? '激活' : '停用'}”操作吗？`,
      '批量状态更新',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await batchUpdateStatus(isActive)
  } catch (e) {
    // 取消
  }
}

/**
 * 批量更新选中监测站的 is_active 状态
 * 使用后端接口：POST /monitoring/stations/batch-update-status
 * 请求体：{ station_ids: number[], is_active: boolean }
 */
const batchUpdateStatus = async (isActive: boolean) => {
  const ids = selectedStations.value.map(s => s.id)
  if (!ids.length) return
  try {
    // 在批量更新调用处，保持原有布尔入参用法（新API已向后兼容）
    const resp = await monitoringStationsApi.batchUpdateStationStatus(ids, isActive)
    if (resp.success) {
      ElMessage.success(`批量更新成功，影响 ${resp.data?.updated_count ?? ids.length} 条`)
      // 刷新并清空选择
      await fetchStations()
      selectedStations.value = []
      tableRef.value?.clearSelection?.()
    } else {
      ElMessage.error(resp.message || '批量更新失败')
    }
  } catch (err) {
    console.error('批量更新失败:', err)
    ElMessage.error('批量更新失败')
  }
}

// 工具函数
const getTypeTagType = (type: string) => {
  // 与详情页保持一致的颜色映射
  switch (type) {
    case 'geological': return 'warning'
    case 'meteorological': return 'primary'
    case 'hydrological': return 'success'
    case 'environmental': return 'info'
    default: return 'info'
  }
}

// 监测站类型选项
const stationTypeOptions = ref<MonitoringStationType[]>([])

const getTypeText = (typeCode: string) => {
  const foundType = stationTypeOptions.value.find(type => type.code === typeCode)
  return foundType ? foundType.name_zh : typeCode
}

// 加载监测站类型
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

const getStatusTagType = (isActive: boolean) => {
  return isActive ? 'success' : 'danger'
}

const getStatusText = (isActive: boolean) => {
  return isActive ? '在线' : '离线'
}

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}


// 生命周期
onMounted(async () => {
  await loadStationTypes()
  fetchStations()
})

onUnmounted(() => {
  // 无
})
</script>

<style scoped>
.monitoring-container {
  padding: 20px;
}

/* 页面头部样式 */
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

.header-right {
  display: flex;
  gap: 12px;
}

/* 统计概览样式 */
.stats-overview {
  margin-bottom: 24px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
}

.stats-icon.online {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

.stats-icon.offline {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: white;
}

.stats-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
  color: white;
}

.stats-icon.total {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  line-height: 1;
}

/* 选项卡样式 */
.monitoring-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.monitoring-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.monitoring-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
}

.monitoring-tabs :deep(.el-tabs__content) {
  padding: 24px;
}

/* 筛选区域样式 */
.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-section .el-form {
  margin-bottom: 0;
}

.filter-section .el-form-item {
  margin-bottom: 0;
  margin-right: 20px;
}

.filter-section .el-form-item:last-child {
  margin-right: 0;
}

/* 表格区域样式 */
.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table-section .el-table {
  border-radius: 8px;
}

.table-section :deep(.el-table__header) {
  background: #fafafa;
}

.table-section :deep(.el-table th) {
  background: #fafafa;
  color: #606266;
  font-weight: 600;
}

.table-section :deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}

.table-section :deep(.el-table__row:hover) {
  background: #f5f7fa;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

/* 实时数据区域样式 */
.realtime-section {
  min-height: 400px;
}

.chart-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.latest-data-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 480px;
}

.latest-data-list {
  max-height: 400px;
  overflow-y: auto;
}

.data-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.data-item:hover {
  background-color: #f5f7fa;
}

.data-item:last-child {
  border-bottom: none;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.station-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.data-time {
  font-size: 12px;
  color: #909399;
}

.data-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.value-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.value-label {
  color: #606266;
}

.value-number {
  color: #409eff;
  font-weight: 500;
}

/* 历史数据区域样式 */
.history-section {
  min-height: 400px;
}

.query-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.history-chart-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.history-chart-container {
  height: 500px;
  width: 100%;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  background: #fafafa;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 20px 24px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monitoring-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-overview .el-col {
    margin-bottom: 16px;
  }
  
  .filter-section .el-form {
    flex-direction: column;
  }
  
  .filter-section .el-form-item {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  .realtime-section .el-col {
    margin-bottom: 20px;
  }
  
  .chart-container,
  .history-chart-container {
    height: 300px;
  }
}
</style>