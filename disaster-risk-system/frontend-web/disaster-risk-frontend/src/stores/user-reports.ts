import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserReport, ApiResponse, PaginatedResponse } from '../types'
import { userReportsApi } from '../api/modules/user-reports'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export const useUserReportsStore = defineStore('userReports', () => {
  // 状态
  const userReports = ref<UserReport[]>([])
  const currentReport = ref<UserReport | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const authStore = useAuthStore()

  // 计算属性
  const pendingReports = computed(() => 
    userReports.value.filter(report => report.verification_status === 'pending')
  )

  const verifiedReports = computed(() => 
    userReports.value.filter(report => report.verification_status === 'verified')
  )

  const rejectedReports = computed(() => 
    userReports.value.filter(report => report.verification_status === 'rejected')
  )

  const emergencyReports = computed(() => 
    userReports.value.filter(report => report.is_emergency === true)
  )

  const highSeverityReports = computed(() => 
    userReports.value.filter(report => report.severity >= 4)
  )

  const highPriorityReports = computed(() => 
    userReports.value.filter(report => report.severity >= 4)
  )

  const recentReports = computed(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return userReports.value.filter(report => 
      new Date(report.created_at) > oneDayAgo
    )
  })

  // 获取用户报告列表
  const getUserReports = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<UserReport> = await userReportsApi.getUserReports({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        userReports.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取用户报告列表失败')
      }
    } catch (error) {
      console.error('Get user reports error:', error)
      ElMessage.error('获取用户报告列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个用户报告详情
  const getUserReport = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<UserReport> = await userReportsApi.getUserReport(id)
      
      if (response.success && response.data) {
        currentReport.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取用户报告详情失败')
        return null
      }
    } catch (error) {
      console.error('Get user report error:', error)
      ElMessage.error('获取用户报告详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建用户报告
  const createUserReport = async (reportData: Omit<UserReport, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<UserReport> = await userReportsApi.createUserReport(reportData)
      
      if (response.success) {
        ElMessage.success('用户报告创建成功')
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '用户报告创建失败')
        return null
      }
    } catch (error) {
      console.error('Create user report error:', error)
      ElMessage.error('用户报告创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户报告
  const updateUserReport = async (id: number, reportData: Partial<UserReport>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<UserReport> = await userReportsApi.updateUserReport(id, reportData)
      
      if (response.success) {
        ElMessage.success('用户报告更新成功')
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '用户报告更新失败')
        return null
      }
    } catch (error) {
      console.error('Update user report error:', error)
      ElMessage.error('用户报告更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除用户报告
  const deleteUserReport = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await userReportsApi.deleteUserReport(id)
      
      if (response.success) {
        ElMessage.success('用户报告删除成功')
        await getUserReports()
        return true
      } else {
        ElMessage.error(response.message || '用户报告删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete user report error:', error)
      ElMessage.error('用户报告删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 批量删除用户报告
  const batchDeleteUserReports = async (ids: number[]) => {
    try {
      isLoading.value = true
      // 批量删除需要逐个调用单个删除接口
      const deletePromises = ids.map(id => userReportsApi.deleteUserReport(id))
      const responses = await Promise.all(deletePromises)
      const allSuccess = responses.every(response => response.success)
      
      if (allSuccess) {
        ElMessage.success('用户报告批量删除成功')
        await getUserReports()
        return true
      } else {
        ElMessage.error('部分用户报告删除失败')
        return false
      }
    } catch (error) {
      console.error('Batch delete user reports error:', error)
      ElMessage.error('用户报告批量删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 获取我的报告
  // 获取我的报告 - 使用getUserReports替代
  const getMyReports = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<UserReport> = await userReportsApi.getUserReports({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        userReports.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取我的报告失败')
      }
    } catch (error) {
      console.error('Get my reports error:', error)
      ElMessage.error('获取我的报告失败')
    } finally {
      isLoading.value = false
    }
  }

  // 更新报告状态 - 使用updateUserReport替代
  /**
   * 更新报告的验证状态字段（不记录验证人信息）
   */
  const updateReportStatus = async (id: number, status: 'pending' | 'verified' | 'rejected') => {
    try {
      const response: ApiResponse<UserReport> = await userReportsApi.updateUserReport(id, { verification_status: status })
      
      if (response.success) {
        ElMessage.success('报告状态更新成功')
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '报告状态更新失败')
        return null
      }
    } catch (error) {
      console.error('Update report status error:', error)
      ElMessage.error('报告状态更新失败')
      return null
    }
  }

  // 验证报告
  /**
   * 验证报告：将 verification_status 设置为 verified，并记录 verified_by 与备注
   * @param id 报告ID
   * @param verificationNotes 验证备注（可选）
   */
  const verifyReport = async (id: number, verificationNotes?: string) => {
    try {
      const verifiedBy = authStore.user?.id
      if (!verifiedBy) {
        ElMessage.error('未获取到当前用户信息，无法执行验证')
        return null
      }
      const response: ApiResponse<UserReport> = await userReportsApi.verifyReport(id, {
        verification_status: 'verified',
        verified_by: verifiedBy,
        verification_notes: verificationNotes
      })
      
      if (response.success) {
        ElMessage.success('报告验证成功')
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '报告验证失败')
        return null
      }
    } catch (error) {
      console.error('Verify report error:', error)
      ElMessage.error('报告验证失败')
      return null
    }
  }

  // 拒绝报告
  /**
   * 拒绝报告：将 verification_status 设置为 rejected，并记录 verified_by 与拒绝原因
   * @param id 报告ID
   * @param rejectionReason 拒绝原因（必填）
   */
  const rejectReport = async (id: number, rejectionReason: string) => {
    try {
      const verifiedBy = authStore.user?.id
      if (!verifiedBy) {
        ElMessage.error('未获取到当前用户信息，无法执行拒绝')
        return null
      }
      const response: ApiResponse<UserReport> = await userReportsApi.verifyReport(id, {
        verification_status: 'rejected',
        verified_by: verifiedBy,
        verification_notes: rejectionReason
      })
      
      if (response.success) {
        ElMessage.success('报告已拒绝')
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '拒绝报告失败')
        return null
      }
    } catch (error) {
      console.error('Reject report error:', error)
      ElMessage.error('拒绝报告失败')
      return null
    }
  }

  // 新增：重置为待验证
  /**
   * 将报告状态重置为 pending，并记录操作人与备注
   * @param id 报告ID
   * @param notes 备注（可选）
   */
  const resetReportToPending = async (id: number, notes?: string) => {
    try {
      const verifiedBy = authStore.user?.id
      if (!verifiedBy) {
        ElMessage.error('未获取到当前用户信息，无法执行重置')
        return null
      }
      const response: ApiResponse<UserReport> = await userReportsApi.verifyReport(id, {
        verification_status: 'pending',
        verified_by: verifiedBy,
        verification_notes: notes
      })

      if (response.success) {
        ElMessage.success('状态已重置为待验证')
        // 列表刷新
        await getUserReports()
        return response.data
      } else {
        ElMessage.error(response.message || '重置为待验证失败')
        return null
      }
    } catch (error) {
      console.error('Reset to pending error:', error)
      ElMessage.error('重置为待验证失败')
      return null
    }
  }

  // 获取报告统计
  const getReportStats = async () => {
    try {
      const response = await userReportsApi.getReportStats()
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取报告统计失败')
        return null
      }
    } catch (error) {
      console.error('Get report stats error:', error)
      ElMessage.error('获取报告统计失败')
      return null
    }
  }

  // 上传报告附件 - 功能暂不可用
  const uploadAttachment = async () => {
    try {
      // 暂时返回错误信息
      ElMessage.error('附件上传功能暂不可用')
      return null
    } catch (error) {
      console.error('Upload attachment error:', error)
      ElMessage.error('附件上传失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    userReports.value = []
    currentReport.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    userReports,
    currentReport,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    pendingReports,
    verifiedReports,
    rejectedReports,
    emergencyReports,
    highSeverityReports,
    highPriorityReports,
    recentReports,
    
    // 方法
    getUserReports,
    getUserReport,
    createUserReport,
    updateUserReport,
    deleteUserReport,
    batchDeleteUserReports,
    getMyReports,
    updateReportStatus,
    verifyReport,
    rejectReport,
    resetReportToPending,
    getReportStats,
    uploadAttachment,
    resetState
  }
})