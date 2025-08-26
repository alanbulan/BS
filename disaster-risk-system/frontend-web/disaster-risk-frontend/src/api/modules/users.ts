import { request, paginatedRequest } from '../index'
import type { User, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 用户管理API
export const usersApi = {
  // 获取用户列表
  getUsers: (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    return paginatedRequest.get('/users', { params })
  },

  // 获取用户详情
  getUser: (id: number): Promise<ApiResponse<User>> => {
    return request.get(`/users/${id}`)
  },

  // 创建用户
  createUser: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return request.post('/users', data)
  },

  // 更新用户
  updateUser: (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    return request.put(`/users/${id}`, data)
  },

  // 删除用户
  deleteUser: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/users/${id}`)
  },

  // 激活/禁用用户
  toggleUserStatus: (id: number, isActive: boolean): Promise<ApiResponse<User>> => {
    return request.patch(`/users/${id}/status`, { isActive })
  },

  // 获取用户统计信息
  getUserStats: (): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    byRole: Record<string, number>
    recentRegistrations: number
  }>> => {
    return request.get('/users/stats')
  }
}