import { request, paginatedRequest } from '../index'
import type { EscapeRoute, ApiResponse, PaginatedResponse, QueryParams } from '../../types'

export const escapeRoutesApi = {
  // 获取逃生路线列表
  getEscapeRoutes: (params?: QueryParams): Promise<PaginatedResponse<EscapeRoute>> => {
    return paginatedRequest.get('/escape-routes', { params })
  },

  // 获取单个逃生路线详情
  getEscapeRoute: (id: number): Promise<ApiResponse<EscapeRoute>> => {
    return request.get(`/escape-routes/${id}`)
  },

  // 创建逃生路线
  createEscapeRoute: (data: Omit<EscapeRoute, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<EscapeRoute>> => {
    return request.post('/escape-routes', data)
  },

  // 更新逃生路线
  updateEscapeRoute: (id: number, data: Partial<Omit<EscapeRoute, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<EscapeRoute>> => {
    return request.put(`/escape-routes/${id}`, data)
  },

  // 删除逃生路线
  deleteEscapeRoute: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/escape-routes/${id}`)
  },

  // 批量删除逃生路线
  deleteEscapeRoutes: (ids: number[]): Promise<ApiResponse<null>> => {
    return request.delete('/escape-routes/batch', { data: { ids } })
  },

  /**
   * 从指定点出发查询逃生路线（后端：GET /escape-routes/from-point）
   * @param params 查询参数：lng、lat、maxDistance(可选，默认5000)
   */
  getRoutesFromPoint: (params: { lng: number; lat: number; maxDistance?: number }): Promise<ApiResponse<EscapeRoute[]>> => {
    return request.get('/escape-routes/from-point', { params })
  },

  /**
   * 查找到指定避难点的逃生路线（后端：GET /escape-routes/to-shelter）
   * @param params 查询参数：lng、lat、maxDistance(可选，默认10000)
   */
  getRoutesToShelter: (params: { lng: number; lat: number; maxDistance?: number }): Promise<ApiResponse<EscapeRoute[]>> => {
    return request.get('/escape-routes/to-shelter', { params })
  },

  /**
   * 查询指定区域内的逃生路线（后端：GET /escape-routes/in-area）
   * @param bounds 区域边界参数：minLng、minLat、maxLng、maxLat
   */
  getRoutesInArea: (bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }): Promise<ApiResponse<EscapeRoute[]>> => {
    return request.get('/escape-routes/in-area', { params: bounds })
  },

  /**
   * 获取路径推荐（后端：GET /escape-routes/recommendations）
   * @param params 参数：startLng、startLat、endLng(可选)、endLat(可选)、maxDistance(可选)、minSafetyScore(可选)
   */
  getRecommendations: (params: {
    startLng: number;
    startLat: number;
    endLng?: number;
    endLat?: number;
    maxDistance?: number;
    minSafetyScore?: number;
  }): Promise<ApiResponse<EscapeRoute[]>> => {
    return request.get('/escape-routes/recommendations', { params })
  },

  /**
   * 验证/更新逃生路线的验证状态
   * 后端路由：PATCH /escape-routes/:id/verify
   * @param id 路线ID
   * @param payload 验证状态与可选备注
   */
  verifyRoute: (
    id: number,
    payload: { status: 'verified' | 'rejected' | 'pending'; notes?: string }
  ): Promise<ApiResponse<EscapeRoute>> => {
    return request.patch(`/escape-routes/${id}/verify`, payload)
  }
}