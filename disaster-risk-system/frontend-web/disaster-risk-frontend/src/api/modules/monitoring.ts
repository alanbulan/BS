import { request, paginatedRequest } from '../index'
import type { MonitoringStation, MonitoringData, QueryParams, ApiResponse, PaginatedResponse, MapBounds } from '../../types'

// 监测站点API
export const monitoringStationsApi = {
  // 获取监测站点列表
  getStations: (params?: QueryParams): Promise<PaginatedResponse<MonitoringStation>> => {
    return paginatedRequest.get('/monitoring/stations', { params })
  },

  // 获取监测站点详情
  getStation: (id: number): Promise<ApiResponse<MonitoringStation>> => {
    return request.get(`/monitoring/stations/${id}`)
  },

  // 创建监测站点
  createStation: (data: Partial<MonitoringStation>): Promise<ApiResponse<MonitoringStation>> => {
    return request.post('/monitoring/stations', data)
  },

  // 更新监测站点
  updateStation: (id: number, data: Partial<MonitoringStation>): Promise<ApiResponse<MonitoringStation>> => {
    return request.put(`/monitoring/stations/${id}`, data)
  },

  // 删除监测站点
  deleteStation: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/monitoring/stations/${id}`)
  },

  // 根据地理边界获取监测站点
  getStationsByBounds: (bounds: MapBounds): Promise<ApiResponse<MonitoringStation[]>> => {
    return request.get('/monitoring/stations', { params: bounds })
  },

  // 根据站点类型获取监测站点
  getStationsByType: (stationType: string): Promise<ApiResponse<MonitoringStation[]>> => {
    return request.get('/monitoring/stations', { params: { type: stationType } })
  },

  // 获取活跃监测站点
  getActiveStations: (): Promise<ApiResponse<MonitoringStation[]>> => {
    return request.get('/monitoring/stations', { params: { active: true } })
  },

  // 更新站点状态
  updateStationStatus: (id: number, isActive: boolean): Promise<ApiResponse<MonitoringStation>> => {
    return request.put(`/monitoring/stations/${id}`, { is_active: isActive })
  },

  // 批量更新站点状态
  batchUpdateStationStatus: (ids: number[], isActiveOrOptions: boolean | { is_active?: boolean; installation_status?: string }): Promise<ApiResponse<{ updated_count: number }>> => {
    const payload: any = { station_ids: ids }
    if (typeof isActiveOrOptions === 'boolean') {
      payload.is_active = isActiveOrOptions
    } else if (isActiveOrOptions && typeof isActiveOrOptions === 'object') {
      if (typeof isActiveOrOptions.is_active === 'boolean') payload.is_active = isActiveOrOptions.is_active
      if (isActiveOrOptions.installation_status) payload.installation_status = isActiveOrOptions.installation_status
    }
    return request.put('/monitoring/stations/batch/status', payload)
  },

  // 获取站点统计信息
  getStationStats: (): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    byType: Record<string, number>
    byZone: Record<string, number>
  }>> => {
    return request.get('/monitoring/stations/statistics')
  },

  // 导出监测站数据
  exportStations: (params: { ids?: number[] }): Promise<Blob> => {
    return request.get('/monitoring/export', {
      params,
      responseType: 'blob'
    }) as unknown as Promise<Blob>
  }
}

// 监测数据API
export const monitoringDataApi = {
  // 获取监测数据列表
  getData: (params?: QueryParams & {
    station_id?: string
    data_type?: string
    start_time?: string
    end_time?: string
  }): Promise<PaginatedResponse<MonitoringData>> => {
    return paginatedRequest.get('/monitoring', { params })
  },

  /**
   * 获取数据类型列表
   * 后端路由：GET /monitoring/data-types
   * 返回示例：[{ type: 'temperature', name: '温度', unit: '°C', description: '环境温度监测', count: 120, first_recorded: '2024-01-01T00:00:00Z', last_recorded: '2025-01-01T00:00:00Z', is_active: true }]
   */
  getDataTypes: (): Promise<ApiResponse<Array<{ type: string; name: string; unit: string; description?: string; count: number; first_recorded?: string; last_recorded?: string; is_active: boolean }>>> => {
    return request.get('/monitoring/data-types')
  },

  // 获取指定站点的最新数据
  getLatestData: (station_id: string): Promise<ApiResponse<MonitoringData[]>> => {
    return request.get('/monitoring/realtime', { params: { station_id } })
  },

  // 获取指定站点的历史数据
  getHistoricalData: (station_id: string, params: {
    data_type?: string
    start_time: string
    end_time: string
    interval?: string
  }): Promise<ApiResponse<MonitoringData[]>> => {
    return request.get('/monitoring', { params: { ...params, station_id } })
  },

  // 获取实时数据
  getRealTimeData: (params?: {
    station_id?: string
    data_type?: string
    minutes?: number
    limit?: number
  }): Promise<ApiResponse<MonitoringData[]>> => {
    return request.get('/monitoring/realtime', { params })
  },

  // 获取异常数据
  getAnomalousData: (params?: {
    station_id?: string
    start_time?: string
    end_time?: string
    threshold?: number
  }): Promise<ApiResponse<MonitoringData[]>> => {
    return request.get('/monitoring/anomalous', { params })
  },

  // 获取数据统计
  getDataStats: (params: {
    station_id?: string
    data_type?: string
    start_time: string
    end_time: string
  }): Promise<ApiResponse<{
    count: number
    average: number
    min: number
    max: number
    standardDeviation: number
  }>> => {
    return request.get('/monitoring/stations/statistics', { params })
  },

  // 导出监测数据
  exportData: (params: {
    station_id?: string
    data_type?: string
    start_time: string
    end_time: string
    format?: 'csv' | 'excel'
  }): Promise<Blob> => {
    return request.get('/monitoring', {
      params: { ...params, export: true },
      responseType: 'blob'
    }) as any
  },

  // 批量导入监测数据
  importData: (file: File): Promise<ApiResponse<{ imported: number; failed: number }>> => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/monitoring/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// 监测站扩展API（高级功能）
export const monitoringStationsApiExtended = {
  // 根据站点编号获取监测站
  getStationByStationId: (stationId: string): Promise<ApiResponse<MonitoringStation>> => {
    return request.get(`/monitoring/stations/code/${stationId}`)
  },

  // 根据风险区域获取监测站
  getStationsByZone: (zoneId: number): Promise<ApiResponse<MonitoringStation[]>> => {
    return request.get(`/monitoring/stations/zone/${zoneId}`)
  },

  // 获取需要维护的监测站
  getStationsNeedingMaintenance: (): Promise<ApiResponse<MonitoringStation[]>> => {
    return request.get('/monitoring/stations/maintenance/needed')
  },

  // 更新监测站维护计划
  updateMaintenanceSchedule: (id: number, schedule: any): Promise<ApiResponse<MonitoringStation>> => {
    return request.patch(`/monitoring/stations/${id}/maintenance-schedule`, { maintenance_schedule: schedule })
  },

  // 更新监测站设备信息
  updateStationEquipment: (id: number, equipment: any): Promise<ApiResponse<MonitoringStation>> => {
    return request.patch(`/monitoring/stations/${id}/equipment`, { equipment_info: equipment })
  },

  // 更新监测站位置
  updateStationLocation: (id: number, location: { longitude: number; latitude: number }): Promise<ApiResponse<MonitoringStation>> => {
    return request.patch(`/monitoring/stations/${id}/location`, { location })
  },

  // 获取监测站类型统计
  getStationTypeStats: (): Promise<ApiResponse<any[]>> => {
    return request.get('/monitoring/stations/stats/types')
  },

  // 获取数据传输状态
  getDataTransmissionStatus: (): Promise<ApiResponse<any[]>> => {
    return request.get('/monitoring/stations/transmission-status')
  },

  // 获取监测站完整统计信息
  getStationStatistics: (): Promise<ApiResponse<{
    total_stations: number
    active_stations: number
    inactive_stations: number
    station_types: number
    monitoring_types: number
    zones_covered: number
    installed_stations: number
    maintenance_stations: number
    overdue_maintenance: number
  }>> => {
    return request.get('/monitoring/stations/statistics')
  }
}

// 导出类型
export type { MonitoringStation, MonitoringData }