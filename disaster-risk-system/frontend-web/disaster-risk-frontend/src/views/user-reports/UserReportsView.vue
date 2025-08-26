<template>
  <div class="user-reports-view">
    <div class="page-header">
      <h1>用户报告管理</h1>
      <p>查看和处理用户提交的灾害报告</p>
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
              <el-select v-model="filters.report_type" placeholder="选择报告类型" clearable>
                <el-option label="灾害报告" value="disaster" />
                <el-option label="风险发现" value="risk" />
                <el-option label="设施损坏" value="facility" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="验证状态">
              <el-select v-model="filters.verification_status" placeholder="选择验证状态" clearable>
                <el-option label="待验证" value="pending" />
                <el-option label="已验证" value="verified" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item label="严重程度">
              <el-select v-model="filters.severity" placeholder="选择严重程度" clearable>
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
          <el-table-column prop="user.username" label="报告用户" width="120" />
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

// 响应式数据
const loading = ref(false)
const reports = ref<UserReport[]>([])

const filters = reactive({
  title: '',
  report_type: '',
  verification_status: '',
  severity: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
const loadReports = async () => {
  loading.value = true
  try {
    const response = await userReportsApi.getUserReports({
      page: pagination.page,
      limit: pagination.limit,
      title: filters.title,
      report_type: filters.report_type,
      verification_status: filters.verification_status,
      severity: filters.severity
    })
    
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
    report_type: '',
    verification_status: '',
    severity: undefined
  })
  loadReports()
}

const viewReport = (report: UserReport) => {
  // TODO: 实现报告详情页面导航
  console.log('查看报告:', report)
}

const verifyReport = async (id: number, status: 'verified' | 'rejected') => {
  try {
    const action = status === 'verified' ? '验证' : '拒绝'
    await ElMessageBox.confirm(`确定要${action}这个报告吗？`, `确认${action}`, {
      type: 'warning'
    })
    
    const response = await userReportsApi.verifyReport(id, status)
    if (response.success) {
      ElMessage.success(`${action}成功`)
      loadReports()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('验证报告失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const getReportTypeText = (type: string) => {
  const typeMap = {
    disaster: '灾害报告',
    risk: '风险发现',
    facility: '设施损坏',
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
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #666;
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