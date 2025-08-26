import { request, paginatedRequest } from '../index'
import type { RiskAssessment, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 风险评估API
export const riskAssessmentsApi = {
  // 获取风险评估列表
  getRiskAssessments: (params?: QueryParams & {
    zone_id?: number
    disaster_type_id?: number
    risk_level_min?: number
    risk_level_max?: number
    assessment_date_start?: string
    assessment_date_end?: string
  }): Promise<PaginatedResponse<RiskAssessment>> => {
    return paginatedRequest.get('/risk-assessments', { params })
  },

  // 获取风险评估详情
  getRiskAssessment: (id: number): Promise<ApiResponse<RiskAssessment>> => {
    return request.get(`/risk-assessments/${id}`)
  },

  // 创建风险评估
  createRiskAssessment: (data: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> => {
    return request.post('/risk-assessments', data)
  },

  // 更新风险评估
  updateRiskAssessment: (id: number, data: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> => {
    return request.put(`/risk-assessments/${id}`, data)
  },

  // 删除风险评估
  deleteRiskAssessment: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/risk-assessments/${id}`)
  },

  // 评估区域风险
  assessZoneRisk: (data: {
    zone_id: number
    disaster_type_id: number
    assessment_factors?: any
  }): Promise<ApiResponse<RiskAssessment>> => {
    return request.post('/risk-assessments/assess-zone', data)
  },

  // 批量评估风险
  batchAssessRisk: (data: {
    zone_ids: number[]
    disaster_type_id: number
    assessment_factors?: any
  }): Promise<ApiResponse<{
    successful: number
    failed: number
    assessments: RiskAssessment[]
  }>> => {
    return request.post('/risk-assessments/batch-assess', data)
  },

  // 评估位置风险
  assessLocationRisk: (data: {
    latitude: number
    longitude: number
    disaster_type_id: number
    radius?: number
  }): Promise<ApiResponse<{
    risk_level: number
    risk_score: number
    factors: any
    nearby_zones: any[]
  }>> => {
    return request.post('/risk-assessments/assess-location', data)
  },

  // 获取历史评估
  getHistoricalAssessments: (params: {
    zone_id?: number
    disaster_type_id?: number
    start_date?: string
    end_date?: string
    limit?: number
  }): Promise<ApiResponse<RiskAssessment[]>> => {
    return request.get('/risk-assessments/historical', { params })
  },

  // 获取高风险区域
  getHighRiskZones: (params?: {
    disaster_type_id?: number
    min_risk_level?: number
    limit?: number
  }): Promise<ApiResponse<any[]>> => {
    return request.get('/risk-assessments/high-risk-zones', { params })
  },

  // 获取风险评估统计信息
  getRiskAssessmentStats: (): Promise<ApiResponse<{
    total: number
    byRiskLevel: Record<number, number>
    byDisasterType: Record<string, number>
    averageRiskLevel: number
    recentAssessments: number
  }>> => {
    return request.get('/risk-assessments/stats')
  },

  // 导出风险评估数据
  exportRiskAssessments: (params?: QueryParams): Promise<Blob> => {
    return request.download('/risk-assessments/export', {
      params
    })
  }
}