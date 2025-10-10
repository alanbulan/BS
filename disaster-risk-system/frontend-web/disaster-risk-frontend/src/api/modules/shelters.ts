import { request, paginatedRequest } from '../index'
import type { Shelter, ApiResponse, PaginatedResponse, QueryParams } from '../../types'

export const sheltersApi = {
  /**
   * 获取避难所列表
   * 与后端分页参数对齐，直接透传 params（后端兼容 page_size 和 limit）
   */
  getShelters: (params?: QueryParams): Promise<PaginatedResponse<Shelter>> => {
    return paginatedRequest.get('/shelters', { params })
  },

  /**
   * 获取单个避难所详情
   */
  getShelter: (id: number): Promise<ApiResponse<Shelter>> => {
    return request.get(`/shelters/${id}`)
  },

  /**
   * 创建避难所
   */
  createShelter: (data: Omit<Shelter, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Shelter>> => {
    return request.post('/shelters', data)
  },

  /**
   * 更新避难所
   */
  updateShelter: (id: number, data: Partial<Omit<Shelter, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Shelter>> => {
    return request.put(`/shelters/${id}`, data)
  },

  /**
   * 删除避难所
   */
  deleteShelter: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/shelters/${id}`)
  },

  /**
   * 获取最近的避难所
   * 后端参数为 latitude/longitude/radius
   */
  getNearestShelters: (lat: number, lng: number, radius: number = 5000): Promise<ApiResponse<Shelter[]>> => {
    return request.get('/shelters/nearest', {
      params: { latitude: lat, longitude: lng, radius }
    })
  },

  /**
   * 获取避难所统计信息
   */
  getShelterStatistics: (): Promise<ApiResponse<any>> => {
    return request.get('/shelters/statistics')
  },

  /**
   * 获取避难所类型
   */
  getShelterTypes: (): Promise<ApiResponse<string[]>> => {
    return request.get('/shelters/types')
  },

  /**
   * 更新避难所占用情况
   * 后端字段为 current_occupancy，严格对齐数据库字段
   */
  updateOccupancy: (id: number, occupancy: number): Promise<ApiResponse<Shelter>> => {
    return request.patch(`/shelters/${id}/occupancy`, { current_occupancy: occupancy })
  },

  /**
   * 批量删除避难所
   * 后端字段为 shelter_ids
   */
  batchDelete: (ids: number[]): Promise<ApiResponse<null>> => {
    return request.delete('/shelters/batch', { data: { shelter_ids: ids } })
  },

  /**
   * 获取容量历史
   */
  getCapacityHistory: (id: number): Promise<ApiResponse<any[]>> => {
    return request.get(`/shelters/${id}/capacity-history`)
  },

  /**
   * 批量更新状态（启用/禁用）
   * 后端字段为 shelter_ids 与 is_active
   */
  batchUpdateStatus: (data: { ids: number[], status: boolean }): Promise<ApiResponse<null>> => {
    const { ids, status } = data
    return request.patch('/shelters/batch-status', { shelter_ids: ids, is_active: status })
  },

  /**
   * 导出避难所数据
   */
  exportShelters: (params?: { ids?: number[] }): Promise<Blob> => {
    return request.download('/shelters/export', { params })
  }
}