import { request, paginatedRequest } from '../index'
import type { SystemConfig, ApiResponse, PaginatedResponse, QueryParams } from '../../types'

export const systemConfigApi = {
  // 获取系统配置列表
  getConfigs: (params?: QueryParams): Promise<PaginatedResponse<SystemConfig>> => {
    return paginatedRequest.get('/system-config', { params })
  },

  // 根据配置键获取配置
  getConfigByKey: (key: string): Promise<ApiResponse<SystemConfig>> => {
    return request.get(`/system-config/${key}`)
  },

  // 获取配置值
  getConfigValue: (key: string): Promise<ApiResponse<string>> => {
    return request.get(`/system-config/value/${key}`)
  },

  // 创建配置项
  createConfig: (data: Omit<SystemConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SystemConfig>> => {
    return request.post('/system-config', data)
  },

  // 更新配置项
  updateConfig: (key: string, data: Partial<Omit<SystemConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<SystemConfig>> => {
    return request.put(`/system-config/${key}`, data)
  },

  // 设置配置值
  setConfigValue: (key: string, value: string): Promise<ApiResponse<SystemConfig>> => {
    return request.patch(`/system-config/${key}/value`, { value })
  },

  // 删除配置项
  deleteConfig: (key: string): Promise<ApiResponse<null>> => {
    return request.delete(`/system-config/${key}`)
  },

  // 获取预警级别配置
  getWarningLevels: (): Promise<ApiResponse<any[]>> => {
    return request.get('/system-config/warning/levels')
  },

  // 批量更新配置
  batchUpdateConfigs: (configs: Array<{ id: number; value: string }>): Promise<ApiResponse<SystemConfig[]>> => {
    return request.put('/system-config/batch', { configs })
  },

  // 重置配置到默认值
  resetToDefault: (id: number): Promise<ApiResponse<SystemConfig>> => {
    return request.patch(`/system-config/${id}/reset`)
  },

  // 重置所有配置到默认值
  resetAllToDefault: (): Promise<ApiResponse<null>> => {
    return request.post('/system-config/reset/defaults')
  },

  // 导出配置
  exportConfigs: (): Promise<ApiResponse<{ configs: SystemConfig[] }>> => {
    return request.get('/system-config/export/download')
  },

  // 导入配置
  importConfigs: (configs: SystemConfig[]): Promise<ApiResponse<{ imported: number; failed: number }>> => {
    return request.post('/system-config/import/upload', { configs })
  },

  // 获取配置分组
  getConfigGroups: (): Promise<ApiResponse<string[]>> => {
    return request.get('/system-config/groups')
  },

  // 根据分组获取配置
  getConfigsByGroup: (group: string): Promise<ApiResponse<SystemConfig[]>> => {
    return request.get(`/system-config/group/${group}`)
  },

  // 验证配置值
  validateConfig: (key: string, value: string): Promise<ApiResponse<{ valid: boolean; message?: string }>> => {
    return request.post('/system-config/validate', { key, value })
  },

  // 清除缓存
  clearCache: (): Promise<ApiResponse<null>> => {
    return request.post('/system-config/cache/clear')
  },

  // 获取系统信息
  getSystemInfo: (): Promise<ApiResponse<{
    version: string;
    environment: string;
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
  }>> => {
    return request.get('/system-config/system/info')
  }
}