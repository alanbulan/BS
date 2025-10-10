<template>
  <div class="user-reports-view">
    <div class="page-header">
      <div class="header-left">
        <h2>用户报告管理</h2>
        <p>查看和处理用户提交的灾害报告</p>
      </div>
      <div class="header-right">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户报告列表</span>
          </div>
        </template>

        <!-- 筛选区域 -->
        <div class="filter-section">
          <el-form :model="filters" inline>
            <el-form-item label="报告标题">
              <el-input v-model="filters.title" placeholder="请输入报告标题" clearable />
            </el-form-item>
            <el-form-item label="报告类型">
              <el-select v-model="filters.report_type" placeholder="请选择报告类型" clearable>
                <el-option label="灾害报告" value="disaster" />
                <el-option label="基础设施" value="infrastructure" />
                <el-option label="安全" value="safety" />
                <el-option label="环境" value="environmental" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="验证状态">
              <el-select v-model="filters.verification_status" placeholder="请选择验证状态" clearable>
                <el-option label="待验证" value="pending" />
                <el-option label="已验证" value="verified" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item label="严重程度">
              <el-select v-model="filters.severity" placeholder="请选择严重程度" clearable>
                <el-option label="轻微" :value="1" />
                <el-option label="一般" :value="2" />
                <el-option label="严重" :value="3" />
                <el-option label="很严重" :value="4" />
                <el-option label="极严重" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadReports">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <el-table :data="reports" v-loading="loading" stripe>
          <el-table-column prop="title" label="报告标题" min-width="200" />
          <el-table-column prop="report_type" label="报告类型" width="100">
            <template #default="{ row }">
              {{ getReportTypeText(row.report_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="user.username" label="报告用户" width="120">
            <template #default="{ row }">
              {{ row.user?.username || `用户ID: ${row.user_id}` }}
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityTagType(row.severity)">
                {{ getSeverityText(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="verification_status" label="验证状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.verification_status)">
                {{ getStatusText(row.verification_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_emergency" label="紧急状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.is_emergency" type="danger">紧急</el-tag>
              <el-tag v-else type="info">普通</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="viewReport(row)">详情</el-button>
                <el-button 
                  v-if="row.verification_status === 'pending'"
                  size="small" 
                  type="success" 
                  @click="verifyReport(row.id, 'verified')"
                >
                  验证
                </el-button>
                <el-button 
                  v-if="row.verification_status === 'pending'"
                  size="small" 
                  type="danger" 
                  @click="verifyReport(row.id, 'rejected')"
                >
                  拒绝
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadReports"
            @current-change="loadReports"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UserReport } from '@/types'
import { formatDateTime } from '@/utils'
import { userReportsApi } from '@/api'
import { useUserReportsStore } from '@/stores/user-reports'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'

const userReportsStore = useUserReportsStore()
const router = useRouter()
// 响应式数据
const loading = ref(false)
const reports = ref<UserReport[]>([])

const filters = reactive({
  title: '',
  report_type: undefined as string | undefined,
  verification_status: undefined as ('pending' | 'verified' | 'rejected') | undefined,
  severity: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
/**
 * 加载用户报告列表
 * - 将 filters.title 映射为后端期望的 search 参数（在标题/描述中模糊匹配）
 * - 将单一选择的 severity 同时映射为 min_severity 与 max_severity，达到按该等级等值筛选
 * - 其他筛选项保持原样透传：report_type、verification_status
 */
const loadReports = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      report_type: filters.report_type,
      verification_status: filters.verification_status
    }

    // 标题作为 search 传递（后端对 title/description 做 ILIKE 匹配）
    if (filters.title && filters.title.trim()) {
      params.search = filters.title.trim()
    }

    // severity 等值筛选，映射为最小/最大相同值
    if (typeof filters.severity === 'number') {
      params.min_severity = filters.severity
      params.max_severity = filters.severity
    }

    const response = await userReportsApi.getUserReports(params)
    
    if (response.success) {
      reports.value = response.data
      pagination.total = response.pagination?.total || 0
    } else {
      ElMessage.error(response.message || '加载用户报告失败')
    }
  } catch (error) {
    console.error('加载用户报告失败:', error)
    ElMessage.error('加载用户报告失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    title: '',
    report_type: undefined as string | undefined,
    verification_status: undefined as ('pending' | 'verified' | 'rejected') | undefined,
    severity: undefined as number | undefined
  })
  loadReports()
}

/**
 * 刷新数据
 * - 触发列表重新加载，统一交互提示
 */
const refreshData = async () => {
  await loadReports()
  ElMessage.success('数据刷新成功')
}

const viewReport = (report: UserReport) => {
  router.push({ name: 'UserReportDetail', params: { id: report.id } })
}

const verifyReport = async (id: number, status: 'verified' | 'rejected') => {
  try {
    if (status === 'verified') {
      // 验证备注（可选）
      const { value, action } = await ElMessageBox.prompt('请输入验证备注（可选）', '确认验证', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '验证备注（可留空）',
        inputValidator: () => true
      })
      if (action === 'confirm') {
        const res = await userReportsStore.verifyReport(id, value)
        if (res) {
          ElMessage.success('验证成功')
          loadReports()
        }
      }
    } else {
      // 拒绝原因（必填）
      const { value, action } = await ElMessageBox.prompt('请输入拒绝原因', '确认拒绝', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '拒绝原因',
        inputValidator: (val: string) => !!val || '拒绝原因不能为空'
      })
      if (action === 'confirm') {
        const res = await userReportsStore.rejectReport(id, value)
        if (res) {
          ElMessage.success('拒绝成功')
          loadReports()
        }
      }
    }
  } catch (error) {
    // 用户取消操作，静默处理
    if (error === 'cancel' || error === 'close' || (error as any) === 'cancel') {
      return
    }
    // 其他错误才提示
    console.error('验证/拒绝操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const getReportTypeText = (type: string) => {
  const typeMap = {
    disaster: '灾害报告',
    infrastructure: '基础设施',
    safety: '安全',
    environmental: '环境',
    other: '其他'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getSeverityText = (severity: number) => {
  const texts = ['', '轻微', '一般', '严重', '很严重', '极严重']
  return texts[severity] || '未知'
}

const getSeverityTagType = (severity: number) => {
  if (severity <= 2) return 'success'
  if (severity <= 3) return 'warning'
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
  loadReports()
})
</script>

<style scoped>
.user-reports-view {
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