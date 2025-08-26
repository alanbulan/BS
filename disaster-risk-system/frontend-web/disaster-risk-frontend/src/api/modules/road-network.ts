import { request, paginatedRequest } from '../index'
import type { RoadNetwork, QueryParams, ApiResponse, PaginatedResponse, MapBounds } from '../../types'

// 道路网络管理API
export const roadNetworkApi = {
  // 获取道路网络列表
  getRoadNetworks: (params?: QueryParams): Promise<PaginatedResponse<RoadNetwork>> => {
    return paginatedRequest.get('/road-network', { params })
  },

  // 获取道路详情
  getRoadNetwork: (id: number): Promise<ApiResponse<RoadNetwork>> => {
    return request.get(`/road-network/${id}`)
  },

  // 根据道路ID获取道路
  getRoadByRoadId: (roadId: string): Promise<ApiResponse<RoadNetwork>> => {
    return request.get(`/road-network/road/${roadId}`)
  },

  // 创建道路
  createRoadNetwork: (data: Partial<RoadNetwork>): Promise<ApiResponse<RoadNetwork>> => {
    return request.post('/road-network', data)
  },

  // 更新道路
  updateRoadNetwork: (id: number, data: Partial<RoadNetwork>): Promise<ApiResponse<RoadNetwork>> => {
    return request.put(`/road-network/${id}`, data)
  },

  // 删除道路
  deleteRoadNetwork: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/road-network/${id}`)
  },

  // 查找区域内的道路
  findRoadsInArea: (bounds: MapBounds): Promise<ApiResponse<RoadNetwork[]>> => {
    return request.get('/road-network/in-area', { params: bounds })
  },

  // 获取应急路线
  getEmergencyRoutes: (): Promise<ApiResponse<RoadNetwork[]>> => {
    return request.get('/road-network/emergency')
  },

  // 查找点附近的道路
  findRoadsNearPoint: (location: [number, number], radius?: number): Promise<ApiResponse<RoadNetwork[]>> => {
    return request.get('/road-network/near-point', {
      params: {
        lng: location[0],
        lat: location[1],
        radius: radius || 1000
      }
    })
  },

  // 连通性分析
  analyzeConnectivity: (startPoint: [number, number], endPoint: [number, number]): Promise<ApiResponse<{
    isConnected: boolean
    route?: any
    distance?: number
    estimatedTime?: number
  }>> => {
    return request.post('/road-network/analyze-connectivity', {
      start_point: startPoint,
      end_point: endPoint
    })
  },

  // 更新道路状况
  updateRoadCondition: (id: number, condition: string, notes?: string): Promise<ApiResponse<RoadNetwork>> => {
    return request.patch(`/road-network/${id}/condition-score`, {
      maintenance_status: condition,
      notes
    })
  },

  // 设置应急路线
  setEmergencyRoute: (id: number, isEmergency: boolean): Promise<ApiResponse<RoadNetwork>> => {
    return request.patch(`/road-network/${id}/emergency`, {
      is_emergency_route: isEmergency
    })
  },

  // 批量导入道路数据
  batchImportRoads: (data: Partial<RoadNetwork>[]): Promise<ApiResponse<{
    success: number
    failed: number
    errors?: string[]
  }>> => {
    return request.post('/road-network/batch-import', { roads: data })
  },

  // 获取道路统计信息
  getRoadNetworkStats: (): Promise<ApiResponse<{
    total: number
    byType: Record<string, number>
    byClass: Record<string, number>
    emergencyRoutes: number
    totalLength: number
    averageWidth: number
  }>> => {
    return request.get('/road-network/stats')
  },

  // 获取道路质量报告
  getQualityReport: (): Promise<ApiResponse<{
    goodCondition: number
    fairCondition: number
    poorCondition: number
    needsMaintenance: number
    lastUpdated: string
  }>> => {
    return request.get('/road-network/quality-report')
  },

  // 导出道路数据
  exportRoads: (params?: QueryParams): Promise<Blob> => {
    return request.download('/road-network/export', {
      params
    })
  }
}