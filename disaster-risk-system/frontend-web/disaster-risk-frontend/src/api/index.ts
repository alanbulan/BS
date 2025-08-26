import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, PaginatedResponse } from '../types'
import { ElMessage } from 'element-plus'
import router from '../router'

// 规范化 API 基础地址：若只配置到 /api （没有版本号），自动补上 /v1
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
const normalizedBaseURL = /\/api\/?$/.test(rawBaseURL)
  ? `${rawBaseURL.replace(/\/$/, '')}/v1`
  : rawBaseURL

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: normalizedBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          // 清除所有认证相关数据
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // 跳转到登录页
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 通用请求方法
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.get(url, config).then(res => res.data)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.post(url, data, config).then(res => res.data)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.put(url, data, config).then(res => res.data)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.delete(url, config).then(res => res.data)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.patch(url, data, config).then(res => res.data)
  },

  download: (url: string, config?: AxiosRequestConfig): Promise<Blob> => {
    return api.get(url, { ...config, responseType: 'blob' }).then(res => res.data)
  }
}

// 分页请求方法
export const paginatedRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<PaginatedResponse<T>> => {
    const requestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
    return api.get(url, requestConfig).then(res => res.data)
  }
}

// 导出所有API模块
export * from './modules'
export * from './modules/auth'
export * from './modules/monitoring'
// 移除不存在: disaster/zone/resource/report
export * from './modules/system-config'
export * from './modules/monitoring-station-types'

export default api