import axios, { AxiosInstance } from 'axios';
import { RiskFactors } from './RiskAssessmentService';

/**
 * ML模型预测请求
 */
export interface MLPredictionRequest {
  zone_id: number;
  features: {
    rainfall: number;
    groundwater: number;
    slope: number;
    soil_moisture: number;
    seismic_activity: number;
    population_density: number;
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    elevation?: number;
  };
  disaster_type_id: number;
}

/**
 * ML模型预测响应
 */
export interface MLPredictionResponse {
  risk_score: number;
  risk_level: number;
  confidence: number;
  predicted_24h: number;
  predicted_72h: number;
  feature_importance?: Record<string, number>;
  model_version?: string;
}

/**
 * 异常检测请求
 */
export interface AnomalyDetectionRequest {
  station_id: string;
  recent_data: Array<{
    timestamp: string;
    value: number;
    data_type: string;
  }>;
}

/**
 * 异常检测响应
 */
export interface AnomalyDetectionResponse {
  is_anomaly: boolean;
  anomaly_score: number;
  anomalies: Array<{
    timestamp: string;
    data_type: string;
    value: number;
    score: number;
  }>;
}

/**
 * ML服务客户端
 * 用于与Python ML服务通信
 */
export class MLService {
  private client: AxiosInstance;
  private enabled: boolean;
  private baseURL: string;

  constructor() {
    // 从环境变量读取ML服务地址
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    // 默认启用ML服务（除非明确设置为false）
    this.enabled = process.env.ML_SERVICE_ENABLED !== 'false';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🤖 ML服务配置: URL=${this.baseURL}, 启用=${this.enabled}`);

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`ML服务请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('ML服务请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response: any) => {
        return response;
      },
      (error: any) => {
        if (error.code === 'ECONNREFUSED') {
          console.warn('ML服务未运行，将使用基于规则的算法');
          this.enabled = false;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 检查ML服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      console.log('ML服务已禁用（设置ML_SERVICE_ENABLED=true启用）');
      return false;
    }

    try {
      const response = await this.client.get('/health', { timeout: 5000 }); // 5秒超时
      const isAvailable = response.status === 200;  // 简化检查，只要返回200就认为可用
      
      if (isAvailable) {
        // ML服务恢复，重新启用
        this.enabled = true;
        console.log('✅ ML服务健康检查通过');
      } else {
        console.warn('⚠️ ML服务返回异常状态码:', response.status);
      }
      
      return isAvailable;
    } catch (error: any) {
      // 不永久禁用，下次还会尝试
      console.warn('❌ ML服务健康检查失败（将在下次评估时重试）:', error.code || error.message);
      return false;
    }
  }

  /**
   * 使用ML模型进行风险预测
   */
  async predictRisk(request: MLPredictionRequest): Promise<MLPredictionResponse | null> {
    if (!this.enabled) {
      console.log('ML服务未启用，将使用基于规则的算法');
      return null;
    }

    try {
      const response = await this.client.post<MLPredictionResponse>('/api/v1/predict/risk', request);
      return response.data;
    } catch (error) {
      console.error('ML风险预测失败:', error);
      this.enabled = false;
      return null;
    }
  }

  /**
   * 批量风险预测
   */
  async batchPredictRisk(requests: MLPredictionRequest[]): Promise<MLPredictionResponse[] | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.post<MLPredictionResponse[]>('/api/v1/predict/risk/batch', {
        predictions: requests
      });
      return response.data;
    } catch (error) {
      console.error('ML批量风险预测失败:', error);
      return null;
    }
  }

  /**
   * 异常检测
   */
  async detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResponse | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.post<AnomalyDetectionResponse>('/api/v1/detect/anomaly', request);
      return response.data;
    } catch (error) {
      console.error('ML异常检测失败:', error);
      return null;
    }
  }

  /**
   * 获取模型信息
   */
  async getModelInfo(): Promise<any> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get('/api/v1/models/info');
      return response.data;
    } catch (error) {
      console.error('获取ML模型信息失败:', error);
      return null;
    }
  }

  /**
   * 触发模型重新训练（管理员功能）
   */
  async trainModel(modelType: 'risk' | 'time_series' | 'anomaly'): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await this.client.post('/api/v1/train', { model_type: modelType });
      return response.status === 200;
    } catch (error) {
      console.error('ML模型训练失败:', error);
      return false;
    }
  }

  /**
   * 获取特征重要性
   */
  async getFeatureImportance(zoneId: number): Promise<Record<string, number> | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get(`/api/v1/features/importance/${zoneId}`);
      return response.data;
    } catch (error) {
      console.error('获取特征重要性失败:', error);
      return null;
    }
  }
}

// 导出单例
export const mlService = new MLService();

