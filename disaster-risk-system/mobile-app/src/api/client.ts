import axios, { AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'
import { API_BASE_URL } from '../config/env'
import { useAuthStore } from '../store/auth'

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 })

// 请求拦截器：
// - 自动附加 Authorization
// - 仅在非 FormData 请求时设置 Content-Type: application/json
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState()
  const headers = AxiosHeaders.from(config.headers || {})

  // 检测是否为 FormData（用于文件上传）
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData

  if (!isFormData && !headers.getContentType()) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  config.headers = headers
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any
    const status = error.response?.status
    if (status === 401 && !original?._retry) {
      original._retry = true
      const ok = await useAuthStore.getState().refreshTokens()
      if (ok) return api(original)
    }
    return Promise.reject(error)
  }
)

export default api