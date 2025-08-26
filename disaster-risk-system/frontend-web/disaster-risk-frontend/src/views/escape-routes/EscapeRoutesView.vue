<template>
  <div class="escape-routes-view">
    <div class="page-header">
      <div class="header-left">
        <h2>逃生路径管理</h2>
        <p>管理和维护应急逃生路径信息</p>
      </div>
    </div>

    <div class="content-area">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>逃生路径列表</span>
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              新增路径
            </el-button>
          </div>
        </template>

        <!-- 筛选区域 -->
        <div class="filter-section">
          <el-form :model="filters" inline>
            <el-form-item label="路径编号">
              <el-input v-model="filters.route_id" placeholder="请输入路径编号" clearable />
            </el-form-item>
            <el-form-item label="难度等级">
              <el-select v-model="filters.difficulty_level" placeholder="请选择难度等级" clearable>
                <el-option label="简单" :value="1" />
                <el-option label="一般" :value="2" />
                <el-option label="困难" :value="3" />
                <el-option label="很困难" :value="4" />
                <el-option label="极困难" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item label="验证状态">
              <el-select v-model="filters.verification_status" placeholder="请选择验证状态" clearable>
                <el-option label="待验证" value="pending" />
                <el-option label="已验证" value="verified" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadRoutes">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <el-table :data="routes" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="route_id" label="路径编号" width="140" />
          <el-table-column label="起点坐标" min-width="160">
            <template #default="{ row }">
              {{ formatPoint(row.start_point) }}
            </template>
          </el-table-column>
          <el-table-column label="终点坐标" min-width="160">
            <template #default="{ row }">
              {{ formatPoint(row.end_point) }}
            </template>
          </el-table-column>
          <el-table-column label="路径几何" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('路径几何 route_geometry', row.route_geometry)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="distance_meters" label="距离(米)" width="100" />
          <el-table-column prop="estimated_time_minutes" label="预计用时(分钟)" width="120" />
          <el-table-column prop="difficulty_level" label="难度等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getDifficultyTagType(row.difficulty_level)">
                {{ getDifficultyText(row.difficulty_level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="elevation_gain" label="爬升高度(米)" width="120" />
          <el-table-column label="路径条件" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('路径条件 route_conditions', row.route_conditions)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column label="路径点" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('路径点 waypoints', row.waypoints)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column label="备选路径" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('备选路径 alternative_routes', row.alternative_routes)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="safety_score" label="安全评分" width="100" />
          <el-table-column label="天气依赖性" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('天气依赖性 weather_dependency', row.weather_dependency)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column label="无障碍信息" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openJsonDetail('无障碍信息 accessibility_info', row.accessibility_info)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="last_verified_date" label="最后验证日期" width="140" />
          <el-table-column prop="verification_status" label="验证状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.verification_status)">
                {{ getStatusText(row.verification_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" />
          <el-table-column prop="updated_at" label="更新时间" width="170" />
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="viewRoute(row)">详情</el-button>
                <el-button size="small" type="primary" @click="editRoute(row)">编辑</el-button>
                <el-dropdown @command="(cmd: 'verified'|'pending'|'rejected') => onVerifyCommand(row, cmd)">
                  <el-button size="small" type="success">
                    审核
                    <el-icon style="margin-left: 4px;"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="verified">设为已验证</el-dropdown-item>
                      <el-dropdown-item command="pending">设为待验证</el-dropdown-item>
                      <el-dropdown-item command="rejected">设为已拒绝</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button size="small" type="danger" @click="deleteRoute(row.id)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- JSON 查看对话框 -->
        <el-dialog v-model="detailDialogVisible" :title="detailDialogTitle" width="60%">
          <pre style="max-height: 60vh; overflow: auto; background:#f7f7f7; padding:12px; border-radius:6px;">{{ detailDialogContent }}</pre>
          <template #footer>
            <el-button @click="detailDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadRoutes"
            @current-change="loadRoutes"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import type { EscapeRoute } from '@/types'
import { escapeRoutesApi } from '@/api/modules/escape-routes'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const routes = ref<EscapeRoute[]>([])

const filters = reactive({
  route_id: '',
  difficulty_level: undefined as number | undefined,
  verification_status: undefined as ('pending' | 'verified' | 'rejected') | undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
/**
 * 加载逃生路径列表
 * 从后端接口按筛选条件与分页获取数据，填充表格与总数
 */
const loadRoutes = async () => {
  loading.value = true
  try {
    const response = await escapeRoutesApi.getEscapeRoutes({
      page: pagination.page,
      limit: pagination.limit,
      route_id: filters.route_id,
      difficulty_level: filters.difficulty_level,
      verification_status: filters.verification_status
    })
    if (response.success) {
      routes.value = Array.isArray(response.data) ? response.data : []
      pagination.total = response.pagination?.total || 0
    } else {
      ElMessage.error(response.message || '加载逃生路径失败')
    }
  } catch (error) {
    console.error('Load escape routes error:', error)
    ElMessage.error('加载逃生路径失败')
  } finally {
    loading.value = false
  }
}

/**
 * 重置筛选表单
 * 清空筛选条件并重新加载数据
 */
const resetFilters = () => {
  Object.assign(filters, {
    route_id: '',
    difficulty_level: undefined as number | undefined,
    verification_status: undefined as ('pending' | 'verified' | 'rejected') | undefined
  })
  loadRoutes()
}

const viewRoute = (route: EscapeRoute) => {
  router.push({
    name: 'EscapeRouteDetail',
    params: { id: route.id },
    query: { action: 'view' }
  })
}

const editRoute = (route: EscapeRoute) => {
  router.push({
    name: 'EscapeRouteEdit',
    params: { id: route.id },
    query: { action: 'edit' }
  })
}

const deleteRoute = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条逃生路径吗？', '确认删除', {
      type: 'warning'
    })
    
    await escapeRoutesApi.deleteEscapeRoute(id)
    ElMessage.success('删除成功')
    loadRoutes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const getDifficultyText = (level: number) => {
  const texts = ['', '简单', '一般', '困难', '很困难', '极困难']
  return texts[level] || '未知'
}

const getDifficultyTagType = (level: number) => {
  if (level <= 2) return 'success'
  if (level <= 3) return 'warning'
  return 'danger'
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待验证',
    verified: '已验证',
    rejected: '已拒绝'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusTagType = (status: string) => {
  const typeMap = {
    pending: 'warning',
    verified: 'success',
    rejected: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

// 生命周期
onMounted(() => {
  loadRoutes()
})

// 详情对话框状态
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('')
const detailDialogContent = ref('')

/**
 * 打开JSON详情对话框
 * @param title 对话框标题
 * @param data 任意结构的JSON数据
 */
const openJsonDetail = (title: string, data: any) => {
  detailDialogTitle.value = title
  try {
    detailDialogContent.value = JSON.stringify(data ?? null, null, 2)
  } catch (e) {
    detailDialogContent.value = String(data)
  }
  detailDialogVisible.value = true
}

/**
 * 将GeoJSON Point或其他坐标格式转为可读字符串
 * @param point 起点或终点对象
 * @returns 形如 "lat, lng" 或简短JSON
 */
const formatPoint = (point: any): string => {
  if (!point) return '-'
  // 先兼容字符串：尝试解析为JSON
  if (typeof point === 'string') {
    try { point = JSON.parse(point) } catch { return '坐标格式无法识别' }
  }
  // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
  if (point.coordinates && Array.isArray(point.coordinates) && point.coordinates.length >= 2) {
    const [lng, lat] = point.coordinates
    return `${lat?.toFixed?.(4) ?? lat}, ${lng?.toFixed?.(4) ?? lng}`
  }
  // 可能是 { x: lng, y: lat }
  if (typeof point.x === 'number' && typeof point.y === 'number') {
    return `${point.y.toFixed(4)}, ${point.x.toFixed(4)}`
  }
  // 其他情况输出简短字符串
  const s = (() => { try { return JSON.stringify(point) } catch { return String(point) } })()
  return s.length > 40 ? s.slice(0, 40) + '...' : s
}

/**
 * 统一触发审核命令
 * 根据不同命令（verified/pending/rejected）调用验证接口；当为 rejected 时，弹出输入框获取备注
 * @param row 当前行的逃生路线
 * @param cmd 审核命令
 */
const onVerifyCommand = async (row: EscapeRoute, cmd: 'verified' | 'pending' | 'rejected') => {
  if (cmd === 'rejected') {
    try {
      const { value } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '设为已拒绝', {
        inputType: 'textarea',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入拒绝原因...'
      })
      await verifyRouteAction(row.id, 'rejected', value)
    } catch (e) {
      // 用户取消无需处理
    }
  } else {
    await verifyRouteAction(row.id, cmd)
  }
}

/**
 * 调用后端接口更新验证状态
 * 后端：PATCH /escape-routes/:id/verify
 * @param id 路线ID
 * @param status 验证状态
 * @param notes 备注（可选）
 */
const verifyRouteAction = async (id: number, status: 'verified' | 'pending' | 'rejected', notes?: string) => {
  try {
    const res = await escapeRoutesApi.verifyRoute(id, { status, notes })
    if (res.success) {
      ElMessage.success('更新验证状态成功')
      loadRoutes()
    } else {
      ElMessage.error(res.message || '更新验证状态失败')
    }
  } catch (error) {
    console.error('verifyRouteAction error:', error)
    ElMessage.error('更新验证状态失败')
  }
}
</script>

<style scoped>
.escape-routes-view {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}
</style>