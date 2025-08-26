import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EscapeRoute, ApiResponse, PaginatedResponse } from '../types'
import { escapeRoutesApi } from '../api/modules/escape-routes'
import { ElMessage } from 'element-plus'

export const useEscapeRoutesStore = defineStore('escapeRoutes', () => {
  // 状态
  const escapeRoutes = ref<EscapeRoute[]>([])
  const currentRoute = ref<EscapeRoute | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const verifiedRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.verification_status === 'verified')
  )

  const pendingRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.verification_status === 'pending')
  )

  const rejectedRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.verification_status === 'rejected')
  )

  const highSafetyRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.safety_score >= 8)
  )

  const lowDifficultyRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.difficulty_level <= 2)
  )

  const emergencyRoutes = computed(() =>
    escapeRoutes.value.filter(route => route.safety_score >= 7 && route.difficulty_level <= 3)
  )

  /**
   * 获取逃生路线列表
   * 对应后端：GET /escape-routes
   * 分页字段：page, limit；返回 pagination.total
   */
  const getEscapeRoutes = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<EscapeRoute> = await escapeRoutesApi.getEscapeRoutes({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })

      if (response.success) {
        escapeRoutes.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取逃生路线列表失败')
      }
    } catch (error) {
      console.error('Get escape routes error:', error)
      ElMessage.error('获取逃生路线列表失败')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取单个逃生路线详情
   * 对应后端：GET /escape-routes/{id}
   * 成功后写入 currentRoute
   */
  const getEscapeRoute = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<EscapeRoute> = await escapeRoutesApi.getEscapeRoute(id)

      if (response.success && response.data) {
        currentRoute.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取逃生路线详情失败')
        return null
      }
    } catch (error) {
      console.error('Get escape route error:', error)
      ElMessage.error('获取逃生路线详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 创建逃生路线
   * 对应后端：POST /escape-routes
   * 成功后刷新列表
   */
  const createEscapeRoute = async (routeData: Omit<EscapeRoute, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<EscapeRoute> = await escapeRoutesApi.createEscapeRoute(routeData)

      if (response.success) {
        ElMessage.success('逃生路线创建成功')
        await getEscapeRoutes()
        return response.data
      } else {
        ElMessage.error(response.message || '逃生路线创建失败')
        return null
      }
    } catch (error) {
      console.error('Create escape route error:', error)
      ElMessage.error('逃生路线创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新逃生路线
   * 对应后端：PUT /escape-routes/{id}
   * 成功后刷新列表
   */
  const updateEscapeRoute = async (id: number, routeData: Partial<EscapeRoute>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<EscapeRoute> = await escapeRoutesApi.updateEscapeRoute(id, routeData)

      if (response.success) {
        ElMessage.success('逃生路线更新成功')
        await getEscapeRoutes()
        return response.data
      } else {
        ElMessage.error(response.message || '逃生路线更新失败')
        return null
      }
    } catch (error) {
      console.error('Update escape route error:', error)
      ElMessage.error('逃生路线更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除逃生路线
   * 对应后端：DELETE /escape-routes/{id}
   * 成功后刷新列表
   */
  const deleteEscapeRoute = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await escapeRoutesApi.deleteEscapeRoute(id)

      if (response.success) {
        ElMessage.success('逃生路线删除成功')
        await getEscapeRoutes()
        return true
      } else {
        ElMessage.error(response.message || '逃生路线删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete escape route error:', error)
      ElMessage.error('逃生路线删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 批量删除逃生路线
   * 对应后端：DELETE /escape-routes (ids[])
   * 成功后刷新列表
   */
  const batchDeleteEscapeRoutes = async (ids: number[]) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await escapeRoutesApi.deleteEscapeRoutes(ids)

      if (response.success) {
        ElMessage.success('逃生路线批量删除成功')
        await getEscapeRoutes()
        return true
      } else {
        ElMessage.error(response.message || '逃生路线批量删除失败')
        return false
      }
    } catch (error) {
      console.error('Batch delete escape routes error:', error)
      ElMessage.error('逃生路线批量删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 查询指定区域内的逃生路线
   * 对应后端：GET /escape-routes/in-area
   */
  const getRoutesByArea = async (bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
    try {
      const response: ApiResponse<EscapeRoute[]> = await escapeRoutesApi.getRoutesInArea(bounds)

      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取区域逃生路线失败')
        return []
      }
    } catch (error) {
      console.error('Get routes by area error:', error)
      ElMessage.error('获取区域逃生路线失败')
      return []
    }
  }

  /**
   * 获取路径推荐
   * 对应后端：GET /escape-routes/recommendations
   * 参数：startLng、startLat、endLng(可选)、endLat(可选)、maxDistance(可选)、minSafetyScore(可选)
   */
  const getRecommendations = async (params: {
    startLng: number;
    startLat: number;
    endLng?: number;
    endLat?: number;
    maxDistance?: number;
    minSafetyScore?: number;
  }) => {
    try {
      const response: ApiResponse<EscapeRoute[]> = await escapeRoutesApi.getRecommendations(params)

      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取路径推荐失败')
        return []
      }
    } catch (error) {
      console.error('Get recommendations error:', error)
      ElMessage.error('获取路径推荐失败')
      return []
    }
  }

  /**
   * 验证/更新逃生路线的验证状态
   * 对应后端：PATCH /escape-routes/{id}/verify
   */
  const verifyRoute = async (id: number, status: 'verified' | 'rejected' | 'pending', notes?: string) => {
    try {
      const response: ApiResponse<EscapeRoute> = await escapeRoutesApi.verifyRoute(id, { status, notes })

      if (response.success) {
        ElMessage.success('路线验证状态更新成功')
        await getEscapeRoutes()
        return response.data
      } else {
        ElMessage.error(response.message || '路线验证状态更新失败')
        return null
      }
    } catch (error) {
      console.error('Verify route error:', error)
      ElMessage.error('路线验证状态更新失败')
      return null
    }
  }

  /** 重置本 Store 的全部状态（触发 HMR 刷新） */
  const resetState = () => {
    escapeRoutes.value = []
    currentRoute.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    escapeRoutes,
    currentRoute,
    isLoading,
    total,
    currentPage,
    pageSize,

    // 计算属性
    verifiedRoutes,
    pendingRoutes,
    rejectedRoutes,
    highSafetyRoutes,
    lowDifficultyRoutes,
    emergencyRoutes,

    // 方法
    getEscapeRoutes,
    getEscapeRoute,
    createEscapeRoute,
    updateEscapeRoute,
    deleteEscapeRoute,
    batchDeleteEscapeRoutes,
    getRoutesByArea,
    getRecommendations,
    verifyRoute,
    resetState
  }
})