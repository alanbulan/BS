"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAssessmentController = void 0;
const BaseController_1 = require("./BaseController");
const RiskAssessmentService_1 = require("../services/RiskAssessmentService");
const ExcelJS = __importStar(require("exceljs"));
const RiskAssessmentModel_1 = require("../models/RiskAssessmentModel");
class RiskAssessmentController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.assessZoneRisk = this.asyncHandler(async (req, res) => {
            const { zoneId } = req.params;
            if (!zoneId || isNaN(Number(zoneId))) {
                return this.error(res, '无效的区域ID');
            }
            try {
                const assessment = await this.riskAssessmentService.assessCurrentRisk(Number(zoneId));
                return this.success(res, assessment, '风险评估完成');
            }
            catch (error) {
                console.error('风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.batchAssessRisk = this.asyncHandler(async (req, res) => {
            const { zoneIds } = req.body;
            if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
                return this.error(res, '请提供有效的区域ID数组');
            }
            const invalidIds = zoneIds.filter(id => isNaN(Number(id)));
            if (invalidIds.length > 0) {
                return this.error(res, `无效的区域ID: ${invalidIds.join(', ')}`);
            }
            try {
                const assessments = await this.riskAssessmentService.batchAssessRisk(zoneIds.map(id => Number(id)));
                return this.success(res, assessments, `成功评估 ${assessments.length} 个区域的风险`);
            }
            catch (error) {
                console.error('批量风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.assessLocationRisk = this.asyncHandler(async (req, res) => {
            const { longitude, latitude, radius } = req.query;
            if (!longitude || !latitude) {
                return this.error(res, '请提供经纬度坐标');
            }
            const lng = parseFloat(longitude);
            const lat = parseFloat(latitude);
            const radiusKm = radius ? parseFloat(radius) : 5;
            if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                return this.error(res, '无效的经纬度坐标');
            }
            if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
                return this.error(res, '搜索半径必须在0-100公里之间');
            }
            const location = {
                type: 'Point',
                coordinates: [lng, lat]
            };
            try {
                const assessments = await this.riskAssessmentService.assessLocationRisk(location, radiusKm);
                return this.success(res, {
                    location,
                    radius: radiusKm,
                    assessments
                }, `找到 ${assessments.length} 个附近区域的风险评估`);
            }
            catch (error) {
                console.error('位置风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.getHistoricalAssessments = this.asyncHandler(async (req, res) => {
            const { zoneId } = req.params;
            const { days } = req.query;
            if (!zoneId || isNaN(Number(zoneId))) {
                return this.error(res, '无效的区域ID');
            }
            const daysBack = days ? parseInt(days) : 30;
            if (isNaN(daysBack) || daysBack <= 0 || daysBack > 365) {
                return this.error(res, '天数必须在1-365之间');
            }
            try {
                const assessments = await this.riskAssessmentService.getHistoricalAssessments(Number(zoneId), daysBack);
                return this.success(res, assessments, `获取到 ${assessments.length} 条历史评估记录`);
            }
            catch (error) {
                console.error('获取历史评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.getHighRiskZones = this.asyncHandler(async (req, res) => {
            const { minRiskLevel } = req.query;
            const minLevel = minRiskLevel ? parseInt(minRiskLevel) : 4;
            if (isNaN(minLevel) || minLevel < 1 || minLevel > 5) {
                return this.error(res, '风险等级必须在1-5之间');
            }
            try {
                const assessments = await this.riskAssessmentService.getHighRiskZones(minLevel);
                return this.success(res, assessments, `找到 ${assessments.length} 个高风险区域`);
            }
            catch (error) {
                console.error('获取高风险区域失败:', error);
                return this.serverError(res, error);
            }
        });
        this.getRiskAssessments = this.asyncHandler(async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const filters = req.query.filters ? JSON.parse(req.query.filters) : undefined;
                const result = await this.riskAssessmentService.getAllAssessments(page, limit, filters);
                return this.paginated(res, result.assessments, {
                    total: result.total,
                    page,
                    limit,
                    totalPages: Math.ceil(result.total / limit)
                });
            }
            catch (error) {
                console.error('获取风险评估列表失败:', error);
                return this.serverError(res, error);
            }
        });
        this.getRiskAssessment = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                return this.error(res, '无效的评估ID');
            }
            try {
                const assessment = await this.riskAssessmentService.getAssessmentById(Number(id));
                if (!assessment) {
                    return this.notFound(res, '风险评估记录不存在');
                }
                return this.success(res, assessment, '获取风险评估详情成功');
            }
            catch (error) {
                console.error('获取风险评估详情失败:', error);
                return this.serverError(res, error);
            }
        });
        this.createRiskAssessment = this.asyncHandler(async (req, res) => {
            try {
                const assessment = await this.riskAssessmentService.createAssessment(req.body);
                return this.created(res, assessment, '创建风险评估成功');
            }
            catch (error) {
                console.error('创建风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.updateRiskAssessment = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                return this.error(res, '无效的评估ID');
            }
            try {
                const assessment = await this.riskAssessmentService.updateAssessment(Number(id), req.body);
                if (!assessment) {
                    return this.notFound(res, '风险评估记录不存在');
                }
                return this.success(res, assessment, '更新风险评估成功');
            }
            catch (error) {
                console.error('更新风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.deleteRiskAssessment = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                return this.error(res, '无效的评估ID');
            }
            try {
                const success = await this.riskAssessmentService.deleteAssessment(Number(id));
                if (!success) {
                    return this.notFound(res, '风险评估记录不存在');
                }
                return this.success(res, null, '删除风险评估成功');
            }
            catch (error) {
                console.error('删除风险评估失败:', error);
                return this.serverError(res, error);
            }
        });
        this.getRiskAssessmentStats = this.asyncHandler(async (req, res) => {
            try {
                const stats = await this.riskAssessmentService.getAssessmentStats();
                return this.success(res, stats, '获取统计信息成功');
            }
            catch (error) {
                console.error('获取统计信息失败:', error);
                return this.serverError(res, error);
            }
        });
        this.exportRiskAssessments = this.asyncHandler(async (req, res) => {
            const { format = 'excel' } = req.query;
            try {
                const q = req.query || {};
                let rawIds = q.ids ?? q['ids[]'];
                let ids;
                if (rawIds) {
                    if (Array.isArray(rawIds)) {
                        ids = rawIds.map((v) => parseInt(String(v), 10)).filter((n) => Number.isInteger(n) && n > 0);
                    }
                    else if (typeof rawIds === 'string') {
                        ids = rawIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isInteger(n) && n > 0);
                    }
                }
                const filters = q.filters ? (() => { try {
                    return JSON.parse(q.filters);
                }
                catch {
                    return undefined;
                } })() : undefined;
                const conditions = [];
                const params = [];
                let idx = 1;
                if (ids && ids.length > 0) {
                    conditions.push(`ra.id = ANY($${idx++})`);
                    params.push(ids);
                }
                else if (filters) {
                    if (filters.zone_id) {
                        conditions.push(`ra.zone_id = $${idx++}`);
                        params.push(filters.zone_id);
                    }
                    if (filters.risk_level_min) {
                        conditions.push(`ra.current_risk_level >= $${idx++}`);
                        params.push(filters.risk_level_min);
                    }
                    if (filters.risk_level_max) {
                        conditions.push(`ra.current_risk_level <= $${idx++}`);
                        params.push(filters.risk_level_max);
                    }
                    if (filters.start_time) {
                        conditions.push(`ra.assessment_time >= $${idx++}`);
                        params.push(filters.start_time);
                    }
                    if (filters.end_time) {
                        conditions.push(`ra.assessment_time <= $${idx++}`);
                        params.push(filters.end_time);
                    }
                    if (filters.created_by) {
                        conditions.push(`ra.created_by = $${idx++}`);
                        params.push(filters.created_by);
                    }
                    if (filters.assessment_method) {
                        conditions.push(`ra.assessment_method = $${idx++}`);
                        params.push(filters.assessment_method);
                    }
                }
                const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
                const sql = `
        SELECT 
          ra.id,
          ra.zone_id,
          rz.name AS zone_name,
          dt.name AS disaster_type_name,
          ra.assessment_time,
          ra.current_risk_level,
          ra.predicted_risk_24h,
          ra.predicted_risk_72h,
          ra.confidence_score,
          ra.assessment_method,
          ra.model_version,
          ra.contributing_factors,
          ra.weather_conditions,
          ra.historical_comparison,
          ra.recommendations
        FROM risk_assessments ra
        LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
        LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
        ${whereClause}
        ORDER BY ra.assessment_time DESC
      `;
                const result = await this.riskAssessmentModel.rawQuery(sql, params);
                const rows = result.rows || [];
                if (format === 'csv') {
                    const header = [
                        'ID', '区域ID', '区域名称', '灾害类型', '评估时间', '当前风险等级', '预测24小时', '预测72小时', '置信度', '评估方法', '模型版本', '主要因素', '天气状况', '历史对比', '建议'
                    ].join(',');
                    const csvRows = rows.map((r) => [
                        r.id,
                        r.zone_id,
                        `"${(r.zone_name || '')}"`,
                        `"${(r.disaster_type_name || '')}"`,
                        r.assessment_time ? new Date(r.assessment_time).toLocaleString('zh-CN') : '',
                        r.current_risk_level ?? '',
                        r.predicted_risk_24h ?? '',
                        r.predicted_risk_72h ?? '',
                        r.confidence_score ?? '',
                        `"${(r.assessment_method || '')}"`,
                        `"${(r.model_version || '')}"`,
                        `"${r.contributing_factors ? JSON.stringify(r.contributing_factors) : ''}"`,
                        `"${r.weather_conditions ? JSON.stringify(r.weather_conditions) : ''}"`,
                        `"${r.historical_comparison ? JSON.stringify(r.historical_comparison) : ''}"`,
                        `"${(r.recommendations || '')}"`
                    ].join(','));
                    const csvContent = [header, ...csvRows].join('\n');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename=risk_assessments_${new Date().toISOString().split('T')[0]}.csv`);
                    return res.send('\ufeff' + csvContent);
                }
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('风险评估数据');
                worksheet.columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: '区域ID', key: 'zone_id', width: 10 },
                    { header: '区域名称', key: 'zone_name', width: 18 },
                    { header: '灾害类型', key: 'disaster_type_name', width: 14 },
                    { header: '评估时间', key: 'assessment_time', width: 20 },
                    { header: '当前风险等级', key: 'current_risk_level', width: 14 },
                    { header: '预测24小时', key: 'predicted_risk_24h', width: 12 },
                    { header: '预测72小时', key: 'predicted_risk_72h', width: 12 },
                    { header: '置信度', key: 'confidence_score', width: 10 },
                    { header: '评估方法', key: 'assessment_method', width: 16 },
                    { header: '模型版本', key: 'model_version', width: 14 },
                    { header: '主要因素', key: 'contributing_factors', width: 30 },
                    { header: '天气状况', key: 'weather_conditions', width: 24 },
                    { header: '历史对比', key: 'historical_comparison', width: 24 },
                    { header: '建议', key: 'recommendations', width: 30 }
                ];
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
                rows.forEach((r) => {
                    worksheet.addRow({
                        id: r.id,
                        zone_id: r.zone_id,
                        zone_name: r.zone_name,
                        disaster_type_name: r.disaster_type_name,
                        assessment_time: r.assessment_time ? new Date(r.assessment_time).toLocaleString('zh-CN') : '',
                        current_risk_level: r.current_risk_level,
                        predicted_risk_24h: r.predicted_risk_24h,
                        predicted_risk_72h: r.predicted_risk_72h,
                        confidence_score: r.confidence_score,
                        assessment_method: r.assessment_method,
                        model_version: r.model_version,
                        contributing_factors: r.contributing_factors ? JSON.stringify(r.contributing_factors) : '',
                        weather_conditions: r.weather_conditions ? JSON.stringify(r.weather_conditions) : '',
                        historical_comparison: r.historical_comparison ? JSON.stringify(r.historical_comparison) : '',
                        recommendations: r.recommendations || ''
                    });
                });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=risk_assessments_${new Date().toISOString().split('T')[0]}.xlsx`);
                await workbook.xlsx.write(res);
                return res.end();
            }
            catch (error) {
                console.error('导出风险评估数据失败:', error);
                return this.serverError(res, '导出数据失败');
            }
        });
        this.riskAssessmentService = new RiskAssessmentService_1.RiskAssessmentService();
        this.riskAssessmentModel = new RiskAssessmentModel_1.RiskAssessmentModel();
    }
}
exports.RiskAssessmentController = RiskAssessmentController;
//# sourceMappingURL=RiskAssessmentController.js.map