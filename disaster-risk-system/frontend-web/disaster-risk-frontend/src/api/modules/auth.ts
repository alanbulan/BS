import { request } from '../index'
import type { User, LoginForm, RegisterForm, ApiResponse } from '../../types'

// 认证相关API
export const authApi = {
  // 用户登录
  login: (data: LoginForm): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User; expiresIn: number }>> => {
    return request.post('/auth/login', data)
  },

  // 用户注册
  register: (data: RegisterForm): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User; expiresIn: number }>> => {
    return request.post('/auth/register', data)
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return request.get('/auth/me')
  },

  // 刷新token
  refreshToken: (): Promise<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>> => {
    return request.post('/auth/refresh-token')
  },

  // 用户登出
  logout: (): Promise<ApiResponse<null>> => {
    return request.post('/auth/logout')
  },

  // 修改密码
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
    return request.post('/auth/change-password', data)
  },

  // 忘记密码
  forgotPassword: (email: string): Promise<ApiResponse<null>> => {
    return request.post('/auth/forgot-password', { email })
  },

  // 重置密码
  resetPassword: (data: { token: string; password: string }): Promise<ApiResponse<null>> => {
    return request.post('/auth/reset-password', data)
  }
}