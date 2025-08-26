import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Shelter, ApiResponse, PaginatedResponse } from '../types'
import { sheltersApi } from '../api/modules/shelters'
import { ElMessage } from 'element-plus'

export const useSheltersStore = defineStore('shelters', () => {
  // 状态
  const shelters = ref<Shelter[]>([])
  const currentShelter = ref<Shelter | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const activeShelters = computed(() => 
    shelters.value.filter(shelter => shelter.is_active === true)
  )

  const inactiveShelters = computed(() => 
    shelters.value.filter(shelter => shelter.is_active === false)
  )

  const fullShelters = computed(() => 
    shelters.value.filter(shelter => 
      shelter.is_active === true && (shelter.current_occupancy || 0) >= shelter.capacity
    )
  )

  const highCapacityShelters = computed(() => 
    shelters.value.filter(shelter => shelter.capacity >= 100)
  )

  const availableShelters = computed(() => 
    shelters.value.filter(shelter => 
      shelter.is_active === true && 
      (shelter.current_occupancy || 0) < shelter.capacity
    )
  )



  // 获取避难所列表
  const getShelters = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<Shelter> = await sheltersApi.getShelters({
        page: currentPage.value,
        page_size: pageSize.value,
        ...params
      })
      
      if (response.success) {
        shelters.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取避难所列表失败')
      }
    } catch (error) {
      console.error('Get shelters error:', error)
      ElMessage.error('获取避难所列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个避难所详情
  const getShelter = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Shelter> = await sheltersApi.getShelter(id)
      
      if (response.success && response.data) {
        currentShelter.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取避难所详情失败')
        return null
      }
    } catch (error) {
      console.error('Get shelter error:', error)
      ElMessage.error('获取避难所详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建避难所
  const createShelter = async (shelterData: Omit<Shelter, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Shelter> = await sheltersApi.createShelter(shelterData)
      
      if (response.success) {
        ElMessage.success('避难所创建成功')
        await getShelters()
        return response.data
      } else {
        ElMessage.error(response.message || '避难所创建失败')
        return null
      }
    } catch (error) {
      console.error('Create shelter error:', error)
      ElMessage.error('避难所创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新避难所
  const updateShelter = async (id: number, shelterData: Partial<Shelter>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<Shelter> = await sheltersApi.updateShelter(id, shelterData)
      
      if (response.success) {
        ElMessage.success('避难所更新成功')
        await getShelters()
        return response.data
      } else {
        ElMessage.error(response.message || '避难所更新失败')
        return null
      }
    } catch (error) {
      console.error('Update shelter error:', error)
      ElMessage.error('避难所更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除避难所
  const deleteShelter = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await sheltersApi.deleteShelter(id)
      
      if (response.success) {
        ElMessage.success('避难所删除成功')
        await getShelters()
        return true
      } else {
        ElMessage.error(response.message || '避难所删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete shelter error:', error)
      ElMessage.error('避难所删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 批量删除避难所
  const batchDeleteShelters = async (ids: number[]) => {
    try {
      isLoading.value = true
      // 批量删除需要逐个调用单个删除接口
      const deletePromises = ids.map(id => sheltersApi.deleteShelter(id))
      const responses = await Promise.all(deletePromises)
      const allSuccess = responses.every(response => response.success)
      
      if (allSuccess) {
        ElMessage.success('避难所批量删除成功')
        await getShelters()
        return true
      } else {
        ElMessage.error('部分避难所删除失败')
        return false
      }
    } catch (error) {
      console.error('Batch delete shelters error:', error)
      ElMessage.error('避难所批量删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 获取附近的避难所
  const getNearbyShelters = async (lat: number, lng: number, radius: number = 5000) => {
    try {
      const response: ApiResponse<Shelter[]> = await sheltersApi.getNearestShelters(lat, lng, radius)
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取附近避难所失败')
        return []
      }
    } catch (error) {
      console.error('Get nearby shelters error:', error)
      ElMessage.error('获取附近避难所失败')
      return []
    }
  }

  // 检查避难所容量 - 该功能暂不可用
  const checkCapacity = async (id: number) => {
    try {
      // 暂时返回避难所详情信息
      const response = await sheltersApi.getShelter(id)
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '检查避难所容量失败')
        return null
      }
    } catch (error) {
      console.error('Check capacity error:', error)
      ElMessage.error('检查避难所容量失败')
      return null
    }
  }

  // 更新避难所入住率
  const updateShelterStatus = async (id: number, occupancy: number) => {
    try {
      const response: ApiResponse<Shelter> = await sheltersApi.updateOccupancy(id, occupancy)
      
      if (response.success) {
        ElMessage.success('避难所状态更新成功')
        await getShelters()
        return response.data
      } else {
        ElMessage.error(response.message || '避难所状态更新失败')
        return null
      }
    } catch (error) {
      console.error('Update shelter status error:', error)
      ElMessage.error('避难所状态更新失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    shelters.value = []
    currentShelter.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    shelters,
    currentShelter,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    activeShelters,
    inactiveShelters,
    fullShelters,
    highCapacityShelters,
    availableShelters,
    
    // 方法
    getShelters,
    getShelter,
    createShelter,
    updateShelter,
    deleteShelter,
    batchDeleteShelters,
    getNearbyShelters,
    checkCapacity,
    updateShelterStatus,
    resetState
  }
})