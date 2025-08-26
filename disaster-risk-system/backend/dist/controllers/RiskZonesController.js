"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskZonesController = void 0;
const BaseController_1 = require("./BaseController");
const RiskZoneModel_1 = require("../models/RiskZoneModel");
class RiskZonesController extends BaseController_1.BaseController {
    constructor() {
        super(...arguments);
        this.getRiskZones = this.asyncHandler(async (req, res) => {
            const { page, limit } = this.getPaginationParams(req);
            const { sortBy, sortOrder } = this.getSortParams(req);
            const { name, disaster_type_id, risk_level_min, risk_level_max, is_monitored } = req.query;
            try {
                const filters = {
                    name: name,
                    disaster_type_id: disaster_type_id ? parseInt(disaster_type_id) : undefined,
                    risk_level_min: risk_level_min ? parseInt(risk_level_min) : undefined,
                    risk_level_max: risk_level_max ? parseInt(risk_level_max) : undefined,
                    is_monitored: is_monitored !== undefined ? is_monitored === 'true' : undefined
                };
                const result = await RiskZoneModel_1.RiskZoneModel.paginate(page, limit, filters, sortBy, sortOrder);
                return this.paginated(res, result.data, result.pagination);
            }
            catch (error) {
                console.error('获取风险区域列表失败:', error);
                return this.error(res, '获取风险区域列表失败');
            }
        });
        this.getRiskZoneById = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            try {
                const riskZone = await RiskZoneModel_1.RiskZoneModel.findById(parseInt(id));
                if (!riskZone) {
                    return this.error(res, '风险区域不存在', 404);
                }
                return this.success(res, riskZone);
            }
            catch (error) {
                console.error('获取风险区域详情失败:', error);
                return this.error(res, '获取风险区域详情失败');
            }
        });
        this.createRiskZone = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['name', 'code', 'disaster_type_id', 'base_risk_level']);
            if (validation) {
                return this.error(res, validation);
            }
            try {
                const riskZoneData = req.body;
                const existingZone = await RiskZoneModel_1.RiskZoneModel.findByCode(riskZoneData.code);
                if (existingZone) {
                    return this.error(res, '区域编码已存在');
                }
                const newRiskZone = await RiskZoneModel_1.RiskZoneModel.createZone(riskZoneData);
                return this.created(res, newRiskZone);
            }
            catch (error) {
                console.error('创建风险区域失败:', error);
                return this.error(res, '创建风险区域失败');
            }
        });
        this.updateRiskZone = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            try {
                const existingZone = await RiskZoneModel_1.RiskZoneModel.findById(parseInt(id));
                if (!existingZone) {
                    return this.error(res, '风险区域不存在', 404);
                }
                if (req.body.code && req.body.code !== existingZone.code) {
                    const codeExists = await RiskZoneModel_1.RiskZoneModel.findByCode(req.body.code);
                    if (codeExists) {
                        return this.error(res, '区域编码已存在');
                    }
                }
                const updateData = req.body;
                const updatedZone = await RiskZoneModel_1.RiskZoneModel.update(parseInt(id), updateData);
                return this.success(res, updatedZone);
            }
            catch (error) {
                console.error('更新风险区域失败:', error);
                return this.error(res, '更新风险区域失败');
            }
        });
        this.deleteRiskZone = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            try {
                const existingZone = await RiskZoneModel_1.RiskZoneModel.findById(parseInt(id));
                if (!existingZone) {
                    return this.error(res, '风险区域不存在', 404);
                }
                await RiskZoneModel_1.RiskZoneModel.delete(parseInt(id));
                return this.success(res, { message: '风险区域删除成功' });
            }
            catch (error) {
                console.error('删除风险区域失败:', error);
                return this.error(res, '删除风险区域失败');
            }
        });
        this.getRiskZoneStats = this.asyncHandler(async (req, res) => {
            try {
                const stats = await RiskZoneModel_1.RiskZoneModel.getStatistics();
                return this.success(res, stats);
            }
            catch (error) {
                console.error('获取风险区域统计失败:', error);
                return this.error(res, '获取统计信息失败');
            }
        });
        this.findRiskZoneByLocation = this.asyncHandler(async (req, res) => {
            const { lat, lng } = req.query;
            if (!lat || !lng) {
                return this.error(res, '缺少坐标参数');
            }
            try {
                const location = {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                };
                const riskZones = await RiskZoneModel_1.RiskZoneModel.findByLocation(location);
                return this.success(res, riskZones);
            }
            catch (error) {
                console.error('根据坐标查找风险区域失败:', error);
                return this.error(res, '查找风险区域失败');
            }
        });
    }
}
exports.RiskZonesController = RiskZonesController;
//# sourceMappingURL=RiskZonesController.js.map