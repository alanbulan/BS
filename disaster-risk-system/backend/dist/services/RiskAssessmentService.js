"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAssessmentService = void 0;
const RiskZoneModel_1 = require("../models/RiskZoneModel");
const MonitoringDataModel_1 = require("../models/MonitoringDataModel");
const RiskAssessmentModel_1 = require("../models/RiskAssessmentModel");
const ConfigService_1 = require("./ConfigService");
class RiskAssessmentService {
    constructor() {
        this.highRiskThreshold = 4;
        this.disasterWeights = {
            '1': {
                rainfall: 0.3,
                groundwater: 0.2,
                slope: 0.25,
                soilMoisture: 0.15,
                seismicActivity: 0.05,
                populationDensity: 0.05
            },
            '2': {
                rainfall: 0.35,
                groundwater: 0.15,
                slope: 0.2,
                soilMoisture: 0.2,
                seismicActivity: 0.05,
                populationDensity: 0.05
            },
            '3': {
                rainfall: 0.05,
                groundwater: 0.05,
                slope: 0.1,
                soilMoisture: 0.05,
                seismicActivity: 0.6,
                populationDensity: 0.15
            },
            '4': {
                rainfall: 0.4,
                groundwater: 0.25,
                slope: 0.1,
                soilMoisture: 0.15,
                seismicActivity: 0.02,
                populationDensity: 0.08
            }
        };
        this.riskZoneModel = new RiskZoneModel_1.RiskZoneModel();
        this.monitoringDataModel = new MonitoringDataModel_1.MonitoringDataModel();
        this.riskAssessmentModel = new RiskAssessmentModel_1.RiskAssessmentModel();
        this.initializeConfigListeners();
    }
    initializeConfigListeners() {
        ConfigService_1.configService.on('configChanged', (key, value) => {
            if (key === 'risk.high_risk_threshold') {
                console.log(`高风险阈值配置已变更: ${this.highRiskThreshold} -> ${value}`);
                this.highRiskThreshold = value;
            }
        });
    }
    async initializeConfig() {
        this.highRiskThreshold = await ConfigService_1.configService.getConfig('risk.high_risk_threshold');
    }
    async assessCurrentRisk(zoneId) {
        try {
            const zone = await this.riskZoneModel.findById(zoneId);
            if (!zone) {
                throw new Error(`风险区域 ${zoneId} 不存在`);
            }
            const monitoringData = await this.getRecentMonitoringData(zone.geometry);
            const riskFactors = await this.calculateRiskFactors(zone, monitoringData);
            const weights = this.getDisasterWeights(zone.disaster_type_id.toString());
            const riskScore = this.calculateRiskScore(riskFactors, weights);
            const currentRiskLevel = await this.scoreToRiskLevel(riskScore);
            const predicted24h = await this.predictFutureRisk(zone, riskFactors, 24);
            const predicted72h = await this.predictFutureRisk(zone, riskFactors, 72);
            const confidenceScore = this.calculateConfidence(monitoringData, zone);
            const assessment = {
                id: 0,
                zone_id: zoneId,
                assessment_time: new Date(),
                current_risk_level: currentRiskLevel,
                predicted_risk_24h: predicted24h,
                predicted_risk_72h: predicted72h,
                contributing_factors: {
                    factors: riskFactors,
                    weights: weights,
                    score: riskScore
                },
                confidence_score: confidenceScore
            };
            await this.saveAssessment(assessment);
            return assessment;
        }
        catch (error) {
            console.error('风险评估失败:', error);
            throw error;
        }
    }
    async batchAssessRisk(zoneIds) {
        const assessments = [];
        for (const zoneId of zoneIds) {
            try {
                const assessment = await this.assessCurrentRisk(zoneId);
                assessments.push(assessment);
            }
            catch (error) {
                console.error(`区域 ${zoneId} 风险评估失败:`, error);
            }
        }
        return assessments;
    }
    async assessLocationRisk(location, radiusKm = 5) {
        try {
            const nearbyZones = await this.riskZoneModel.findNearbyZones(location, radiusKm);
            if (nearbyZones.length === 0) {
                return [];
            }
            const zoneIds = nearbyZones.map(zone => zone.id);
            return await this.batchAssessRisk(zoneIds);
        }
        catch (error) {
            console.error('位置风险评估失败:', error);
            throw error;
        }
    }
    async getRecentMonitoringData(zoneGeometry) {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        return await this.monitoringDataModel.findByTimeRange({
            startTime,
            endTime,
            geometry: zoneGeometry
        });
    }
    async calculateRiskFactors(zone, monitoringData) {
        const dataByType = this.groupDataByType(monitoringData);
        return {
            rainfall: this.calculateRainfallFactor(dataByType.rainfall || []),
            groundwater: this.calculateGroundwaterFactor(dataByType.groundwater || []),
            slope: zone.slope_avg || 0,
            soilMoisture: this.calculateSoilMoistureFactor(dataByType.soil_moisture || []),
            seismicActivity: this.calculateSeismicFactor(dataByType.seismic || []),
            populationDensity: zone.population_density || 0
        };
    }
    groupDataByType(data) {
        return data.reduce((groups, item) => {
            const type = item.data_type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
            return groups;
        }, {});
    }
    calculateRainfallFactor(rainfallData) {
        if (rainfallData.length === 0)
            return 0;
        const totalRainfall = rainfallData.reduce((sum, data) => sum + data.value, 0);
        if (totalRainfall >= 100)
            return 5;
        if (totalRainfall >= 50)
            return 4;
        if (totalRainfall >= 25)
            return 3;
        if (totalRainfall >= 10)
            return 2;
        return 1;
    }
    calculateGroundwaterFactor(groundwaterData) {
        if (groundwaterData.length === 0)
            return 0;
        const sortedData = groundwaterData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        if (sortedData.length < 2)
            return 1;
        const firstValue = sortedData[0].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        const changeRate = (lastValue - firstValue) / firstValue;
        if (changeRate >= 0.2)
            return 5;
        if (changeRate >= 0.1)
            return 4;
        if (changeRate >= 0.05)
            return 3;
        if (changeRate >= 0.02)
            return 2;
        return 1;
    }
    calculateSoilMoistureFactor(soilData) {
        if (soilData.length === 0)
            return 0;
        const avgMoisture = soilData.reduce((sum, data) => sum + data.value, 0) / soilData.length;
        if (avgMoisture >= 80)
            return 5;
        if (avgMoisture >= 60)
            return 4;
        if (avgMoisture >= 40)
            return 3;
        if (avgMoisture >= 20)
            return 2;
        return 1;
    }
    calculateSeismicFactor(seismicData) {
        if (seismicData.length === 0)
            return 1;
        const maxMagnitude = Math.max(...seismicData.map(data => data.value));
        if (maxMagnitude >= 6.0)
            return 5;
        if (maxMagnitude >= 5.0)
            return 4;
        if (maxMagnitude >= 4.0)
            return 3;
        if (maxMagnitude >= 3.0)
            return 2;
        return 1;
    }
    getDisasterWeights(disasterType) {
        return this.disasterWeights[disasterType] || this.disasterWeights['1'];
    }
    calculateRiskScore(factors, weights) {
        return (factors.rainfall * weights.rainfall +
            factors.groundwater * weights.groundwater +
            factors.slope * weights.slope +
            factors.soilMoisture * weights.soilMoisture +
            factors.seismicActivity * weights.seismicActivity +
            factors.populationDensity * weights.populationDensity);
    }
    async scoreToRiskLevel(score) {
        const highRiskThreshold = await ConfigService_1.configService.getConfig('risk.high_risk_threshold');
        const extremeHighThreshold = highRiskThreshold + 0.5;
        const mediumThreshold = highRiskThreshold - 1;
        const lowThreshold = highRiskThreshold - 2;
        if (score >= extremeHighThreshold)
            return 5;
        if (score >= highRiskThreshold)
            return 4;
        if (score >= mediumThreshold)
            return 3;
        if (score >= lowThreshold)
            return 2;
        return 1;
    }
    async predictFutureRisk(zone, currentFactors, hoursAhead) {
        try {
            const historicalData = await this.getHistoricalTrends(zone.id, hoursAhead);
            const trendFactor = this.calculateTrendFactor(historicalData);
            const weights = this.getDisasterWeights(zone.disaster_type_id.toString());
            const predictedFactors = this.adjustFactorsForPrediction(currentFactors, trendFactor, hoursAhead);
            const predictedScore = this.calculateRiskScore(predictedFactors, weights);
            return await this.scoreToRiskLevel(predictedScore);
        }
        catch (error) {
            console.error('风险预测失败:', error);
            const weights = this.getDisasterWeights(zone.disaster_type_id.toString());
            const currentScore = this.calculateRiskScore(currentFactors, weights);
            return await this.scoreToRiskLevel(currentScore);
        }
    }
    async getHistoricalTrends(zoneId, hoursBack) {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - hoursBack * 60 * 60 * 1000);
            const historicalAssessments = await this.riskAssessmentModel.findByTimeRange(startTime, endTime, zoneId);
            return historicalAssessments.map(assessment => ({
                timestamp: assessment.assessment_time,
                risk_level: assessment.current_risk_level,
                confidence: assessment.confidence_score,
                factors: assessment.contributing_factors
            }));
        }
        catch (error) {
            console.error('获取历史趋势数据失败:', error);
            return [];
        }
    }
    calculateTrendFactor(historicalData) {
        if (historicalData.length < 2) {
            return 1.0;
        }
        const sortedData = historicalData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const riskLevels = sortedData.map(d => d.risk_level);
        const recentLevels = riskLevels.slice(-3);
        const earlierLevels = riskLevels.slice(0, 3);
        if (recentLevels.length === 0 || earlierLevels.length === 0) {
            return 1.0;
        }
        const recentAvg = recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length;
        const earlierAvg = earlierLevels.reduce((sum, level) => sum + level, 0) / earlierLevels.length;
        const trendFactor = recentAvg / Math.max(earlierAvg, 0.1);
        return Math.max(0.5, Math.min(2.0, trendFactor));
    }
    adjustFactorsForPrediction(factors, trendFactor, hoursAhead) {
        const timeFactor = Math.min(hoursAhead / 72, 1);
        return {
            rainfall: factors.rainfall * (1 + trendFactor * timeFactor * 0.1),
            groundwater: factors.groundwater * (1 + trendFactor * timeFactor * 0.05),
            slope: factors.slope,
            soilMoisture: factors.soilMoisture * (1 + trendFactor * timeFactor * 0.08),
            seismicActivity: factors.seismicActivity,
            populationDensity: factors.populationDensity
        };
    }
    calculateConfidence(monitoringData, zone) {
        let confidence = 0.5;
        const dataTypes = ['rainfall', 'groundwater', 'soil_moisture', 'seismic'];
        const availableTypes = new Set(monitoringData.map(d => d.data_type));
        const dataCompleteness = availableTypes.size / dataTypes.length;
        confidence += dataCompleteness * 0.3;
        const now = new Date();
        const recentData = monitoringData.filter(d => (now.getTime() - new Date(d.timestamp).getTime()) < 6 * 60 * 60 * 1000);
        const dataFreshness = recentData.length / Math.max(monitoringData.length, 1);
        confidence += dataFreshness * 0.2;
        return Math.min(confidence, 1.0);
    }
    async saveAssessment(assessment) {
        try {
            const createData = {
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
        }
        catch (error) {
            console.error('保存风险评估失败:', error);
            throw error;
        }
    }
    async getHistoricalAssessments(zoneId, days = 30) {
        try {
            return await this.riskAssessmentModel.getHistoryByZoneId(zoneId, days);
        }
        catch (error) {
            console.error('获取历史风险评估失败:', error);
            throw error;
        }
    }
    async getHighRiskZones(minRiskLevel) {
        try {
            const threshold = minRiskLevel ?? await ConfigService_1.configService.getConfig('risk.high_risk_threshold');
            return await this.riskAssessmentModel.getHighRiskAssessments(threshold);
        }
        catch (error) {
            console.error('获取高风险区域失败:', error);
            throw error;
        }
    }
    async getAllAssessments(page = 1, limit = 10, filters) {
        try {
            const result = await this.riskAssessmentModel.getAll(page, limit, filters);
            return {
                assessments: result.assessments,
                total: result.total
            };
        }
        catch (error) {
            console.error('获取风险评估列表失败:', error);
            throw new Error('获取风险评估列表失败');
        }
    }
    async getAssessmentById(id) {
        try {
            return await this.riskAssessmentModel.getById(id);
        }
        catch (error) {
            console.error('获取风险评估详情失败:', error);
            throw new Error('获取风险评估详情失败');
        }
    }
    async createAssessment(data) {
        try {
            return await this.riskAssessmentModel.create(data);
        }
        catch (error) {
            console.error('创建风险评估失败:', error);
            throw new Error('创建风险评估失败');
        }
    }
    async updateAssessment(id, data) {
        try {
            return await this.riskAssessmentModel.update(id, data);
        }
        catch (error) {
            console.error('更新风险评估失败:', error);
            throw new Error('更新风险评估失败');
        }
    }
    async deleteAssessment(id) {
        try {
            return await this.riskAssessmentModel.delete(id);
        }
        catch (error) {
            console.error('删除风险评估失败:', error);
            throw new Error('删除风险评估失败');
        }
    }
    async getAssessmentStats() {
        try {
            return await this.riskAssessmentModel.getStats();
        }
        catch (error) {
            console.error('获取风险评估统计失败:', error);
            throw new Error('获取风险评估统计失败');
        }
    }
}
exports.RiskAssessmentService = RiskAssessmentService;
//# sourceMappingURL=RiskAssessmentService.js.map