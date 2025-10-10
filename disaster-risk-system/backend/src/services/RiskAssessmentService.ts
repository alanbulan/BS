import { Pool } from 'pg';
import { pool } from '../config/database';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { MonitoringDataModel } from '../models/MonitoringDataModel';
import { RiskAssessmentModel, CreateRiskAssessmentData } from '../models/RiskAssessmentModel';
import { RiskZone, MonitoringData, Point, RiskAssessment } from '../types';
import { configService } from './ConfigService';
import { WeatherService, WeatherData } from './WeatherService';
import { mlService, MLPredictionRequest } from './MLService';

export interface RiskFactors {
  rainfall: number;        // 降雨量 (mm/h)
  groundwater: number;     // 地下水位变化 (m)
  slope: number;          // 坡度 (度)
  soilMoisture: number;   // 土壤含水量 (%)
  seismicActivity: number; // 地震活动强度
  populationDensity: number; // 人口密度
}

export interface RiskWeights {
  rainfall: number;
  groundwater: number;
  slope: number;
  soilMoisture: number;
  seismicActivity: number;
  populationDensity: number;
}

export class RiskAssessmentService {
  private riskZoneModel: RiskZoneModel;
  private monitoringDataModel: MonitoringDataModel;
  private riskAssessmentModel: RiskAssessmentModel;
  private weatherService: WeatherService;
  private highRiskThreshold: number = 4; // 缓存的高风险阈值

  // 不同灾害类型的权重配置 (按disaster_type_id)
  private readonly disasterWeights: Record<string, RiskWeights> = {
    '1': { // 滑坡
      rainfall: 0.3,
      groundwater: 0.2,
      slope: 0.25,
      soilMoisture: 0.15,
      seismicActivity: 0.05,
      populationDensity: 0.05
    },
    '2': { // 泥石流
      rainfall: 0.35,
      groundwater: 0.15,
      slope: 0.2,
      soilMoisture: 0.2,
      seismicActivity: 0.05,
      populationDensity: 0.05
    },
    '3': { // 地震
      rainfall: 0.05,
      groundwater: 0.05,
      slope: 0.1,
      soilMoisture: 0.05,
      seismicActivity: 0.6,
      populationDensity: 0.15
    },
    '4': { // 洪水
      rainfall: 0.4,
      groundwater: 0.25,
      slope: 0.1,
      soilMoisture: 0.15,
      seismicActivity: 0.02,
      populationDensity: 0.08
    }
  };

  constructor() {
    this.riskZoneModel = new RiskZoneModel();
    this.monitoringDataModel = new MonitoringDataModel();
    this.riskAssessmentModel = new RiskAssessmentModel();
    this.weatherService = new WeatherService(pool);
    this.initializeConfigListeners();
  }

  /**
   * 初始化配置监听器
   */
  private initializeConfigListeners(): void {
    configService.on('configChanged', (key: string, value: any) => {
      if (key === 'risk.high_risk_threshold') {
        console.log(`高风险阈值配置已变更: ${this.highRiskThreshold} -> ${value}`);
        this.highRiskThreshold = value;
      }
    });
  }

  /**
   * 初始化配置缓存
   */
  private async initializeConfig(): Promise<void> {
    this.highRiskThreshold = await configService.getConfig('risk.high_risk_threshold');
  }

  /**
   * 评估指定区域的当前风险等级
   * 优先使用ML模型，如果ML服务不可用则降级到基于规则的算法
   */
  async assessCurrentRisk(zoneId: number): Promise<RiskAssessment> {
    try {
      // 获取风险区域信息
      const zone = await this.riskZoneModel.findById(zoneId);
      if (!zone) {
        throw new Error(`风险区域 ${zoneId} 不存在`);
      }

      // 获取风险区域中心点
      const centerPoint = await this.getZoneCenterPoint(zone.geometry);

      // 获取该风险区域内监测站的最近24小时数据
      const monitoringData = await this.getRecentMonitoringData(zoneId);
      
      // 获取当前天气数据
      let weatherData: WeatherData | null = null;
      try {
        weatherData = await this.weatherService.getCurrentWeather(
          centerPoint.latitude,
          centerPoint.longitude
        );
      } catch (error) {
        console.warn('获取天气数据失败，将不考虑天气因素:', error);
      }
      
      // 计算风险因子（包含天气数据）
      let riskFactors = await this.calculateRiskFactors(zone, monitoringData, weatherData);
      
      // 尝试使用ML模型进行预测
      const mlPrediction = await this.tryMLPrediction(zone, riskFactors, weatherData);
      
      let currentRiskLevel: number;
      let predicted24h: number;
      let predicted72h: number;
      let confidenceScore: number;
      let riskScore: number;
      let weights: RiskWeights;
      let assessmentMethod: string;
      let modelVersion: string;
      
      if (mlPrediction) {
        // 使用ML模型的预测结果
        console.log(`✅ 使用ML模型预测风险（区域${zoneId}），置信度:${mlPrediction.confidence.toFixed(2)}`);
        currentRiskLevel = mlPrediction.risk_level;
        predicted24h = mlPrediction.predicted_24h;
        predicted72h = mlPrediction.predicted_72h;
        confidenceScore = mlPrediction.confidence;
        riskScore = mlPrediction.risk_score;
        weights = this.getDisasterWeights(zone.disaster_type_id.toString());
        assessmentMethod = 'ML智能预测';
        modelVersion = mlPrediction.model_version || '1.0.0-ML';
        console.log(`📊 ML返回：risk_level=${currentRiskLevel}, confidence=${confidenceScore}, version=${modelVersion}`);
        
        // 如果ML返回了feature_importance，用它覆盖riskFactors（显示真实监测数据）
        if (mlPrediction.feature_importance) {
          console.log('🔄 ML返回的feature_importance:', JSON.stringify(mlPrediction.feature_importance));
          console.log('🔄 更新前的riskFactors:', JSON.stringify(riskFactors));
          
          riskFactors = {
            rainfall: mlPrediction.feature_importance.rainfall !== undefined ? mlPrediction.feature_importance.rainfall : riskFactors.rainfall,
            groundwater: mlPrediction.feature_importance.groundwater !== undefined ? mlPrediction.feature_importance.groundwater : riskFactors.groundwater,
            slope: mlPrediction.feature_importance.slope !== undefined ? mlPrediction.feature_importance.slope : riskFactors.slope,
            soilMoisture: mlPrediction.feature_importance.soil_moisture !== undefined ? mlPrediction.feature_importance.soil_moisture : riskFactors.soilMoisture,
            seismicActivity: mlPrediction.feature_importance.seismic_activity !== undefined ? mlPrediction.feature_importance.seismic_activity : riskFactors.seismicActivity,
            populationDensity: riskFactors.populationDensity  // 人口密度用原值
          };
          
          console.log('🔄 更新后的riskFactors:', JSON.stringify(riskFactors));
        } else {
          console.log('⚠️ ML未返回feature_importance');
        }
      } else {
        // 降级到基于规则的算法
        console.log(`使用基于规则的算法评估风险（区域${zoneId}）`);
        weights = this.getDisasterWeights(zone.disaster_type_id.toString());
        riskScore = this.calculateRiskScore(riskFactors, weights);
        
        // 如果有天气数据，应用天气风险权重
        if (weatherData) {
          const weatherRiskWeight = this.weatherService.calculateWeatherRiskWeight(weatherData);
          riskScore = riskScore * (1 + weatherRiskWeight * 0.3);
        }
        
        currentRiskLevel = await this.scoreToRiskLevel(riskScore);
        predicted24h = await this.predictFutureRisk(zone, riskFactors, 24);
        predicted72h = await this.predictFutureRisk(zone, riskFactors, 72);
        confidenceScore = this.calculateConfidence(monitoringData, zone);
        assessmentMethod = '规则算法';
        modelVersion = '1.0.0-Rule';
      }

      const assessment: RiskAssessment = {
        id: 0, // 将在保存时生成
        zone_id: zoneId,
        assessment_time: new Date(),
        current_risk_level: currentRiskLevel,
        predicted_risk_24h: predicted24h,
        predicted_risk_72h: predicted72h,
        contributing_factors: {
          factors: riskFactors,
          weights: weights,
          score: riskScore,
          weatherData: weatherData // 添加天气数据到评估结果
        },
        confidence_score: confidenceScore,
        assessment_method: assessmentMethod,
        model_version: modelVersion
      };

      // 保存评估结果
      await this.saveAssessment(assessment);

      return assessment;

    } catch (error) {
      console.error('风险评估失败:', error);
      throw error;
    }
  }

  /**
   * 批量评估多个区域的风险
   */
  async batchAssessRisk(zoneIds: number[]): Promise<RiskAssessment[]> {
    const assessments: RiskAssessment[] = [];
    
    for (const zoneId of zoneIds) {
      try {
        const assessment = await this.assessCurrentRisk(zoneId);
        assessments.push(assessment);
      } catch (error) {
        console.error(`区域 ${zoneId} 风险评估失败:`, error);
        // 继续处理其他区域
      }
    }

    return assessments;
  }

  /**
   * 获取指定位置附近的风险评估
   */
  async assessLocationRisk(location: Point, radiusKm: number = 5): Promise<RiskAssessment[]> {
    try {
      // 查找附近的风险区域
      const nearbyZones = await this.riskZoneModel.findNearbyZones(location, radiusKm);
      
      if (nearbyZones.length === 0) {
        return [];
      }

      // 批量评估这些区域的风险
      const zoneIds = nearbyZones.map(zone => zone.id);
      return await this.batchAssessRisk(zoneIds);

    } catch (error) {
      console.error('位置风险评估失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的监测数据
   */
  /**
   * 获取风险区域内监测站的最近监测数据（按zone_id关联）
   */
  private async getRecentMonitoringData(zoneId: number): Promise<MonitoringData[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24小时前

    // 使用zone_id直接关联查询（更明确的业务逻辑）
    const query = `
      SELECT md.*, ms.name as station_name, ms.station_type
      FROM monitoring_data md
      INNER JOIN monitoring_stations ms ON md.station_id = ms.station_id
      WHERE ms.zone_id = $1
        AND md.timestamp BETWEEN $2 AND $3
        AND md.quality_flag >= 1
      ORDER BY md.timestamp DESC
      LIMIT 500
    `;
    
    const queryStart = Date.now();
    const result = await pool.query(query, [zoneId, startTime.toISOString(), endTime.toISOString()]);
    const queryTime = Date.now() - queryStart;
    
    console.log(`[RISK-ASSESS] 风险区域${zoneId}监测数据: ${result.rows.length}条，查询耗时:${queryTime}ms`);
    
    return result.rows;
  }

  /**
   * 获取风险区域中心点
   */
  private async getZoneCenterPoint(geometry: any): Promise<{ latitude: number; longitude: number }> {
    try {
      const query = `
        SELECT 
          ST_Y(ST_Centroid($1::geometry)) as latitude,
          ST_X(ST_Centroid($1::geometry)) as longitude
      `;
      const result = await pool.query(query, [geometry]);
      
      if (result.rows.length > 0) {
        return {
          latitude: parseFloat(result.rows[0].latitude),
          longitude: parseFloat(result.rows[0].longitude)
        };
      }
      
      // 默认值（如果几何数据无效）
      return { latitude: 0, longitude: 0 };
    } catch (error) {
      console.error('获取区域中心点失败:', error);
      return { latitude: 0, longitude: 0 };
    }
  }

  /**
   * 计算风险因子
   */
  private async calculateRiskFactors(
    zone: RiskZone, 
    monitoringData: MonitoringData[],
    weatherData?: WeatherData | null
  ): Promise<RiskFactors> {
    // 按数据类型分组
    const dataByType = this.groupDataByType(monitoringData);

    // 如果有天气数据，使用天气数据增强降雨因子
    let rainfallFactor = this.calculateRainfallFactor(dataByType.rainfall || []);
    if (weatherData && weatherData.rainfall_24h > 0) {
      // 使用天气数据提供的24小时降雨量
      const weatherRainfallFactor = this.normalizeRainfallToFactor(weatherData.rainfall_24h);
      // 取两者的最大值
      rainfallFactor = Math.max(rainfallFactor, weatherRainfallFactor);
    }

    return {
      rainfall: rainfallFactor,
      groundwater: this.calculateGroundwaterFactor(dataByType.groundwater || []),
      slope: zone.slope_avg || 0,
      soilMoisture: this.calculateSoilMoistureFactor(dataByType.soil_moisture || []),
      seismicActivity: this.calculateSeismicFactor(dataByType.seismic || []),
      populationDensity: zone.population_density || 0
    };
  }

  /**
   * 将降雨量转换为风险因子 (0-5)
   */
  private normalizeRainfallToFactor(rainfall24h: number): number {
    if (rainfall24h >= 100) return 5;
    if (rainfall24h >= 50) return 4;
    if (rainfall24h >= 25) return 3;
    if (rainfall24h >= 10) return 2;
    if (rainfall24h > 0) return 1;
    return 0;
  }

  /**
   * 按数据类型分组监测数据
   */
  private groupDataByType(data: MonitoringData[]): Record<string, MonitoringData[]> {
    return data.reduce((groups, item) => {
      const type = item.data_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    }, {} as Record<string, MonitoringData[]>);
  }

  /**
   * 计算降雨因子
   */
  private calculateRainfallFactor(rainfallData: MonitoringData[]): number {
    if (rainfallData.length === 0) return 0;

    // 计算最近24小时累计降雨量
    const totalRainfall = rainfallData.reduce((sum, data) => sum + data.value, 0);
    
    // 降雨风险等级划分 (mm/24h)
    if (totalRainfall >= 100) return 5; // 极高风险
    if (totalRainfall >= 50) return 4;  // 高风险
    if (totalRainfall >= 25) return 3;  // 中等风险
    if (totalRainfall >= 10) return 2;  // 低风险
    return 1; // 极低风险
  }

  /**
   * 计算地下水位因子
   */
  private calculateGroundwaterFactor(groundwaterData: MonitoringData[]): number {
    if (groundwaterData.length === 0) return 0;

    // 计算地下水位变化率
    const sortedData = groundwaterData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (sortedData.length < 2) return 1;

    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;
    const changeRate = (lastValue - firstValue) / firstValue;

    // 地下水位上升风险评估
    if (changeRate >= 0.2) return 5;  // 水位上升20%以上
    if (changeRate >= 0.1) return 4;  // 水位上升10-20%
    if (changeRate >= 0.05) return 3; // 水位上升5-10%
    if (changeRate >= 0.02) return 2; // 水位上升2-5%
    return 1;
  }

  /**
   * 计算土壤含水量因子
   */
  private calculateSoilMoistureFactor(soilData: MonitoringData[]): number {
    if (soilData.length === 0) return 0;

    const avgMoisture = soilData.reduce((sum, data) => sum + data.value, 0) / soilData.length;

    // 土壤含水量风险评估 (%)
    if (avgMoisture >= 80) return 5; // 饱和状态
    if (avgMoisture >= 60) return 4; // 高含水量
    if (avgMoisture >= 40) return 3; // 中等含水量
    if (avgMoisture >= 20) return 2; // 低含水量
    return 1; // 干燥状态
  }

  /**
  /**
   * 计算地震活动因子
   */
  private calculateSeismicFactor(seismicData: MonitoringData[]): number {
    if (seismicData.length === 0) return 1;

    const maxMagnitude = Math.max(...seismicData.map(data => data.value));

    // 地震震级风险评估
    if (maxMagnitude >= 6.0) return 5; // 强震
    if (maxMagnitude >= 5.0) return 4; // 中强震
    if (maxMagnitude >= 4.0) return 3; // 有感地震
    if (maxMagnitude >= 3.0) return 2; // 微震
    return 1; // 无明显地震活动
  }

  /**
   * 获取灾害类型对应的权重
   */
  private getDisasterWeights(disasterType: string): RiskWeights {
    return this.disasterWeights[disasterType] || this.disasterWeights['1']; // 默认使用滑坡权重
  }

  /**
   * 计算综合风险评分
   */
  private calculateRiskScore(factors: RiskFactors, weights: RiskWeights): number {
    return (
      factors.rainfall * weights.rainfall +
      factors.groundwater * weights.groundwater +
      factors.slope * weights.slope +
      factors.soilMoisture * weights.soilMoisture +
      factors.seismicActivity * weights.seismicActivity +
      factors.populationDensity * weights.populationDensity
    );
  }

  /**
   * 将评分转换为风险等级（使用配置的阈值）
   */
  private async scoreToRiskLevel(score: number): Promise<number> {
    const highRiskThreshold = await configService.getConfig('risk.high_risk_threshold');
    
    // 基于配置的高风险阈值动态计算其他等级阈值
    const extremeHighThreshold = highRiskThreshold + 0.5; // 极高风险
    const mediumThreshold = highRiskThreshold - 1; // 中等风险
    const lowThreshold = highRiskThreshold - 2; // 低风险
    
    if (score >= extremeHighThreshold) return 5; // 极高风险
    if (score >= highRiskThreshold) return 4; // 高风险
    if (score >= mediumThreshold) return 3; // 中等风险
    if (score >= lowThreshold) return 2; // 低风险
    return 1; // 极低风险
  }

  /**
  /**
   * 预测未来风险等级
   */
  private async predictFutureRisk(zone: RiskZone, currentFactors: RiskFactors, hoursAhead: number): Promise<number> {
    // 这里可以集成机器学习模型进行预测
    // 目前使用简化的趋势分析
    
    try {
      // 获取历史数据进行趋势分析
      const historicalData = await this.getHistoricalTrends(zone.id, hoursAhead);
      
      // 基于当前因子和历史趋势预测
      const trendFactor = this.calculateTrendFactor(historicalData);
      const weights = this.getDisasterWeights(zone.disaster_type_id.toString());
      
      // 调整预测因子
      const predictedFactors = this.adjustFactorsForPrediction(currentFactors, trendFactor, hoursAhead);
      
      // 计算预测评分
      const predictedScore = this.calculateRiskScore(predictedFactors, weights);
      
      return await this.scoreToRiskLevel(predictedScore);

    } catch (error) {
      console.error('风险预测失败:', error);
      // 返回当前风险等级作为默认值
      const weights = this.getDisasterWeights(zone.disaster_type_id.toString());
      const currentScore = this.calculateRiskScore(currentFactors, weights);
      return await this.scoreToRiskLevel(currentScore);
    }
  }

  /**
   * 获取历史趋势数据
   */
  private async getHistoricalTrends(zoneId: number, hoursBack: number): Promise<any[]> {
    try {
      // 获取历史风险评估数据
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hoursBack * 60 * 60 * 1000);
      
      const historicalAssessments = await this.riskAssessmentModel.findByTimeRange(
        startTime, 
        endTime, 
        zoneId
      );
      
      // 转换为趋势数据格式
      return historicalAssessments.map(assessment => ({
        timestamp: assessment.assessment_time,
        risk_level: assessment.current_risk_level,
        confidence: assessment.confidence_score,
        factors: assessment.contributing_factors
      }));
    } catch (error) {
      console.error('获取历史趋势数据失败:', error);
      return [];
    }
  }

  /**
   * 计算趋势因子
   */
  private calculateTrendFactor(historicalData: any[]): number {
    if (historicalData.length < 2) {
      return 1.0; // 数据不足，无变化
    }
    
    // 按时间排序
    const sortedData = historicalData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // 计算风险等级的变化趋势
    const riskLevels = sortedData.map(d => d.risk_level);
    const recentLevels = riskLevels.slice(-3); // 最近3个数据点
    const earlierLevels = riskLevels.slice(0, 3); // 较早的3个数据点
    
    if (recentLevels.length === 0 || earlierLevels.length === 0) {
      return 1.0;
    }
    
    const recentAvg = recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length;
    const earlierAvg = earlierLevels.reduce((sum, level) => sum + level, 0) / earlierLevels.length;
    
    // 计算趋势因子 (1.0 = 无变化, >1.0 = 上升趋势, <1.0 = 下降趋势)
    const trendFactor = recentAvg / Math.max(earlierAvg, 0.1);
    
    // 限制趋势因子在合理范围内
    return Math.max(0.5, Math.min(2.0, trendFactor));
  }

  /**
   * 根据预测调整风险因子
   */
  private adjustFactorsForPrediction(factors: RiskFactors, trendFactor: number, hoursAhead: number): RiskFactors {
    // 根据时间和趋势调整各个因子
    const timeFactor = Math.min(hoursAhead / 72, 1); // 最多72小时
    
    return {
      rainfall: factors.rainfall * (1 + trendFactor * timeFactor * 0.1),
      groundwater: factors.groundwater * (1 + trendFactor * timeFactor * 0.05),
      slope: factors.slope, // 坡度不变
      soilMoisture: factors.soilMoisture * (1 + trendFactor * timeFactor * 0.08),
      seismicActivity: factors.seismicActivity, // 地震活动难以预测
      populationDensity: factors.populationDensity // 人口密度不变
    };
  }

  /**
   * 计算评估置信度
   */
  private calculateConfidence(monitoringData: MonitoringData[], zone: RiskZone): number {
    let confidence = 0.5; // 基础置信度

    // 数据完整性评分
    const dataTypes = ['rainfall', 'groundwater', 'soil_moisture', 'seismic'];
    const availableTypes = new Set(monitoringData.map(d => d.data_type));
    const dataCompleteness = availableTypes.size / dataTypes.length;
    confidence += dataCompleteness * 0.3;

    // 数据新鲜度评分
    const now = new Date();
    const recentData = monitoringData.filter(d => 
      (now.getTime() - new Date(d.timestamp).getTime()) < 6 * 60 * 60 * 1000 // 6小时内
    );
    const dataFreshness = recentData.length / Math.max(monitoringData.length, 1);
    confidence += dataFreshness * 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * 保存风险评估结果
   */
  private async saveAssessment(assessment: RiskAssessment): Promise<void> {
    try {
      const createData: CreateRiskAssessmentData = {
        zone_id: assessment.zone_id,
        assessment_time: assessment.assessment_time,
        current_risk_level: assessment.current_risk_level,
        predicted_risk_24h: assessment.predicted_risk_24h,
        predicted_risk_72h: assessment.predicted_risk_72h,
        contributing_factors: assessment.contributing_factors,
        confidence_score: assessment.confidence_score,
        assessment_method: assessment.assessment_method,
        model_version: assessment.model_version,
        weather_conditions: assessment.weather_conditions,
        historical_comparison: assessment.historical_comparison,
        recommendations: assessment.recommendations,
        created_by: assessment.created_by
      };
      
      await this.riskAssessmentModel.create(createData);
    } catch (error) {
      console.error('保存风险评估失败:', error);
      throw error;
    }
  }

  /**
   * 获取区域历史风险评估
   */
  async getHistoricalAssessments(zoneId: number, days: number = 30): Promise<RiskAssessment[]> {
    try {
      return await this.riskAssessmentModel.getHistoryByZoneId(zoneId, days);
    } catch (error) {
      console.error('获取历史风险评估失败:', error);
      throw error;
    }
  }

  /**
   * 获取高风险区域列表
   */
  async getHighRiskZones(minRiskLevel?: number): Promise<RiskAssessment[]> {
    try {
      // 如果没有指定最小风险等级，使用配置的高风险阈值
      const threshold = minRiskLevel ?? await configService.getConfig('risk.high_risk_threshold');
      return await this.riskAssessmentModel.getHighRiskAssessments(threshold);
    } catch (error) {
      console.error('获取高风险区域失败:', error);
      throw error;
    }
  }

  // CRUD操作方法
  async getAllAssessments(page: number = 1, limit: number = 10, filters?: any): Promise<{ assessments: RiskAssessment[], total: number }> {
    try {
      const result = await this.riskAssessmentModel.getAll(page, limit, filters);
      return {
        assessments: result.assessments,
        total: result.total
      };
    } catch (error) {
      console.error('获取风险评估列表失败:', error);
      throw new Error('获取风险评估列表失败');
    }
  }

  async getAssessmentById(id: number): Promise<RiskAssessment | null> {
    try {
      return await this.riskAssessmentModel.getById(id);
    } catch (error) {
      console.error('获取风险评估详情失败:', error);
      throw new Error('获取风险评估详情失败');
    }
  }

  async createAssessment(data: CreateRiskAssessmentData): Promise<RiskAssessment> {
    try {
      return await this.riskAssessmentModel.create(data);
    } catch (error) {
      console.error('创建风险评估失败:', error);
      throw new Error('创建风险评估失败');
    }
  }

  async updateAssessment(id: number, data: Partial<CreateRiskAssessmentData>): Promise<RiskAssessment | null> {
    try {
      return await this.riskAssessmentModel.update(id, data);
    } catch (error) {
      console.error('更新风险评估失败:', error);
      throw new Error('更新风险评估失败');
    }
  }

  async deleteAssessment(id: number): Promise<boolean> {
    try {
      return await this.riskAssessmentModel.delete(id);
    } catch (error) {
      console.error('删除风险评估失败:', error);
      throw new Error('删除风险评估失败');
    }
  }

  async getAssessmentStats(): Promise<any> {
    try {
      return await this.riskAssessmentModel.getStats();
    } catch (error) {
      console.error('获取风险评估统计失败:', error);
      throw new Error('获取风险评估统计失败');
    }
  }

  /**
   * 尝试使用ML模型进行风险预测
   * 如果ML服务不可用，返回null并降级到规则算法
   */
  private async tryMLPrediction(
    zone: RiskZone, 
    riskFactors: RiskFactors, 
    weatherData: WeatherData | null
  ): Promise<any | null> {
    const startTime = Date.now();  // 移到外层
    
    try {
      // 检查ML服务是否可用
      const isMLAvailable = await mlService.isAvailable();
      if (!isMLAvailable) {
        console.log('⚠️ ML服务不可用，将使用规则算法');
        return null;
      }
      
      console.log(`🤖 调用ML服务评估区域${zone.id}...`);

      // 构建ML预测请求
      const mlRequest: MLPredictionRequest = {
        zone_id: zone.id!,
        features: {
          rainfall: riskFactors.rainfall,
          groundwater: riskFactors.groundwater,
          slope: riskFactors.slope,
          soil_moisture: riskFactors.soilMoisture,
          seismic_activity: riskFactors.seismicActivity,
          population_density: riskFactors.populationDensity,
          temperature: weatherData?.temperature,
          humidity: weatherData?.humidity,
          wind_speed: weatherData?.wind_speed,
          elevation: zone.elevation_avg || 0
        },
        disaster_type_id: zone.disaster_type_id
      };

      // 调用ML服务
      const prediction = await mlService.predictRisk(mlRequest);
      
      const elapsed = Date.now() - startTime;
      if (prediction) {
        console.log(`✅ ML预测完成，耗时${elapsed}ms，风险等级:${prediction.risk_level}`);
      } else {
        console.log(`⚠️ ML预测返回空，耗时${elapsed}ms`);
      }
      
      return prediction;

    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.warn(`❌ ML预测失败（耗时${elapsed}ms），将使用基于规则的算法:`, error);
      return null;
    }
  }
}