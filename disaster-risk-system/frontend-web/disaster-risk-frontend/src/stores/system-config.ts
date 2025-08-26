import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SystemConfig, ApiResponse, PaginatedResponse } from '../types'
import { systemConfigApi } from '../api/modules/system-config'
import { ElMessage } from 'element-plus'

export const useSystemConfigStore = defineStore('systemConfig', () => {
  // 状态
  const configs = ref<SystemConfig[]>([])
  const currentConfig = ref<SystemConfig | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const configGroups = ref<string[]>([])

  // 计算属性
  const systemConfigs = computed(() => 
    configs.value.filter(config => config.category === 'system')
  )

  const notificationConfigs = computed(() => 
    configs.value.filter(config => config.category === 'notification')
  )

  const mapConfigs = computed(() => 
    configs.value.filter(config => config.category === 'map')
  )

  const assessmentConfigs = computed(() => 
    configs.value.filter(config => config.category === 'assessment')
  )

  const warningConfigs = computed(() => 
    configs.value.filter(config => config.category === 'warning')
  )

  const emergencyConfigs = computed(() => 
    configs.value.filter(config => config.category === 'emergency')
  )

  const dataConfigs = computed(() => 
    configs.value.filter(config => config.category === 'data')
  )

  const apiConfigs = computed(() => 
    configs.value.filter(config => config.category === 'api')
  )

  const systemOnlyConfigs = computed(() => 
    configs.value.filter(config => !config.is_public)
  )

  const publicConfigs = computed(() => 
    configs.value.filter(config => config.is_public)
  )

  // 获取系统配置列表
  const getConfigs = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<SystemConfig> = await systemConfigApi.getConfigs({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        configs.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取系统配置列表失败')
      }
    } catch (error) {
      console.error('Get configs error:', error)
      ElMessage.error('获取系统配置列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个配置项
  const getConfig = async (key: string) => {
    try {
      isLoading.value = true
      const response: ApiResponse<SystemConfig> = await systemConfigApi.getConfigByKey(key)
      
      if (response.success && response.data) {
        currentConfig.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取配置项详情失败')
        return null
      }
    } catch (error) {
      console.error('Get config error:', error)
      ElMessage.error('获取配置项详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 根据配置键获取配置
  const getConfigByKey = async (key: string) => {
    try {
      const response: ApiResponse<SystemConfig> = await systemConfigApi.getConfigByKey(key)
      
      if (response.success && response.data) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取配置项失败')
        return null
      }
    } catch (error) {
      console.error('Get config by key error:', error)
      ElMessage.error('获取配置项失败')
      return null
    }
  }

  // 创建配置项
  const createConfig = async (configData: Omit<SystemConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<SystemConfig> = await systemConfigApi.createConfig(configData)
      
      if (response.success) {
        ElMessage.success('配置项创建成功')
        await getConfigs()
        return response.data
      } else {
        ElMessage.error(response.message || '配置项创建失败')
        return null
      }
    } catch (error) {
      console.error('Create config error:', error)
      ElMessage.error('配置项创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新配置项
  const updateConfig = async (key: string, configData: Partial<SystemConfig>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<SystemConfig> = await systemConfigApi.updateConfig(key, configData)
      
      if (response.success) {
        ElMessage.success('配置项更新成功')
        await getConfigs()
        return response.data
      } else {
        ElMessage.error(response.message || '配置项更新失败')
        return null
      }
    } catch (error) {
      console.error('Update config error:', error)
      ElMessage.error('配置项更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除配置项
  const deleteConfig = async (key: string) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await systemConfigApi.deleteConfig(key)
      
      if (response.success) {
        ElMessage.success('配置项删除成功')
        await getConfigs()
        return true
      } else {
        ElMessage.error(response.message || '配置项删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete config error:', error)
      ElMessage.error('配置项删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 批量更新配置
  const batchUpdateConfigs = async (configUpdates: Array<{ id: number; value: string }>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<SystemConfig[]> = await systemConfigApi.batchUpdateConfigs(configUpdates)
      
      if (response.success) {
        ElMessage.success('配置批量更新成功')
        await getConfigs()
        return response.data
      } else {
        ElMessage.error(response.message || '配置批量更新失败')
        return null
      }
    } catch (error) {
      console.error('Batch update configs error:', error)
      ElMessage.error('配置批量更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 重置配置到默认值
  const resetToDefault = async (id: number) => {
    try {
      const response: ApiResponse<SystemConfig> = await systemConfigApi.resetToDefault(id)
      
      if (response.success) {
        ElMessage.success('配置重置成功')
        await getConfigs()
        return response.data
      } else {
        ElMessage.error(response.message || '配置重置失败')
        return null
      }
    } catch (error) {
      console.error('Reset to default error:', error)
      ElMessage.error('配置重置失败')
      return null
    }
  }

  // 重置所有配置到默认值
  const resetAllToDefault = async () => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await systemConfigApi.resetAllToDefault()
      
      if (response.success) {
        ElMessage.success('所有配置重置成功')
        await getConfigs()
        return true
      } else {
        ElMessage.error(response.message || '所有配置重置失败')
        return false
      }
    } catch (error) {
      console.error('Reset all to default error:', error)
      ElMessage.error('所有配置重置失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 导出配置
  const exportConfigs = async () => {
    try {
      const response = await systemConfigApi.exportConfigs()
      
      if (response.success) {
        ElMessage.success('配置导出成功')
        return response.data
      } else {
        ElMessage.error(response.message || '配置导出失败')
        return null
      }
    } catch (error) {
      console.error('Export configs error:', error)
      ElMessage.error('配置导出失败')
      return null
    }
  }

  // 导入配置
  const importConfigs = async (configsToImport: SystemConfig[]) => {
    try {
      isLoading.value = true
      const response = await systemConfigApi.importConfigs(configsToImport)
      
      if (response.success) {
        ElMessage.success('配置导入成功')
        await getConfigs()
        return response.data
      } else {
        ElMessage.error(response.message || '配置导入失败')
        return null
      }
    } catch (error) {
      console.error('Import configs error:', error)
      ElMessage.error('配置导入失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 获取配置分组
  const getConfigGroups = async () => {
    try {
      const response: ApiResponse<string[]> = await systemConfigApi.getConfigGroups()
      
      if (response.success) {
        configGroups.value = response.data || []
        return response.data
      } else {
        ElMessage.error(response.message || '获取配置分组失败')
        return []
      }
    } catch (error) {
      console.error('Get config groups error:', error)
      ElMessage.error('获取配置分组失败')
      return []
    }
  }

  // 根据分组获取配置
  const getConfigsByGroup = async (group: string) => {
    try {
      const response: ApiResponse<SystemConfig[]> = await systemConfigApi.getConfigsByGroup(group)
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取分组配置失败')
        return []
      }
    } catch (error) {
      console.error('Get configs by group error:', error)
      ElMessage.error('获取分组配置失败')
      return []
    }
  }

  // 验证配置值
  const validateConfig = async (key: string, value: string) => {
    try {
      const response = await systemConfigApi.validateConfig(key, value)
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '验证配置值失败')
        return null
      }
    } catch (error) {
      console.error('Validate config error:', error)
      ElMessage.error('验证配置值失败')
      return null
    }
  }

  // 清除缓存
  const clearCache = async () => {
    try {
      const response: ApiResponse<null> = await systemConfigApi.clearCache()
      
      if (response.success) {
        ElMessage.success('缓存清除成功')
        return true
      } else {
        ElMessage.error(response.message || '缓存清除失败')
        return false
      }
    } catch (error) {
      console.error('Clear cache error:', error)
      ElMessage.error('缓存清除失败')
      return false
    }
  }

  // 获取系统信息
  const getSystemInfo = async () => {
    try {
      const response = await systemConfigApi.getSystemInfo()
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取系统信息失败')
        return null
      }
    } catch (error) {
      console.error('Get system info error:', error)
      ElMessage.error('获取系统信息失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    configs.value = []
    currentConfig.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
    configGroups.value = []
  }

  return {
    // 状态
    configs,
    currentConfig,
    isLoading,
    total,
    currentPage,
    pageSize,
    configGroups,
    
    // 计算属性
    systemConfigs,
    notificationConfigs,
    mapConfigs,
    assessmentConfigs,
    warningConfigs,
    emergencyConfigs,
    dataConfigs,
    apiConfigs,
    systemOnlyConfigs,
    publicConfigs,
    
    // 方法
    getConfigs,
    getConfig,
    getConfigByKey,
    createConfig,
    updateConfig,
    deleteConfig,
    batchUpdateConfigs,
    resetToDefault,
    resetAllToDefault,
    exportConfigs,
    importConfigs,
    getConfigGroups,
    getConfigsByGroup,
    validateConfig,
    clearCache,
    getSystemInfo,
    resetState
  }
})