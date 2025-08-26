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
  verifyReport: (id: number, verificationNotes?: string): Promise<ApiResponse<UserReport>> => {
    return request.patch(`/reports/${id}/verify`, { verification_notes: verificationNotes })
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
  }
}