import { request } from '../index'
import type { ApiResponse } from '../../types'

// 当前天气数据接口
export interface CurrentWeather {
  location: string
  temperature: number
  humidity: number
  windSpeed: number
  conditions: string
  timestamp: string
  pressure?: number
  visibility?: number
}

// 天气预报接口
export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  conditions: string
  precipitation: number
  humidity?: number
  windSpeed?: number
}

// 天气预警接口
export interface WeatherAlert {
  id: number
  type: string
  severity: string
  description: string
  startTime: string
  endTime: string
  affectedAreas?: string[]
}

// 批量天气响应接口
export interface BatchWeatherResponse {
  location: {
    latitude: number
    longitude: number
  }
  weather: CurrentWeather
}

// 天气API
export const weatherApi = {
  /**
   * 获取当前天气
   * @param params 位置参数（经纬度）
   */
  getCurrentWeather: (params: { 
    latitude: number
    longitude: number
  }): Promise<ApiResponse<CurrentWeather>> => {
    return request.get('/weather/current', { params })
  },

  /**
   * 获取天气预报
   * @param params 位置参数和预报天数
   */
  getForecast: (params: {
    latitude: number
    longitude: number
    days?: number
  }): Promise<ApiResponse<WeatherForecast[]>> => {
    return request.get('/weather/forecast', { params })
  },

  /**
   * 获取天气预警
   * @param params 位置参数和搜索半径
   */
  getAlerts: (params: {
    latitude: number
    longitude: number
    radius?: number
  }): Promise<ApiResponse<WeatherAlert[]>> => {
    return request.get('/weather/alerts', { params })
  },

  /**
   * 批量获取天气数据
   * @param locations 位置数组
   */
  getBatchWeather: (locations: Array<{
    latitude: number
    longitude: number
  }>): Promise<ApiResponse<BatchWeatherResponse[]>> => {
    return request.post('/weather/batch', { locations })
  },

  /**
   * 测试天气API连接
   */
  testConnection: (): Promise<ApiResponse<{ 
    status: string
    message?: string
    apiKey?: boolean
  }>> => {
    return request.get('/weather/test')
  }
}

