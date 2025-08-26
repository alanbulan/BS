import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { DisasterTypeModel } from '../models/DisasterTypeModel';
import { DisasterType } from '../types';

export class DisasterTypeController extends BaseController {
  private disasterTypeModel: DisasterTypeModel;

  constructor() {
    super();
    this.disasterTypeModel = new DisasterTypeModel();
  }

  /**
   * 创建灾害类型
   */
  createDisasterType = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['name', 'base_risk_level']);
    if (validation) {
      return this.error(res, validation);
    }

    const { name, base_risk_level } = req.body;

    // 验证风险等级
    if (base_risk_level < 1 || base_risk_level > 5) {
      return this.error(res, '基础风险等级必须在1-5之间');
    }

    // 检查名称是否已存在
    if (await this.disasterTypeModel.nameExists(name)) {
      return this.error(res, '灾害类型名称已存在');
    }

    try {
      const disasterType = await this.disasterTypeModel.createDisasterType(req.body);
      return this.created(res, disasterType, '灾害类型创建成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取灾害类型列表
   */
  getDisasterTypes = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const { active_only = 'false' } = req.query;

    try {
      if (active_only === 'true') {
        const types = await this.disasterTypeModel.getActiveTypes();
        return this.success(res, types);
      } else {
        const result = await this.disasterTypeModel.paginate(page, limit);
        return this.paginated(res, result.data, result.pagination);
      }
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据ID获取灾害类型
   */
  getDisasterTypeById = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新灾害类型
   */
  updateDisasterType = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const typeId = parseInt(id);

    if (isNaN(typeId)) {
      return this.error(res, '无效的灾害类型ID');
    }

    const { name, base_risk_level } = req.body;

    // 检查灾害类型是否存在
    const existingType = await this.disasterTypeModel.findById(typeId);
    if (!existingType) {
      return this.notFound(res, '灾害类型不存在');
    }

    // 验证风险等级
    if (base_risk_level && (base_risk_level < 1 || base_risk_level > 5)) {
      return this.error(res, '基础风险等级必须在1-5之间');
    }

    // 检查名称是否已被其他类型使用
    if (name && await this.disasterTypeModel.nameExists(name, typeId)) {
      return this.error(res, '灾害类型名称已被其他类型使用');
    }

    try {
      const updatedType = await this.disasterTypeModel.updateDisasterType(typeId, req.body);
      if (!updatedType) {
        return this.error(res, '更新失败');
      }

      return this.success(res, updatedType, '灾害类型更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据风险等级获取灾害类型
   */
  getDisasterTypesByRiskLevel = this.asyncHandler(async (req: Request, res: Response) => {
    const { risk_level } = req.params;
    const riskLevel = parseInt(risk_level);

    if (isNaN(riskLevel) || riskLevel < 1 || riskLevel > 5) {
      return this.error(res, '风险等级必须在1-5之间');
    }

    try {
      const types = await this.disasterTypeModel.getByRiskLevel(riskLevel);
      return this.success(res, types);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 切换灾害类型激活状态
   */
  toggleDisasterTypeStatus = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取灾害类型统计信息
   */
  getDisasterTypeStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await this.disasterTypeModel.getTypeStats();
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 删除灾害类型
   */
  deleteDisasterType = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const typeId = parseInt(id);

    if (isNaN(typeId)) {
      return this.error(res, '无效的灾害类型ID');
    }

    try {
      // 检查是否有其他表引用此灾害类型
      const { hasReferences, referencedTables } = await this.disasterTypeModel.checkReferences(typeId);
      
      if (hasReferences) {
        const tableNames = {
          'risk_zones': '风险区域',
          'user_reports': '用户报告'
        };
        const referencedNames = referencedTables.map(table => tableNames[table as keyof typeof tableNames] || table).join('、');
        return this.error(res, `无法删除：该灾害类型正在被${referencedNames}引用`, 400);
      }

      const success = await this.disasterTypeModel.delete(typeId);
      if (!success) {
        return this.notFound(res, '灾害类型不存在');
      }

      return this.success(res, null, '灾害类型删除成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });
}