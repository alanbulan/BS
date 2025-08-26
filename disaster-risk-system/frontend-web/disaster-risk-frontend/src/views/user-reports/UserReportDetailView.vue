<template>
  <div class="user-report-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <div class="title-area">
          <h1>用户报告详情</h1>
          <p>查看和处理用户提交的灾害报告详情</p>
        </div>
      </div>
    </div>

    <div class="content-area" v-if="report">
      <!-- 基本信息 -->
      <el-card class="report-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <div class="verification-actions">
              <el-button 
                v-if="report.verification_status === 'pending'"
                type="success" 
                @click="handleVerification('verified')"
              >
                <el-icon><Check /></el-icon>
                通过验证
              </el-button>
              <el-button 
                v-if="report.verification_status === 'pending'"
                type="danger" 
                @click="handleVerification('rejected')"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
              <el-button 
                v-if="report.verification_status !== 'pending'"
                type="warning" 
                @click="handleVerification('pending')"
              >
                <el-icon><RefreshRight /></el-icon>
                重置为待验证
              </el-button>
            </div>
          </div>
        </template>

        <div class="report-content">
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <label>报告标题：</label>
                <span>{{ report.title }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>报告类型：</label>
                <span>{{ getReportTypeText(report.report_type) }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <label>严重程度：</label>
                <el-tag :type="getSeverityTagType(report.severity)">
                  {{ getSeverityText(report.severity) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>验证状态：</label>
                <el-tag :type="getStatusTagType(report.verification_status)">
                  {{ getStatusText(report.verification_status) }}
                </el-tag>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <label>紧急状态：</label>
                <el-tag v-if="report.is_emergency" type="danger">紧急</el-tag>
                <el-tag v-else type="info">普通</el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>报告用户：</label>
                <span>{{ report.user?.username || `用户ID: ${report.user_id}` }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <label>创建时间：</label>
                <span>{{ formatDateTime(report.created_at) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>更新时间：</label>
                <span>{{ formatDateTime(report.updated_at) }}</span>
              </div>
            </el-col>
          </el-row>

          <div class="info-item full-width">
            <label>报告描述：</label>
            <div class="description-content">
              {{ report.description || '暂无描述' }}
            </div>
          </div>

          <div class="info-item full-width">
            <label>位置信息：</label>
            <span>{{ formatLocation(report.location as any) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 验证信息 -->
      <el-card class="verification-card" v-if="report.verification_status !== 'pending'">
        <template #header>
          <span>验证信息</span>
        </template>
        <div class="verification-content">
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <label>验证人：</label>
                <span>{{ report.verified_by_user?.username || report.verified_by_user?.full_name || (report.verified_by ? `用户ID: ${report.verified_by}` : '暂无') }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>验证时间：</label>
                <span>{{ report.verified_at ? formatDateTime(report.verified_at) : '暂无' }}</span>
              </div>
            </el-col>
          </el-row>
          <div class="info-item full-width">
            <label>验证备注：</label>
            <div class="notes-content">
              {{ report.verification_notes || '暂无备注' }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- 多媒体内容 -->
      <el-card class="media-card" v-if="report.images?.length || report.videos?.length">
        <template #header>
          <span>多媒体内容</span>
        </template>
        <div class="media-content">
          <div v-if="report.images?.length" class="images-section">
            <h4>图片</h4>
            <div class="images-grid">
              <el-image
                v-for="(image, index) in report.images"
                :key="index"
                :src="image"
                :preview-src-list="report.images"
                fit="cover"
                class="report-image"
              />
            </div>
          </div>
          <div v-if="report.videos?.length" class="videos-section">
            <h4>视频</h4>
            <div class="videos-grid">
              <video
                v-for="(video, index) in report.videos"
                :key="index"
                :src="video"
                controls
                class="report-video"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <el-card class="stats-card">
        <template #header>
          <span>互动统计</span>
        </template>
        <div class="stats-content">
          <el-row :gutter="24">
            <el-col :span="8">
              <div class="stat-item">
                <el-icon class="stat-icon thumbs-up"><ArrowUp /></el-icon>
                <div class="stat-text">
                  <div class="stat-value">{{ report.upvotes || 0 }}</div>
                  <div class="stat-label">支持</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <el-icon class="stat-icon thumbs-down"><ArrowDown /></el-icon>
                <div class="stat-text">
                  <div class="stat-value">{{ report.downvotes || 0 }}</div>
                  <div class="stat-label">反对</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <el-icon class="stat-icon"><Document /></el-icon>
                <div class="stat-text">
                  <div class="stat-value">{{ report.response_actions?.length || 0 }}</div>
                  <div class="stat-label">响应行动</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-empty description="报告不存在或加载失败">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 验证操作弹窗 -->
    <el-dialog
      v-model="verificationDialogVisible"
      :title="verificationDialogTitle"
      width="500px"
      @close="resetVerificationDialog"
    >
      <el-form :model="verificationForm" label-width="100px">
        <el-form-item label="验证状态">
          <el-tag :type="getStatusTagType(verificationForm.status)">
            {{ getStatusText(verificationForm.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item 
          :label="verificationForm.status === 'rejected' ? '拒绝原因' : '备注'"
          :required="verificationForm.status === 'rejected'"
        >
          <el-input
            v-model="verificationForm.notes"
            type="textarea"
            :rows="4"
            :placeholder="verificationForm.status === 'rejected' ? '请输入拒绝原因' : '请输入备注（可选）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verificationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmVerification" :loading="verificationLoading">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Close, RefreshRight, Document, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { UserReport } from '@/types'
import { formatDateTime } from '@/utils'
import { useUserReportsStore } from '@/stores/user-reports'

const route = useRoute()
const router = useRouter()
const userReportsStore = useUserReportsStore()

// 响应式数据
const loading = ref(true)
const report = ref<UserReport | null>(null)
const verificationDialogVisible = ref(false)
const verificationLoading = ref(false)
const verificationForm = ref({
  status: 'pending' as 'pending' | 'verified' | 'rejected',
  notes: ''
})

// 计算属性
const verificationDialogTitle = computed(() => {
  const statusMap = {
    verified: '通过验证',
    rejected: '拒绝报告',
    pending: '重置为待验证'
  }
  return statusMap[verificationForm.value.status]
})

// 方法
/**
 * 获取报告详情
 */
const loadReportDetail = async () => {
  const reportId = Number(route.params.id)
  if (!reportId || isNaN(reportId)) {
    ElMessage.error('无效的报告ID')
    goBack()
    return
  }

  loading.value = true
  try {
    const data = await userReportsStore.getUserReport(reportId)
    if (data) {
      report.value = data
    } else {
      ElMessage.error('报告不存在')
      goBack()
    }
  } catch (error) {
    console.error('加载报告详情失败:', error)
    ElMessage.error('加载报告详情失败')
  } finally {
    loading.value = false
  }
}

/**
 * 返回列表页
 */
const goBack = () => {
  router.push('/user-reports')
}

/**
 * 处理验证操作
 */
const handleVerification = (status: 'verified' | 'rejected' | 'pending') => {
  verificationForm.value = {
    status,
    notes: ''
  }
  verificationDialogVisible.value = true
}

/**
 * 确认验证操作
 */
const confirmVerification = async () => {
  if (!report.value) return

  // 验证表单
  if (verificationForm.value.status === 'rejected' && !verificationForm.value.notes.trim()) {
    ElMessage.error('拒绝原因不能为空')
    return
  }

  verificationLoading.value = true
  try {
    const { status, notes } = verificationForm.value
    let result = null

    switch (status) {
      case 'verified':
        result = await userReportsStore.verifyReport(report.value.id, notes)
        break
      case 'rejected':
        result = await userReportsStore.rejectReport(report.value.id, notes)
        break
      case 'pending':
        result = await userReportsStore.resetReportToPending(report.value.id, notes)
        break
    }

    if (result) {
      // 更新本地数据
      report.value = result
      verificationDialogVisible.value = false
      ElMessage.success('操作成功')
    }
  } catch (error) {
    console.error('验证操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    verificationLoading.value = false
  }
}

/**
 * 重置验证弹窗
 */
const resetVerificationDialog = () => {
  verificationForm.value = {
    status: 'pending',
    notes: ''
  }
}

/**
 * 获取报告类型文本
 */
const getReportTypeText = (type: string) => {
  const typeMap = {
    disaster: '灾害报告',
    risk: '风险发现',
    facility: '设施损坏',
    other: '其他'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

/**
 * 获取严重程度文本
 */
const getSeverityText = (severity: number) => {
  const texts = ['', '轻微', '一般', '严重', '很严重', '极严重']
  return texts[severity] || '未知'
}

/**
 * 获取严重程度标签类型
 */
const getSeverityTagType = (severity: number) => {
  if (severity <= 2) return 'success'
  if (severity <= 3) return 'warning'
  return 'danger'
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待验证',
    verified: '已验证',
    rejected: '已拒绝'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: string) => {
  const typeMap = {
    pending: 'warning',
    verified: 'success',
    rejected: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

/**
 * 将数据库中的 location 字段（支持WKB十六进制与WKT/EWKT POINT格式）格式化为“经度, 纬度”的可读文本
 * - 若为空返回“暂无位置信息”
 * - 若无法解析返回“格式错误”
 * - 支持：
 *   1) EWKB 小端十六进制：0101000020E6100000...（含SRID=4326）
 *   2) WKB 小端十六进制：0101000000...（不含SRID）
 *   3) WKT：POINT(lon lat)
 *   4) EWKT：SRID=4326;POINT(lon lat)
 */
const formatLocation = (location: string | null | undefined): string => {
  if (!location) return '暂无位置信息'
  try {
    const loc = location.trim()

    // 处理 EWKB/WKB 十六进制
    if (/^(?:01)[0-9A-Fa-f]+$/.test(loc)) {
      try {
        // 小端WKB：开头 01，接着4字节类型与标志，若含SRID则再跟4字节SRID
        // 根据是否包含 0x20000000 标志（十六进制前缀表现为 0101000020）来决定坐标起始位置
        let coordStartHexChars = 0
        if (loc.startsWith('0101000020')) {
          // 1(字节序) + 4(类型|标志) + 4(SRID) = 9字节 = 18个hex
          coordStartHexChars = 18
        } else if (loc.startsWith('0101000000')) {
          // 1(字节序) + 4(类型) = 5字节 = 10个hex
          coordStartHexChars = 10
        }
        if (coordStartHexChars > 0) {
          const coordData = loc.substring(coordStartHexChars)
          if (coordData.length >= 32) {
            const bytes: number[] = []
            for (let i = 0; i < coordData.length; i += 2) {
              bytes.push(parseInt(coordData.substr(i, 2), 16))
            }
            const buffer = new Uint8Array(bytes).buffer
            const view = new DataView(buffer)
            const longitude = view.getFloat64(0, true)
            const latitude = view.getFloat64(8, true)
            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
              if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
                return `${longitude.toFixed(4)}, ${latitude.toFixed(4)}`
              }
              return '坐标超出范围'
            }
            return '数据格式错误'
          }
          return '数据格式错误'
        }
      } catch (e) {
        // fallthrough 到后续解析
      }
    }

    // 处理 EWKT：SRID=xxxx;POINT(...)
    if (/^SRID=\d+;/.test(loc)) {
      const after = loc.split(';', 2)[1] || ''
      const m = /POINT\s*(?:Z)?\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(after)
      if (m) {
        const lon = Number(m[1]); const lat = Number(m[2])
        if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
          return `${lon.toFixed(4)}, ${lat.toFixed(4)}`
        }
      }
    }

    // 处理 WKT：POINT(lon lat) / POINT Z(lon lat)
    if (/^POINT/i.test(loc)) {
      const m = /POINT\s*(?:Z)?\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(loc)
      if (m) {
        const lon = Number(m[1]); const lat = Number(m[2])
        if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
          return `${lon.toFixed(4)}, ${lat.toFixed(4)}`
        }
      }
    }
  } catch (e) {
    // 忽略解析异常
  }
  return '格式错误'
}

// 生命周期
onMounted(() => {
  loadReportDetail()
})
</script>

<style scoped>
.user-report-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-area h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.title-area p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.verification-actions {
  display: flex;
  gap: 8px;
}

.report-content {
  padding: 20px 0;
}

.info-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.info-item label {
  min-width: 100px;
  font-weight: 500;
  color: #333;
  margin-right: 12px;
}

.info-item.full-width {
  flex-direction: column;
}

.info-item.full-width label {
  margin-bottom: 8px;
}

.description-content,
.notes-content {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
}

.verification-content {
  padding: 20px 0;
}

.media-content {
  padding: 20px 0;
}

.images-section,
.videos-section {
  margin-bottom: 24px;
}

.images-section h4,
.videos-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.report-image {
  width: 100%;
  height: 150px;
  border-radius: 8px;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.report-video {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.stats-content {
  padding: 20px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.stat-icon {
  font-size: 24px;
}

.stat-icon.thumbs-up {
  color: #67c23a;
}

.stat-icon.thumbs-down {
  color: #f56c6c;
}

.stat-text {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.loading-container,
.error-container {
  padding: 40px;
  text-align: center;
}

.report-card,
.verification-card,
.media-card,
.stats-card {
  margin-bottom: 20px;
}
</style>