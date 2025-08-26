"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningController = void 0;
const BaseController_1 = require("./BaseController");
const WarningModel_1 = require("../models/WarningModel");
const WarningService_1 = require("../services/WarningService");
class WarningController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createWarning = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['title', 'content']);
            if (validation) {
                return this.error(res, validation);
            }
            const { warning_level } = req.body;
            if (warning_level && (warning_level < 1 || warning_level > 5)) {
                return this.error(res, '预警等级必须在1-5之间');
            }
            try {
                const warning = await this.warningService.createWarning(req.body, req.user?.id);
                return this.created(res, warning, '预警创建成功');
            }
            catch (error) {
                if (error.message.includes('已存在')) {
                    return this.error(res, error.message);
                }
                return this.serverError(res, error);
            }
        });
        this.getWarnings = this.asyncHandler(async (req, res) => {
            const { page, limit } = this.getPaginationParams(req);
            const zone_id = req.query.zone_id ? Number(req.query.zone_id) : undefined;
            const disaster_type_id = req.query.disaster_type_id ? Number(req.query.disaster_type_id) : undefined;
            const warning_level = req.query.warning_level ? Number(req.query.warning_level) : undefined;
            const status = req.query.status ? String(req.query.status) : undefined;
            const evacuation_required = typeof req.query.evacuation_required !== 'undefined'
                ? String(req.query.evacuation_required).toLowerCase() === 'true'
                : undefined;
            const title = req.query.title ? String(req.query.title) : undefined;
            try {
                if (status === 'active') {
                    const warnings = await WarningModel_1.WarningModel.findActiveWarnings();
                    const total = warnings.length;
                    return this.paginated(res, warnings, {
                        page: 1,
                        limit: total,
                        total,
                        totalPages: 1
                    });
                }
                else {
                    const data = await WarningModel_1.WarningModel.findAll(page, limit, 'issue_time', 'DESC', {
                        zone_id,
                        disaster_type_id,
                        warning_level,
                        status,
                        evacuation_required,
                        title,
                    });
                    const total = await WarningModel_1.WarningModel.countAll({
                        zone_id,
                        disaster_type_id,
                        warning_level,
                        status,
                        evacuation_required,
                        title,
                    });
                    return this.paginated(res, data, {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    });
                }
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningById = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const warningId = parseInt(id);
            if (isNaN(warningId)) {
                return this.error(res, '无效的预警ID');
            }
            try {
                const warning = await WarningModel_1.WarningModel.findById(warningId);
                if (!warning) {
                    return this.notFound(res, '预警信息不存在');
                }
                return this.success(res, warning);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.updateWarning = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const warningId = parseInt(id);
            if (isNaN(warningId)) {
                return this.error(res, '无效的预警ID');
            }
            const { warning_level } = req.body;
            if (warning_level && (warning_level < 1 || warning_level > 5)) {
                return this.error(res, '预警等级必须在1-5之间');
            }
            try {
                const updatedWarning = await this.warningService.updateWarning(warningId, req.body, req.user?.id);
                if (!updatedWarning) {
                    return this.notFound(res, '预警信息不存在');
                }
                return this.success(res, updatedWarning, '预警信息更新成功');
            }
            catch (error) {
                if (error.message.includes('不存在')) {
                    return this.notFound(res, error.message);
                }
                return this.serverError(res, error);
            }
        });
        this.cancelWarning = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const warningId = parseInt(id);
            if (isNaN(warningId)) {
                return this.error(res, '无效的预警ID');
            }
            const { reason } = req.body;
            try {
                const updated = await WarningModel_1.WarningModel.update(warningId, { status: 'cancelled' });
                if (!updated) {
                    return this.notFound(res, '预警信息不存在');
                }
                const cancelledWarning = await WarningModel_1.WarningModel.findById(warningId);
                return this.success(res, cancelledWarning, '预警已取消');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningsByLocation = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['longitude', 'latitude']);
            if (validation) {
                return this.error(res, validation);
            }
            const { longitude, latitude, radius = 50 } = req.query;
            const radiusKm = Math.min(200, Math.max(1, parseInt(radius) || 50));
            const location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
            if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
                return this.error(res, '坐标格式不正确');
            }
            try {
                const warnings = await WarningModel_1.WarningModel.findAll();
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getActiveWarnings = this.asyncHandler(async (req, res) => {
            try {
                const warnings = await WarningModel_1.WarningModel.findActiveWarnings();
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getEvacuationWarnings = this.asyncHandler(async (req, res) => {
            try {
                const warnings = await WarningModel_1.WarningModel.findActiveWarnings();
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningsByZone = this.asyncHandler(async (req, res) => {
            const { zone_id } = req.params;
            const zoneId = parseInt(zone_id);
            if (isNaN(zoneId)) {
                return this.error(res, '无效的区域ID');
            }
            try {
                const warnings = await WarningModel_1.WarningModel.findByZone(zoneId);
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningsByDisasterType = this.asyncHandler(async (req, res) => {
            const { disaster_type_id } = req.params;
            const disasterTypeId = parseInt(disaster_type_id);
            if (isNaN(disasterTypeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            try {
                const warnings = await WarningModel_1.WarningModel.findAll();
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningsByLevel = this.asyncHandler(async (req, res) => {
            const { min_level = 1, max_level = 5 } = req.query;
            const minLevel = parseInt(min_level);
            const maxLevel = parseInt(max_level);
            if (isNaN(minLevel) || isNaN(maxLevel) || minLevel < 1 || maxLevel > 5 || minLevel > maxLevel) {
                return this.error(res, '预警等级参数不正确');
            }
            try {
                const warnings = await WarningModel_1.WarningModel.findAll();
                return this.success(res, warnings);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.autoAssessAndWarn = this.asyncHandler(async (req, res) => {
            const { zone_id } = req.body;
            try {
                const warnings = await this.warningService.autoAssessAndWarn(zone_id);
                return this.success(res, warnings, `自动评估完成，生成 ${warnings.length} 条预警`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.processExpiredWarnings = this.asyncHandler(async (req, res) => {
            try {
                const expiredCount = await this.warningService.processExpiredWarnings();
                return this.success(res, { expired_count: expiredCount }, `处理了 ${expiredCount} 条过期预警`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getWarningStats = this.asyncHandler(async (req, res) => {
            try {
                const stats = await this.warningService.getWarningStatistics();
                return this.success(res, stats);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.updateWarningStatus = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { status } = req.body;
            if (!id) {
                this.error(res, '预警信息ID不能为空', 400);
                return;
            }
            if (!status || !['active', 'expired', 'cancelled', 'updated'].includes(status)) {
                this.error(res, '状态无效，必须是active、expired、cancelled或updated', 400);
                return;
            }
            const result = await WarningModel_1.WarningModel.update(parseInt(id), { status });
            if (!result) {
                this.notFound(res, '预警信息不存在');
                return;
            }
            this.success(res, result, '更新预警信息状态成功');
        });
        this.extendWarningExpiry = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { expiry_time } = req.body;
            if (!id) {
                this.error(res, '预警信息ID不能为空', 400);
                return;
            }
            if (!expiry_time) {
                this.error(res, '过期时间不能为空', 400);
                return;
            }
            const newExpiryTime = new Date(expiry_time);
            if (isNaN(newExpiryTime.getTime())) {
                this.error(res, '过期时间格式无效', 400);
                return;
            }
            if (newExpiryTime <= new Date()) {
                this.error(res, '过期时间必须在当前时间之后', 400);
                return;
            }
            const result = await WarningModel_1.WarningModel.update(parseInt(id), { expiry_time: newExpiryTime });
            if (!result) {
                this.notFound(res, '预警信息不存在');
                return;
            }
            this.success(res, result, '延长预警信息有效期成功');
        });
        this.createWarningUpdate = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { warning_level, title, content, affected_area, estimated_affected_population, expiry_time, recommended_actions, evacuation_required, shelter_recommendations } = req.body;
            if (!id) {
                this.error(res, '预警信息ID不能为空', 400);
                return;
            }
            const requiredFields = ['title', 'content'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    this.error(res, `${field}不能为空`, 400);
                    return;
                }
            }
            if (warning_level && (warning_level < 1 || warning_level > 5)) {
                this.error(res, '预警级别必须在1-5之间', 400);
                return;
            }
            const updateData = {
                warning_level,
                title,
                content,
                affected_area,
                estimated_affected_population,
                expiry_time: expiry_time ? new Date(expiry_time) : undefined,
                recommended_actions,
                evacuation_required,
                shelter_recommendations,
                issue_time: new Date(),
                status: 'active'
            };
            const result = await WarningModel_1.WarningModel.create(updateData);
            this.created(res, result, '创建预警信息更新成功');
        });
        this.getWarningHistory = this.asyncHandler(async (req, res) => {
            const { warning_id } = req.params;
            if (!warning_id) {
                this.error(res, '预警ID不能为空', 400);
                return;
            }
            const history = await WarningModel_1.WarningModel.findAll();
            this.success(res, history, '获取预警信息历史记录成功');
        });
        this.getWarningsInArea = this.asyncHandler(async (req, res) => {
            const { polygon } = req.body;
            if (!polygon || !polygon.coordinates) {
                this.error(res, '多边形数据无效', 400);
                return;
            }
            const warnings = await WarningModel_1.WarningModel.findAll();
            this.success(res, warnings, '获取区域预警信息成功');
        });
        this.getWarningLevelStats = this.asyncHandler(async (req, res) => {
            const stats = await WarningModel_1.WarningModel.getWarningStats();
            this.success(res, stats, '获取预警级别统计成功');
        });
        this.getDisasterTypeWarningStats = this.asyncHandler(async (req, res) => {
            const stats = await WarningModel_1.WarningModel.getWarningStats();
            this.success(res, stats, '获取灾害类型预警统计成功');
        });
        this.deleteWarning = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id) {
                this.error(res, '预警信息ID不能为空', 400);
                return;
            }
            const result = await WarningModel_1.WarningModel.delete(parseInt(id));
            if (!result) {
                this.notFound(res, '预警信息不存在');
                return;
            }
            this.success(res, null, '删除预警信息成功');
        });
        this.warningModel = new WarningModel_1.WarningModel();
        this.warningService = new WarningService_1.WarningService();
    }
}
exports.WarningController = WarningController;
//# sourceMappingURL=WarningController.js.map