"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAssessmentController = void 0;
const BaseController_1 = require("./BaseController");
const RiskAssessmentService_1 = require("../services/RiskAssessmentService");
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
        this.riskAssessmentService = new RiskAssessmentService_1.RiskAssessmentService();
    }
}
exports.RiskAssessmentController = RiskAssessmentController;
//# sourceMappingURL=RiskAssessmentController.js.map