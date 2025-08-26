<template>
  <div class="escape-route-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title">
        <el-button link type="primary" @click="goBack" class="back-btn">
          <el-icon style="margin-right: 4px;"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>逃生路线详情</h1>
      </div>
      <div class="header-actions">
        <el-button @click="editRoute" type="primary">
          <el-icon style="margin-right: 4px;"><Edit /></el-icon>
          编辑
        </el-button>
        <!-- 新增：验证操作按钮组 -->
        <el-button :disabled="isLoading" type="success" @click="openVerifyDialog('verified')" style="margin-left: 8px;">
          <el-icon style="margin-right: 4px;"><CircleCheck /></el-icon>
          通过
        </el-button>
        <el-button :disabled="isLoading" type="danger" @click="openVerifyDialog('rejected')" style="margin-left: 4px;">
          <el-icon style="margin-right: 4px;"><Close /></el-icon>
          拒绝
        </el-button>
        <el-button :disabled="isLoading" type="warning" @click="openVerifyDialog('pending')" style="margin-left: 4px;">
          <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
          待验证
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-loading="isLoading" element-loading-text="加载中...">
      <div v-if="currentRoute" class="detail-content">
        <!-- 基础信息卡片 -->
        <el-card>
          <template #header>
            <span>基础信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="路线ID">
              {{ currentRoute.route_id || currentRoute.id }}
            </el-descriptions-item>
            <el-descriptions-item label="距离">
              {{ currentRoute.distance_meters ? `${(currentRoute.distance_meters / 1000).toFixed(2)} km` : '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="预计用时">
              {{ currentRoute.estimated_time_minutes ? `${currentRoute.estimated_time_minutes} 分钟` : '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="难度等级">
              <el-tag :type="getDifficultyColor(currentRoute.difficulty_level)">
                {{ getDifficultyText(currentRoute.difficulty_level) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="安全评分">
              <el-progress 
                :percentage="getSafetyPercent(currentRoute.safety_score)" 
                :status="getSafetyStatus(currentRoute.safety_score)"
                style="width: 120px"
              />
            </el-descriptions-item>
            <el-descriptions-item label="验证状态">
              <el-tag :type="getVerificationColor(currentRoute.verification_status)">
                {{ getVerificationText(currentRoute.verification_status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="海拔增益">
              {{ currentRoute.elevation_gain ? `${currentRoute.elevation_gain}m` : '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后验证">
              {{ currentRoute.last_verified_date ? formatDate(currentRoute.last_verified_date) : '未验证' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 坐标信息卡片 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>坐标信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="起点坐标">
              <div class="coordinate-display">
                <span>{{ formatPoint(currentRoute.start_point) }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  link
                  @click="copyCoordinate(formatPoint(currentRoute.start_point))"
                >
                  <el-icon style="margin-right: 4px;"><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="终点坐标">
              <div class="coordinate-display">
                <span>{{ formatPoint(currentRoute.end_point) }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  link
                  @click="copyCoordinate(formatPoint(currentRoute.end_point))"
                >
                  <el-icon style="margin-right: 4px;"><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- JSON 数据查看卡片 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>详细数据</span>
          </template>
          <el-space direction="vertical" size="large" style="width: 100%">
            <div class="json-buttons">
              <el-button @click="viewJsonData('route_geometry', '路线几何数据', currentRoute.route_geometry)">
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看路线几何数据
              </el-button>
              
              <el-button 
                v-if="currentRoute.route_conditions" 
                @click="viewJsonData('route_conditions', '路线条件', currentRoute.route_conditions)"
              >
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看路线条件
              </el-button>
              
              <el-button 
                v-if="currentRoute.waypoints" 
                @click="viewJsonData('waypoints', '路径点', currentRoute.waypoints)"
              >
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看路径点
              </el-button>
              
              <el-button 
                v-if="currentRoute.alternative_routes" 
                @click="viewJsonData('alternative_routes', '备选路线', currentRoute.alternative_routes)"
              >
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看备选路线
              </el-button>
              
              <el-button 
                v-if="currentRoute.weather_dependency" 
                @click="viewJsonData('weather_dependency', '天气依赖', currentRoute.weather_dependency)"
              >
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看天气依赖
              </el-button>
              
              <el-button 
                v-if="currentRoute.accessibility_info" 
                @click="viewJsonData('accessibility_info', '无障碍信息', currentRoute.accessibility_info)"
              >
                <el-icon style="margin-right: 4px;"><View /></el-icon>
                查看无障碍信息
              </el-button>
            </div>
          </el-space>
        </el-card>

        <!-- 地图可视化卡片 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>路线可视化</span>
          </template>
          <EscapeRouteMapComponent 
            :route-data="currentRoute"
            :height="600"
          />
        </el-card>
      </div>

      <!-- 数据不存在状态 -->
      <el-empty v-else-if="!isLoading" description="未找到路线数据">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- JSON 查看弹窗 -->
    <el-dialog
      v-model="jsonModalVisible"
      :title="jsonModalTitle"
      width="800px"
      class="json-modal"
    >
      <div class="json-viewer">
        <div class="json-actions">
          <el-button @click="copyJsonData" size="small">
            <el-icon style="margin-right: 4px;"><DocumentCopy /></el-icon>
            复制
          </el-button>
          <el-button @click="downloadJsonData" size="small">
            <el-icon style="margin-right: 4px;"><Download /></el-icon>
            下载
          </el-button>
        </div>
        <pre class="json-content"><code v-html="highlightedJsonHtml"></code></pre>
      </div>
    </el-dialog>

    <!-- 新增：验证状态更新弹窗 -->
    <el-dialog
      v-model="verifyDialogVisible"
      title="更新验证状态"
      width="520px"
      @closed="resetVerifyForm"
    >
      <el-form label-width="96px">
        <el-form-item label="验证状态">
          <el-radio-group v-model="verifyForm.status">
            <el-radio label="verified">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
            <el-radio label="pending">待验证</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="verifyForm.status === 'rejected' ? '拒绝原因' : '备注'">
          <el-input
            v-model="verifyForm.notes"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入备注说明（拒绝时建议填写具体原因，至少5个字）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="verifySubmitting" @click="submitVerify">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, View, DocumentCopy, Download, CircleCheck, Close, Refresh } from '@element-plus/icons-vue'
import { useEscapeRoutesStore } from '@/stores/escape-routes'
import EscapeRouteMapComponent from '@/components/EscapeRouteMapComponent.vue'
import type { EscapeRoute } from '@/types'
// import type { EscapeRoute } from '@/types' // 已移除未使用的类型，避免 TS 6133 警告
import { storeToRefs } from 'pinia'

// 路由和store
const route = useRoute()
const router = useRouter()
const escapeRoutesStore = useEscapeRoutesStore()
const { currentRoute } = storeToRefs(escapeRoutesStore)

// 响应式数据
const isLoading = ref(false)
// 移除本地 currentRoute，直接使用 store 中的 currentRoute
// const currentRoute = ref<EscapeRoute | null>(null)
const jsonModalVisible = ref(false)
const jsonModalTitle = ref('')
const currentJsonData = ref<any>(null)

// 新增：验证弹窗与表单状态
/**
 * 验证状态类型
 */
type VerifyStatus = 'verified' | 'rejected' | 'pending'

/**
 * 验证弹窗可见性
 */
const verifyDialogVisible = ref(false)

/**
 * 验证表单数据
 */
const verifyForm = ref<{ status: VerifyStatus; notes: string }>({
  status: 'verified',
  notes: ''
})

/**
 * 验证提交加载态
 */
const verifySubmitting = ref(false)

/**
 * 打开验证弹窗并预选状态
 * @param status 预设的验证状态
 */
const openVerifyDialog = (status: VerifyStatus) => {
  verifyForm.value.status = status
  verifyForm.value.notes = ''
  verifyDialogVisible.value = true
}

/**
 * 重置验证表单
 */
const resetVerifyForm = () => {
  verifyForm.value = { status: 'verified', notes: '' }
}

/**
 * 提交验证结果
 * - 后端接口：PATCH /escape-routes/{id}/verify
 * - 成功后：更新当前详情的 currentRoute，关闭弹窗
 */
const submitVerify = async () => {
  // 基础校验：拒绝时备注不少于5个字
  if (verifyForm.value.status === 'rejected') {
    const n = (verifyForm.value.notes || '').trim()
    if (n.length < 5) {
      ElMessage.warning('拒绝时请填写至少 5 个字的备注说明')
      return
    }
  }

  const idParam = route.params.id
  const id = Number(idParam)
  if (!id || Number.isNaN(id)) {
    ElMessage.error('无效的路线ID')
    return
  }

  try {
    verifySubmitting.value = true
    const updated: EscapeRoute | null = await escapeRoutesStore.verifyRoute(
      id,
      verifyForm.value.status,
      verifyForm.value.notes?.trim() || undefined
    )

    if (updated) {
      // 即时更新当前详情
      currentRoute.value = updated
      ElMessage.success('验证状态已更新')
      verifyDialogVisible.value = false
    }
  } catch (error) {
    console.error('提交验证失败:', error)
    ElMessage.error('提交验证失败')
  } finally {
    verifySubmitting.value = false
  }
}

/**
 * 格式化坐标点
 * 支持：字符串JSON、GeoJSON Point、{x,y}、{lng,lat}、{longitude,latitude}、[lng,lat]
 * @param point GeoJSON Point 或坐标对象或可解析为JSON的字符串
 * @returns 格式化的坐标字符串
 */
const formatPoint = (point: any): string => {
  if (!point) return '-'

  try {
    // 若为字符串，尝试解析为JSON
    if (typeof point === 'string') {
      try { point = JSON.parse(point) } catch { return '坐标格式无法识别' }
    }

    let lat: number, lng: number

    // GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
    if (point && point.type === 'Point' && Array.isArray(point.coordinates)) {
      lng = point.coordinates[0]
      lat = point.coordinates[1]
    }
    // {x: lng, y: lat}
    else if (point && typeof point === 'object' && point.x !== undefined && point.y !== undefined) {
      lng = point.x
      lat = point.y
    }
    // {lng, lat}
    else if (point && typeof point === 'object' && point.lng !== undefined && point.lat !== undefined) {
      lng = point.lng
      lat = point.lat
    }
    // {longitude, latitude}
    else if (point && typeof point === 'object' && point.longitude !== undefined && point.latitude !== undefined) {
      lng = point.longitude
      lat = point.latitude
    }
    // 数组 [lng, lat]
    else if (Array.isArray(point) && point.length >= 2) {
      lng = point[0]
      lat = point[1]
    }
    else {
      return '坐标格式无法识别'
    }

    // 数值校验
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return '无效坐标'
    }

    // 固定6位小数
    const formattedLat = Number(lat).toFixed(6)
    const formattedLng = Number(lng).toFixed(6)
    return `${formattedLat}, ${formattedLng}`
  } catch (error) {
    console.error('坐标格式化错误:', error)
    return '坐标解析失败'
  }
}

/**
 * 获取难度等级颜色
 */
const getDifficultyColor = (level: number): string => {
  const colors = ['success', 'info', 'warning', 'danger', 'danger']
  return colors[Math.min(level - 1, 4)] || ''
}

/**
 * 获取难度等级文本
 */
const getDifficultyText = (level: number): string => {
  const texts = ['简单', '中等', '困难', '非常困难', '极度困难']
  return texts[Math.min(level - 1, 4)] || '未知'
}

/**
 * 将 0-10 或 0-100 的安全评分统一转换为 0-100 百分比
 * @param score 后端返回的安全分（通常为 0-10）
 * @returns 0-100 的百分比数值
 */
const getSafetyPercent = (score: number | undefined | null): number => {
  if (!score && score !== 0) return 0
  const s = Number(score)
  if (isNaN(s)) return 0
  // 若分值不大于 10，则认为是 0-10 标尺，放大 10 倍
  return s <= 10 ? Math.max(0, Math.min(100, s * 10)) : Math.max(0, Math.min(100, s))
}

/**
 * 获取安全评分状态（success/—/warning/exception）
 * 统一以 0-100 百分比阈值判断（80/60/40）
 */
const getSafetyStatus = (score: number | undefined | null): string => {
  const percent = getSafetyPercent(score)
  if (percent >= 80) return 'success'
  if (percent >= 60) return ''
  if (percent >= 40) return 'warning'
  return 'exception'
}

/**
 * 获取验证状态颜色
 */
const getVerificationColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'verified': 'success',
    'pending': 'warning',
    'failed': 'danger',
    'expired': 'danger'
  }
  return colorMap[status] || ''
}

/**
 * 获取验证状态文本
 */
const getVerificationText = (status: string): string => {
  const textMap: Record<string, string> = {
    'verified': '已验证',
    'pending': '待验证',
    'failed': '验证失败',
    'expired': '已过期'
  }
  return textMap[status] || status
}

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

/**
 * 复制坐标
 */
const copyCoordinate = async (coordinate: string) => {
  try {
    await navigator.clipboard.writeText(coordinate)
    ElMessage.success('坐标已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

/**
 * 查看JSON数据
 */
const viewJsonData = (_field: string, title: string, data: any) => {
  jsonModalTitle.value = title
  currentJsonData.value = data
  jsonModalVisible.value = true
}

/**
 * 格式化JSON数据用于显示
 */
const formattedJsonData = computed(() => {
  if (!currentJsonData.value) return ''
  
  try {
    // 如果是字符串，先解析再格式化
    if (typeof currentJsonData.value === 'string') {
      const parsed = JSON.parse(currentJsonData.value)
      return JSON.stringify(parsed, null, 2)
    }
    return JSON.stringify(currentJsonData.value, null, 2)
  } catch (error) {
    return String(currentJsonData.value)
  }
})

/**
 * 计算属性：返回带有语法高亮的JSON HTML
 * 依赖 formattedJsonData，避免重复解析
 */
const highlightedJsonHtml = computed(() => {
  return syntaxHighlight(formattedJsonData.value)
})

/**
 * 将JSON字符串进行语法高亮并返回HTML片段
 * - 关键名、字符串、数字、布尔、null 分别着色
 * - 在渲染前执行HTML转义，防止XSS
 */
function syntaxHighlight(json: string): string {
  if (!json) return ''
  const escaped = escapeHtml(json)
  return escaped
    .replace(/(&quot;)([^\n\r]*?)\1(?=\s*:)/g, '<span class="json-key">&quot;$2&quot;</span>')
    .replace(/(&quot;.*?&quot;)/g, '<span class="json-string">$1</span>')
    .replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/\bnull\b/g, '<span class="json-null">null</span>')
}

/**
 * 对文本进行HTML实体转义
 * 防止在使用 v-html 注入时出现XSS风险
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 复制JSON数据
 */
const copyJsonData = async () => {
  try {
    await navigator.clipboard.writeText(formattedJsonData.value)
    ElMessage.success('数据已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

/**
 * 下载JSON数据
 */
const downloadJsonData = () => {
  try {
    const blob = new Blob([formattedJsonData.value], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${jsonModalTitle.value.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('文件下载完成')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.go(-1)
}

/**
 * 编辑路线
 */
const editRoute = () => {
  router.push(`/escape-routes/edit/${route.params.id}`)
}

/**
 * 加载路线详情
 */
const loadRouteDetail = async () => {
  const routeId = route.params.id as string
  if (!routeId) {
    ElMessage.error('路线ID无效')
    goBack()
    return
  }

  try {
    isLoading.value = true
    await escapeRoutesStore.getEscapeRoute(Number(routeId))
    // 使用 storeToRefs 直接获取 currentRoute，无需手动赋值
    // currentRoute.value = escapeRoutesStore.currentRoute
    
    if (!currentRoute.value) {
      ElMessage.error('未找到指定的路线')
      goBack()
    }
  } catch (error) {
    console.error('加载路线详情失败:', error)
    ElMessage.error('加载路线详情失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRouteDetail()
})
</script>

<style scoped>
.escape-route-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.back-btn {
  color: #1890ff;
}

.coordinate-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.json-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.json-viewer {
  max-height: 500px;
  overflow-y: auto;
}

.json-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.json-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 16px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-key {
  color: #d73a49;
  font-weight: bold;
}

.json-string {
  color: #032f62;
}

.json-number {
  color: #005cc5;
}

.json-boolean {
  color: #e36209;
  font-weight: bold;
}
</style>