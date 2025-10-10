import { request, paginatedRequest } from '../index'
import type { UserReport, ApiResponse, PaginatedResponse, QueryParams } from '../../types'

export const userReportsApi = {
  // 获取用户报告列表
  getUserReports: (params?: QueryParams): Promise<PaginatedResponse<UserReport>> => {
    return paginatedRequest.get('/reports', { params })
  },

  // 获取单个用户报告详情
  getUserReport: (id: number): Promise<ApiResponse<UserReport>> => {
    return request.get(`/reports/${id}`)
  },

  // 创建用户报告
  createUserReport: (data: Omit<UserReport, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<UserReport>> => {
    return request.post('/reports', data)
  },

  // 更新用户报告
  updateUserReport: (id: number, data: Partial<Omit<UserReport, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<UserReport>> => {
    return request.put(`/reports/${id}`, data)
  },

  // 删除用户报告
  deleteUserReport: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/reports/${id}`)
  },

  // 验证报告
  /**
   * 调用后端验证接口，更新报告的验证状态
   * @param id 报告ID
   * @param data 验证数据，包含 verification_status、verified_by、verification_notes
   */
  verifyReport: (
    id: number,
    data: { verification_status: 'pending' | 'verified' | 'rejected'; verified_by: number; verification_notes?: string }
  ): Promise<ApiResponse<UserReport>> => {
    return request.patch(`/reports/${id}/verify`, data)
  },

  // 获取报告统计
  getReportStats: (): Promise<ApiResponse<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    resolved: number;
  }>> => {
    return request.get('/reports/stats/types')
  },

  // 获取我的报告（当前登录用户）
  getMyReports: (params?: QueryParams): Promise<PaginatedResponse<UserReport>> => {
    return paginatedRequest.get('/user-reports/my-reports', { params })
  },

  // 更新报告投票（点赞/点踩）
  updateVotes: (id: number, voteType: 'upvote' | 'downvote'): Promise<ApiResponse<UserReport>> => {
    return request.patch(`/user-reports/${id}/vote`, { vote_type: voteType })
  },

  // 获取附近的用户报告
  getNearbyReports: (params: {
    latitude: number
    longitude: number
    radius?: number
    report_type?: string
    max_age_hours?: number
    min_severity?: number
    limit?: number
  }): Promise<ApiResponse<UserReport[]>> => {
    return request.get('/user-reports/nearby', { params })
  },

  // 获取报告类型统计
  getReportTypeStats: (): Promise<ApiResponse<Array<{
    report_type: string
    count: number
    avg_severity: number
    verified_count: number
    emergency_count: number
  }>>> => {
    return request.get('/user-reports/stats/types')
  },

  // 获取最近的紧急报告
  getRecentEmergencyReports: (params?: {
    hours?: number
    limit?: number
  }): Promise<ApiResponse<UserReport[]>> => {
    return request.get('/user-reports/emergency/recent', { params })
  },

  // 获取报告类型列表
  getReportTypes: (): Promise<ApiResponse<string[]>> => {
    return request.get('/user-reports/types')
  },

  // 获取报告相关常量
  getReportConstants: (): Promise<ApiResponse<{
    reportTypes: Record<string, string>
    reportTypeLabels: Record<string, string>
    verificationStatuses: Record<string, string>
    verificationStatusLabels: Record<string, string>
    severityLevels: number[]
    severityLevelLabels: Record<number, string>
  }>> => {
    return request.get('/user-reports/constants')
  }
}