"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskZoneController = void 0;
const BaseController_1 = require("./BaseController");
const RiskZoneModel_1 = require("../models/RiskZoneModel");
class RiskZoneController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createRiskZone = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['name', 'code', 'disaster_type_id', 'base_risk_level']);
            if (validation) {
                return this.error(res, validation);
            }
            const { code, base_risk_level } = req.body;
            if (await this.riskZoneModel.codeExists(code)) {
                return this.error(res, '区域编码已存在');
            }
            if (base_risk_level < 1 || base_risk_level > 5) {
                return this.error(res, '风险等级必须在1-5之间');
            }
            try {
                const riskZone = await this.riskZoneModel.createRiskZone(req.body);
                return this.created(res, riskZone, '风险区域创建成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZones = this.asyncHandler(async (req, res) => {
            const { page, limit } = this.getPaginationParams(req);
            const { disaster_type_id, risk_level_min, risk_level_max } = req.query;
            try {
                let conditions = {};
                if (disaster_type_id) {
                    conditions.disaster_type_id = parseInt(disaster_type_id);
                }
                const result = await this.riskZoneModel.paginate(page, limit, conditions);
                let filteredData = result.data;
                if (risk_level_min || risk_level_max) {
                    const minLevel = parseInt(risk_level_min) || 1;
                    const maxLevel = parseInt(risk_level_max) || 5;
                    filteredData = result.data.filter(zone => zone.base_risk_level >= minLevel && zone.base_risk_level <= maxLevel);
                }
                return this.paginated(res, filteredData, result.pagination);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZoneById = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const zoneId = parseInt(id);
            if (isNaN(zoneId)) {
                return this.error(res, '无效的区域ID');
            }
            try {
                const riskZone = await this.riskZoneModel.findById(zoneId);
                if (!riskZone) {
                    return this.notFound(res, '风险区域不存在');
                }
                return this.success(res, riskZone);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZoneByCode = this.asyncHandler(async (req, res) => {
            const { code } = req.params;
            try {
                const riskZone = await this.riskZoneModel.findByCode(code);
                if (!riskZone) {
                    return this.notFound(res, '风险区域不存在');
                }
                return this.success(res, riskZone);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.updateRiskZone = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const zoneId = parseInt(id);
            if (isNaN(zoneId)) {
                return this.error(res, '无效的区域ID');
            }
            const { code, base_risk_level } = req.body;
            const existingZone = await this.riskZoneModel.findById(zoneId);
            if (!existingZone) {
                return this.notFound(res, '风险区域不存在');
            }
            if (code && await this.riskZoneModel.codeExists(code, zoneId)) {
                return this.error(res, '区域编码已被其他区域使用');
            }
            if (base_risk_level && (base_risk_level < 1 || base_risk_level > 5)) {
                return this.error(res, '风险等级必须在1-5之间');
            }
            try {
                const updatedZone = await this.riskZoneModel.updateRiskZone(zoneId, req.body);
                if (!updatedZone) {
                    return this.error(res, '更新失败');
                }
                return this.success(res, updatedZone, '风险区域更新成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZonesByLocation = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.query, ['longitude', 'latitude']);
            if (validation) {
                return this.error(res, validation);
            }
            const { longitude, latitude } = req.query;
            const location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
            if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
                return this.error(res, '坐标格式不正确');
            }
            try {
                const riskZones = await this.riskZoneModel.findByLocation(location);
                return this.success(res, riskZones);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getNearbyRiskZones = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.query, ['longitude', 'latitude']);
            if (validation) {
                return this.error(res, validation);
            }
            const { longitude, latitude, radius = 10 } = req.query;
            const radiusKm = Math.min(100, Math.max(1, parseInt(radius) || 10));
            const location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
            if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
                return this.error(res, '坐标格式不正确');
            }
            try {
                const riskZones = await this.riskZoneModel.findNearbyZones(location, radiusKm);
                return this.success(res, riskZones);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZonesByDisasterType = this.asyncHandler(async (req, res) => {
            const { disaster_type_id } = req.params;
            const disasterTypeId = parseInt(disaster_type_id);
            if (isNaN(disasterTypeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            try {
                const riskZones = await this.riskZoneModel.findByDisasterType(disasterTypeId);
                return this.success(res, riskZones);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZonesByRiskLevel = this.asyncHandler(async (req, res) => {
            const { min_level = 1, max_level = 5 } = req.query;
            const minLevel = parseInt(min_level);
            const maxLevel = parseInt(max_level);
            if (isNaN(minLevel) || isNaN(maxLevel) || minLevel < 1 || maxLevel > 5 || minLevel > maxLevel) {
                return this.error(res, '风险等级参数不正确');
            }
            try {
                const riskZones = await this.riskZoneModel.findByRiskLevel(minLevel, maxLevel);
                return this.success(res, riskZones);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZoneStats = this.asyncHandler(async (req, res) => {
            try {
                const stats = await this.riskZoneModel.getZoneStats();
                return this.success(res, stats);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getRiskZoneBounds = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const zoneId = parseInt(id);
            if (isNaN(zoneId)) {
                return this.error(res, '无效的区域ID');
            }
            try {
                const bounds = await this.riskZoneModel.getZoneBounds(zoneId);
                if (!bounds) {
                    return this.notFound(res, '风险区域不存在');
                }
                return this.success(res, bounds);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getOverlappingRiskZones = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['geometry']);
            if (validation) {
                return this.error(res, validation);
            }
            const { geometry } = req.body;
            if (!geometry.coordinates || !Array.isArray(geometry.coordinates[0])) {
                return this.error(res, '几何数据格式不正确');
            }
            try {
                const overlappingZones = await this.riskZoneModel.findOverlappingZones(geometry);
                return this.success(res, overlappingZones);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.deleteRiskZone = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const zoneId = parseInt(id);
            if (isNaN(zoneId)) {
                return this.error(res, '无效的区域ID');
            }
            try {
                const success = await this.riskZoneModel.delete(zoneId);
                if (!success) {
                    return this.notFound(res, '风险区域不存在');
                }
                return this.success(res, null, '风险区域删除成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.riskZoneModel = new RiskZoneModel_1.RiskZoneModel();
    }
}
exports.RiskZoneController = RiskZoneController;
//# sourceMappingURL=RiskZoneController.js.map