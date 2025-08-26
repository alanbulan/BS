import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RiskZone, ApiResponse, PaginatedResponse } from '../types'
import { riskZonesApi } from '../api/modules/riskZones'
import { ElMessage } from 'element-plus'

export const useRiskZonesStore = defineStore('riskZones', () => {
  // 状态
  const riskZones = ref<RiskZone[]>([])
  const currentRiskZone = ref<RiskZone | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const highRiskZones = computed(() => 
    riskZones.value.filter(zone => zone.base_risk_level >= 3)
  )

  const mediumRiskZones = computed(() => 
    riskZones.value.filter(zone => zone.base_risk_level === 2)
  )

  const lowRiskZones = computed(() => 
    riskZones.value.filter(zone => zone.base_risk_level === 1)
  )

  const activeRiskZones = computed(() => 
    riskZones.value.filter(zone => zone.is_monitored)
  )

  // 获取风险区域列表
  const getRiskZones = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<RiskZone> = await riskZonesApi.getRiskZones({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        riskZones.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取风险区域列表失败')
      }
    } catch (error) {
      console.error('Get risk zones error:', error)
      ElMessage.error('获取风险区域列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个风险区域详情
  const getRiskZone = async (id: number) => {
    try {
      isLoading.value = true
      console.log('=== 开始获取风险区域详情 ===')
      console.log('请求ID:', id)
      
      const response: ApiResponse<RiskZone> = await riskZonesApi.getRiskZone(id)
      console.log('API响应:', response)
      
      if (response.success && response.data) {
        console.log('获取成功，数据:', response.data)
        console.log('geometry字段:', response.data.geometry)
        currentRiskZone.value = response.data
        return response.data
      } else {
        console.error('API返回失败:', response.message)
        ElMessage.error(response.message || '获取风险区域详情失败')
        return null
      }
    } catch (error) {
      console.error('Get risk zone error:', error)
      ElMessage.error('获取风险区域详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建风险区域
  const createRiskZone = async (data: Omit<RiskZone, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<RiskZone> = await riskZonesApi.createRiskZone(data)
      
      if (response.success) {
        ElMessage.success('风险区域创建成功')
        await getRiskZones()
        return response.data
      } else {
        ElMessage.error(response.message || '风险区域创建失败')
        return null
      }
    } catch (error) {
      console.error('Create risk zone error:', error)
      ElMessage.error('风险区域创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新风险区域
  const updateRiskZone = async (id: number, data: Partial<RiskZone>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<RiskZone> = await riskZonesApi.updateRiskZone(id, data)
      
      if (response.success) {
        ElMessage.success('风险区域更新成功')
        await getRiskZones()
        return response.data
      } else {
        ElMessage.error(response.message || '风险区域更新失败')
        return null
      }
    } catch (error) {
      console.error('Update risk zone error:', error)
      ElMessage.error('风险区域更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除风险区域
  const deleteRiskZone = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await riskZonesApi.deleteRiskZone(id)
      
      if (response.success) {
        ElMessage.success('风险区域删除成功')
        await getRiskZones()
        return true
      } else {
        ElMessage.error(response.message || '风险区域删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete risk zone error:', error)
      ElMessage.error('风险区域删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 更新风险等级
  const updateRiskLevel = async (id: number, riskLevel: 'low' | 'medium' | 'high' | 'critical') => {
    try {
      const response: ApiResponse<RiskZone> = await riskZonesApi.updateRiskZone(id, { base_risk_level: riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4 })
      
      if (response.success) {
        ElMessage.success('风险等级更新成功')
        await getRiskZones()
        return response.data
      } else {
        ElMessage.error(response.message || '风险等级更新失败')
        return null
      }
    } catch (error) {
      console.error('Update risk level error:', error)
      ElMessage.error('风险等级更新失败')
      return null
    }
  }

  // 获取附近的风险区域
  const getNearbyRiskZones = async (lat: number, lng: number, radius: number = 5000) => {
    try {
      // 计算边界范围
      const params = {
        latitude: lat,
        longitude: lng,
        radius: radius
      }
      const response: ApiResponse<RiskZone[]> = await riskZonesApi.getRiskZonesByLocation(params)
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取附近风险区域失败')
        return []
      }
    } catch (error) {
      console.error('Get nearby risk zones error:', error)
      ElMessage.error('获取附近风险区域失败')
      return []
    }
  }

  // 重置状态
  const resetState = () => {
    riskZones.value = []
    currentRiskZone.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    riskZones,
    currentRiskZone,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    highRiskZones,
    mediumRiskZones,
    lowRiskZones,
    activeRiskZones,
    
    // 方法
    getRiskZones,
    getRiskZone,
    createRiskZone,
    updateRiskZone,
    deleteRiskZone,
    updateRiskLevel,
    getNearbyRiskZones,
    resetState
  }
})