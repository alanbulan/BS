import { request, paginatedRequest } from '../index'
import type { RiskAssessment, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 风险评估API
export const riskAssessmentsApi = {
  // 获取风险评估列表
  /**
   * 获取风险评估列表
   * - 将除 page/limit 外的筛选条件序列化为 filters(JSON 字符串)
   * - 兼容 current_risk_level：映射为 risk_level_min 与 risk_level_max 等于同一值
   */
  getRiskAssessments: (params?: QueryParams & {
    zone_id?: number
    disaster_type_id?: number
    risk_level_min?: number
    risk_level_max?: number
    assessment_date_start?: string
    assessment_date_end?: string
    current_risk_level?: number
    start_time?: string
    end_time?: string
    created_by?: number
    assessment_method?: string
  }): Promise<PaginatedResponse<RiskAssessment>> => {
    const page = params?.page
    const limit = params?.limit

    // 组装 filters：仅保留后端支持的筛选字段
    const filters: Record<string, any> = {}
    if (params?.zone_id !== undefined) filters.zone_id = params.zone_id
    if (params?.risk_level_min !== undefined) filters.risk_level_min = params.risk_level_min
    if (params?.risk_level_max !== undefined) filters.risk_level_max = params.risk_level_max
    if (params?.current_risk_level !== undefined) {
      filters.risk_level_min = params.current_risk_level
      filters.risk_level_max = params.current_risk_level
    }
    if (params?.start_time) filters.start_time = params.start_time
    if (params?.end_time) filters.end_time = params.end_time
    if (params?.created_by !== undefined) filters.created_by = params.created_by
    if (params?.assessment_method) filters.assessment_method = params.assessment_method

    const requestParams: any = {
      page,
      limit,
      filters: Object.keys(filters).length ? JSON.stringify(filters) : undefined
    }

    return paginatedRequest.get('/risk-assessments', { params: requestParams })
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
  /**
   * 导出风险评估数据
   * - 支持 ids: number[]/string，数组将序列化为逗号分隔字符串传递为 ids
   * - 其余筛选条件序列化为 filters(JSON 字符串)
   * - format 透传（默认后端为 excel）
   */
  exportRiskAssessments: (params?: QueryParams & {
    ids?: number[] | string
    format?: 'excel' | 'csv'
    zone_id?: number
    risk_level_min?: number
    risk_level_max?: number
    current_risk_level?: number
    start_time?: string
    end_time?: string
    created_by?: number
    assessment_method?: string
  }): Promise<Blob> => {
    const outParams: Record<string, any> = {}

    // 处理 ids
    if (params?.ids !== undefined) {
      if (Array.isArray(params.ids)) {
        outParams.ids = params.ids.filter(id => Number.isFinite(id as number)).join(',')
      } else {
        outParams.ids = params.ids
      }
    }

    // 处理 format 透传
    if (params?.format) {
      outParams.format = params.format
    }

    // 组装 filters
    const filters: Record<string, any> = {}
    if (params?.zone_id !== undefined) filters.zone_id = params.zone_id
    if (params?.risk_level_min !== undefined) filters.risk_level_min = params.risk_level_min
    if (params?.risk_level_max !== undefined) filters.risk_level_max = params.risk_level_max
    if (params?.current_risk_level !== undefined) {
      filters.risk_level_min = params.current_risk_level
      filters.risk_level_max = params.current_risk_level
    }
    if (params?.start_time) filters.start_time = params.start_time
    if (params?.end_time) filters.end_time = params.end_time
    if (params?.created_by !== undefined) filters.created_by = params.created_by
    if (params?.assessment_method) filters.assessment_method = params.assessment_method

    if (Object.keys(filters).length) {
      outParams.filters = JSON.stringify(filters)
    }

    return request.download('/risk-assessments/export', {
      params: outParams
    })
  }
}