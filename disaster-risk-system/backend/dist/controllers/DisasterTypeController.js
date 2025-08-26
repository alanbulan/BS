"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisasterTypeController = void 0;
const BaseController_1 = require("./BaseController");
const DisasterTypeModel_1 = require("../models/DisasterTypeModel");
class DisasterTypeController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createDisasterType = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['name', 'base_risk_level']);
            if (validation) {
                return this.error(res, validation);
            }
            const { name, base_risk_level } = req.body;
            if (base_risk_level < 1 || base_risk_level > 5) {
                return this.error(res, '基础风险等级必须在1-5之间');
            }
            if (await this.disasterTypeModel.nameExists(name)) {
                return this.error(res, '灾害类型名称已存在');
            }
            try {
                const disasterType = await this.disasterTypeModel.createDisasterType(req.body);
                return this.created(res, disasterType, '灾害类型创建成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getDisasterTypes = this.asyncHandler(async (req, res) => {
            const { page, limit } = this.getPaginationParams(req);
            const { active_only = 'false' } = req.query;
            try {
                if (active_only === 'true') {
                    const types = await this.disasterTypeModel.getActiveTypes();
                    return this.success(res, types);
                }
                else {
                    const result = await this.disasterTypeModel.paginate(page, limit);
                    return this.paginated(res, result.data, result.pagination);
                }
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getDisasterTypeById = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const typeId = parseInt(id);
            if (isNaN(typeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            try {
                const disasterType = await this.disasterTypeModel.findById(typeId);
                if (!disasterType) {
                    return this.notFound(res, '灾害类型不存在');
                }
                return this.success(res, disasterType);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.updateDisasterType = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const typeId = parseInt(id);
            if (isNaN(typeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            const { name, base_risk_level } = req.body;
            const existingType = await this.disasterTypeModel.findById(typeId);
            if (!existingType) {
                return this.notFound(res, '灾害类型不存在');
            }
            if (base_risk_level && (base_risk_level < 1 || base_risk_level > 5)) {
                return this.error(res, '基础风险等级必须在1-5之间');
            }
            if (name && await this.disasterTypeModel.nameExists(name, typeId)) {
                return this.error(res, '灾害类型名称已被其他类型使用');
            }
            try {
                const updatedType = await this.disasterTypeModel.updateDisasterType(typeId, req.body);
                if (!updatedType) {
                    return this.error(res, '更新失败');
                }
                return this.success(res, updatedType, '灾害类型更新成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getDisasterTypesByRiskLevel = this.asyncHandler(async (req, res) => {
            const { risk_level } = req.params;
            const riskLevel = parseInt(risk_level);
            if (isNaN(riskLevel) || riskLevel < 1 || riskLevel > 5) {
                return this.error(res, '风险等级必须在1-5之间');
            }
            try {
                const types = await this.disasterTypeModel.getByRiskLevel(riskLevel);
                return this.success(res, types);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.toggleDisasterTypeStatus = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const typeId = parseInt(id);
            if (isNaN(typeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            const validation = this.validateRequired(req.body, ['is_active']);
            if (validation) {
                return this.error(res, validation);
            }
            const { is_active } = req.body;
            try {
                const updatedType = await this.disasterTypeModel.toggleActive(typeId, is_active);
                if (!updatedType) {
                    return this.notFound(res, '灾害类型不存在');
                }
                return this.success(res, updatedType, `灾害类型${is_active ? '激活' : '停用'}成功`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getDisasterTypeStats = this.asyncHandler(async (req, res) => {
            try {
                const stats = await this.disasterTypeModel.getTypeStats();
                return this.success(res, stats);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.deleteDisasterType = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const typeId = parseInt(id);
            if (isNaN(typeId)) {
                return this.error(res, '无效的灾害类型ID');
            }
            try {
                const { hasReferences, referencedTables } = await this.disasterTypeModel.checkReferences(typeId);
                if (hasReferences) {
                    const tableNames = {
                        'risk_zones': '风险区域',
                        'user_reports': '用户报告'
                    };
                    const referencedNames = referencedTables.map(table => tableNames[table] || table).join('、');
                    return this.error(res, `无法删除：该灾害类型正在被${referencedNames}引用`, 400);
                }
                const success = await this.disasterTypeModel.delete(typeId);
                if (!success) {
                    return this.notFound(res, '灾害类型不存在');
                }
                return this.success(res, null, '灾害类型删除成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.disasterTypeModel = new DisasterTypeModel_1.DisasterTypeModel();
    }
}
exports.DisasterTypeController = DisasterTypeController;
//# sourceMappingURL=DisasterTypeController.js.map