import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MonitoringStation, MonitoringData, ApiResponse, PaginatedResponse } from '../types'
import { monitoringStationsApi, monitoringDataApi } from '../api/modules/monitoring'
import { ElMessage } from 'element-plus'

export const useMonitoringStore = defineStore('monitoring', () => {
  // 状态
  const stations = ref<MonitoringStation[]>([])
  const currentStation = ref<MonitoringStation | null>(null)
  const monitoringData = ref<MonitoringData[]>([])
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const activeStations = computed(() => 
    stations.value.filter(station => station.is_active)
  )

  const offlineStations = computed(() => 
    stations.value.filter(station => !station.is_active)
  )

  const maintenanceStations = computed(() => 
    stations.value.filter(station => !station.is_active && station.maintenance_schedule)
  )

  // 获取监测站列表
  const getStations = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<MonitoringStation> = await monitoringStationsApi.getStations({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        stations.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取监测站列表失败')
      }
    } catch (error) {
      console.error('Get stations error:', error)
      ElMessage.error('获取监测站列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个监测站详情
  const getStation = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<MonitoringStation> = await monitoringStationsApi.getStation(id)
      
      if (response.success && response.data) {
        currentStation.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取监测站详情失败')
        return null
      }
    } catch (error) {
      console.error('Get station error:', error)
      ElMessage.error('获取监测站详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建监测站
  const createStation = async (data: Omit<MonitoringStation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<MonitoringStation> = await monitoringStationsApi.createStation(data)
      
      if (response.success) {
        ElMessage.success('监测站创建成功')
        await getStations()
        return response.data
      } else {
        ElMessage.error(response.message || '监测站创建失败')
        return null
      }
    } catch (error) {
      console.error('Create station error:', error)
      ElMessage.error('监测站创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新监测站
  const updateStation = async (id: number, data: Partial<MonitoringStation>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<MonitoringStation> = await monitoringStationsApi.updateStation(id, data)
      
      if (response.success) {
        ElMessage.success('监测站更新成功')
        await getStations()
        return response.data
      } else {
        ElMessage.error(response.message || '监测站更新失败')
        return null
      }
    } catch (error) {
      console.error('Update station error:', error)
      ElMessage.error('监测站更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除监测站
  const deleteStation = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await monitoringStationsApi.deleteStation(id)
      
      if (response.success) {
        ElMessage.success('监测站删除成功')
        await getStations()
        return true
      } else {
        ElMessage.error(response.message || '监测站删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete station error:', error)
      ElMessage.error('监测站删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 获取监测数据
  const getMonitoringData = async (stationId: number, params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<MonitoringData> = await monitoringDataApi.getData({ station_id: stationId.toString(), ...params })
      
      if (response.success) {
        monitoringData.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取监测数据失败')
        return []
      }
    } catch (error) {
      console.error('Get monitoring data error:', error)
      ElMessage.error('获取监测数据失败')
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 更新监测站状态
  const updateStationStatus = async (id: number, status: 'active' | 'offline' | 'maintenance') => {
    try {
      const isActive = status === 'active'
      const response: ApiResponse<MonitoringStation> = await monitoringStationsApi.updateStationStatus(id, isActive)
      
      if (response.success) {
        ElMessage.success('监测站状态更新成功')
        await getStations()
        return response.data
      } else {
        ElMessage.error(response.message || '监测站状态更新失败')
        return null
      }
    } catch (error) {
      console.error('Update station status error:', error)
      ElMessage.error('监测站状态更新失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    stations.value = []
    currentStation.value = null
    monitoringData.value = []
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    stations,
    currentStation,
    monitoringData,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    activeStations,
    offlineStations,
    maintenanceStations,
    
    // 方法
    getStations,
    getStation,
    createStation,
    updateStation,
    deleteStation,
    getMonitoringData,
    updateStationStatus,
    resetState
  }
})