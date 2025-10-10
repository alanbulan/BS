import { request, paginatedRequest } from '../index'
import type { Warning, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 预警信息API
export const warningsApi = {
  // 获取预警列表
  getWarnings: (params?: QueryParams & {
    status?: 'active' | 'expired' | 'cancelled'
    warning_level?: number
    zone_id?: number
    disaster_type_id?: number
    evacuation_required?: boolean
    title?: string
  }): Promise<PaginatedResponse<Warning>> => {
    return paginatedRequest.get('/warnings', { params })
  },

  // 获取预警详情
  getWarning: (id: number): Promise<ApiResponse<Warning>> => {
    return request.get(`/warnings/${id}`)
  },

  // 创建预警
  createWarning: (data: Partial<Warning>): Promise<ApiResponse<Warning>> => {
    return request.post('/warnings', data)
  },

  // 更新预警
  updateWarning: (id: number, data: Partial<Warning>): Promise<ApiResponse<Warning>> => {
    return request.put(`/warnings/${id}`, data)
  },

  // 取消预警
  cancelWarning: (id: number, reason?: string): Promise<ApiResponse<Warning>> => {
    return request.patch(`/warnings/${id}/cancel`, { reason })
  },

  // 删除预警
  deleteWarning: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/warnings/${id}`)
  },

  // 获取活跃预警
  getActiveWarnings: (): Promise<ApiResponse<Warning[]>> => {
    return request.get('/warnings/active')
  },

  // 根据等级获取预警
  getWarningsByLevel: (level: number): Promise<ApiResponse<Warning[]>> => {
    return request.get('/warnings/level', { params: { level } })
  },

  // 根据区域获取预警
  getWarningsByZone: (zoneId: number): Promise<ApiResponse<Warning[]>> => {
    return request.get(`/warnings/zone/${zoneId}`)
  },

  // 根据灾害类型获取预警
  getWarningsByDisasterType: (disasterTypeId: number): Promise<ApiResponse<Warning[]>> => {
    return request.get(`/warnings/disaster-type/${disasterTypeId}`)
  },

  // 获取疏散预警
  getEvacuationWarnings: (): Promise<ApiResponse<Warning[]>> => {
    return request.get('/warnings/evacuation')
  },

  // 根据位置获取预警
  getWarningsByLocation: (params: { latitude: number; longitude: number; radius?: number }): Promise<ApiResponse<Warning[]>> => {
    return request.get('/warnings/location', { params })
  },

  // 自动评估预警
  autoAssessAndWarn: (): Promise<ApiResponse<any>> => {
    return request.post('/warnings/auto-assess')
  },

  // 处理过期预警
  processExpiredWarnings: (): Promise<ApiResponse<any>> => {
    return request.post('/warnings/process-expired')
  },

  // 获取预警统计信息
  getWarningStats: (): Promise<ApiResponse<{
    total: number
    active: number
    expired: number
    cancelled: number
    byLevel: Record<number, number>
    byDisasterType: Record<string, number>
    recentWarnings: number
  }>> => {
    return request.get('/warnings/stats')
  },

  // 获取预警历史记录
  getWarningHistory: (warningId: number): Promise<ApiResponse<Array<{
    id: number
    warning_id: number
    update_sequence: number
    action: string
    content: string
    updated_by?: number
    updated_by_name?: string
    timestamp: string
    created_at: string
  }>>> => {
    return request.get(`/warnings/${warningId}/history`)
  },

  // 获取特定区域内的预警
  getWarningsInArea: (polygon: any): Promise<ApiResponse<Warning[]>> => {
    return request.post('/warnings/area', { polygon })
  },

  // 获取预警等级统计
  getWarningLevelStats: (): Promise<ApiResponse<Record<number, number>>> => {
    return request.get('/warnings/stats/level')
  },

  // 获取灾害类型预警统计
  getDisasterTypeWarningStats: (): Promise<ApiResponse<Record<string, number>>> => {
    return request.get('/warnings/stats/disaster-type')
  },

  // 更新预警状态
  updateWarningStatus: (id: number, status: 'active' | 'cancelled' | 'expired'): Promise<ApiResponse<Warning>> => {
    return request.patch(`/warnings/${id}/status`, { status })
  },

  // 创建预警更新记录
  createWarningUpdate: (id: number, data: {
    content: string
    update_type: string
    updated_fields?: Record<string, any>
  }): Promise<ApiResponse<any>> => {
    return request.post(`/warnings/${id}/updates`, data)
  },

  // 导出预警数据
  exportWarnings: (params?: QueryParams): Promise<Blob> => {
    return request.get('/warnings/export', {
      params,
      responseType: 'blob'
    }) as any
  }
}