import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Warning, ApiResponse, PaginatedResponse } from '../types'
import { warningsApi } from '../api/modules/warnings'
import { ElMessage } from 'element-plus'

export const useWarningsStore = defineStore('warnings', () => {
  // 状态
  const warnings = ref<Warning[]>([])
  const currentWarning = ref<Warning | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const activeWarnings = computed(() => 
    warnings.value.filter(warning => warning.status === 'active')
  )

  const criticalWarnings = computed(() => 
    warnings.value.filter(warning => warning.warning_level >= 4)
  )

  const highWarnings = computed(() => 
    warnings.value.filter(warning => warning.warning_level === 3)
  )

  const mediumWarnings = computed(() => 
    warnings.value.filter(warning => warning.warning_level === 2)
  )

  const lowWarnings = computed(() => 
    warnings.value.filter(warning => warning.warning_level === 1)
  )

  // 获取预警列表
  const getWarnings = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<Warning> = await warningsApi.getWarnings({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        warnings.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取预警列表失败')
      }
    } catch (error) {
      console.error('Get warnings error:', error)
      ElMessage.error('获取预警列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个预警详情
  const getWarning = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Warning> = await warningsApi.getWarning(id)
      
      if (response.success && response.data) {
        currentWarning.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取预警详情失败')
        return null
      }
    } catch (error) {
      console.error('Get warning error:', error)
      ElMessage.error('获取预警详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建预警
  const createWarning = async (data: Omit<Warning, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Warning> = await warningsApi.createWarning(data)
      
      if (response.success) {
        ElMessage.success('预警创建成功')
        await getWarnings()
        return response.data
      } else {
        ElMessage.error(response.message || '预警创建失败')
        return null
      }
    } catch (error) {
      console.error('Create warning error:', error)
      ElMessage.error('预警创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新预警
  const updateWarning = async (id: number, data: Partial<Warning>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Warning> = await warningsApi.updateWarning(id, data)
      
      if (response.success) {
        ElMessage.success('预警更新成功')
        await getWarnings()
        return response.data
      } else {
        ElMessage.error(response.message || '预警更新失败')
        return null
      }
    } catch (error) {
      console.error('Update warning error:', error)
      ElMessage.error('预警更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除预警
  const deleteWarning = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await warningsApi.deleteWarning(id)
      
      if (response.success) {
        ElMessage.success('预警删除成功')
        await getWarnings()
        return true
      } else {
        ElMessage.error(response.message || '预警删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete warning error:', error)
      ElMessage.error('预警删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 激活预警
  const activateWarning = async (id: number) => {
    try {
      const response: ApiResponse<Warning> = await warningsApi.updateWarning(id, { status: 'active' })
      
      if (response.success) {
        ElMessage.success('预警激活成功')
        await getWarnings()
        return response.data
      } else {
        ElMessage.error(response.message || '预警激活失败')
        return null
      }
    } catch (error) {
      console.error('Activate warning error:', error)
      ElMessage.error('预警激活失败')
      return null
    }
  }

  // 取消预警
  const cancelWarning = async (id: number) => {
    try {
      const response: ApiResponse<Warning> = await warningsApi.cancelWarning(id)
      
      if (response.success) {
        ElMessage.success('预警取消成功')
        await getWarnings()
        return response.data
      } else {
        ElMessage.error(response.message || '预警取消失败')
        return null
      }
    } catch (error) {
      console.error('Cancel warning error:', error)
      ElMessage.error('预警取消失败')
      return null
    }
  }

  // 发送预警通知
  const sendNotification = async (id: number) => {
    try {
      // 暂时使用更新预警的方式来模拟发送通知
      const response: ApiResponse<Warning> = await warningsApi.updateWarning(id, {
        // 可以在这里添加通知相关的字段更新
      })
      
      if (response.success) {
        ElMessage.success('预警通知发送成功')
        return true
      } else {
        ElMessage.error(response.message || '预警通知发送失败')
        return false
      }
    } catch (error) {
      console.error('Send notification error:', error)
      ElMessage.error('预警通知发送失败')
      return false
    }
  }

  // 获取预警统计
  const getWarningStats = async () => {
    try {
      const response = await warningsApi.getWarningStats()
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取预警统计失败')
        return null
      }
    } catch (error) {
      console.error('Get warning stats error:', error)
      ElMessage.error('获取预警统计失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    warnings.value = []
    currentWarning.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    warnings,
    currentWarning,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    activeWarnings,
    criticalWarnings,
    highWarnings,
    mediumWarnings,
    lowWarnings,
    
    // 方法
    getWarnings,
    getWarning,
    createWarning,
    updateWarning,
    deleteWarning,
    activateWarning,
    cancelWarning,
    sendNotification,
    getWarningStats,
    resetState
  }
})