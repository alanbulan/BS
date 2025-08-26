import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { CreateRiskZoneData, UpdateRiskZoneData, Point } from '../types';

export class RiskZonesController extends BaseController {
  /**
   * 获取风险区域列表
   */
  getRiskZones = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req);
    
    const {
      name,
      disaster_type_id,
      risk_level_min,
      risk_level_max,
      is_monitored
    } = req.query;

    try {
      const filters = {
        name: name as string,
        disaster_type_id: disaster_type_id ? parseInt(disaster_type_id as string) : undefined,
        risk_level_min: risk_level_min ? parseInt(risk_level_min as string) : undefined,
        risk_level_max: risk_level_max ? parseInt(risk_level_max as string) : undefined,
        is_monitored: is_monitored !== undefined ? is_monitored === 'true' : undefined
      };

      const result = await RiskZoneModel.paginate(page, limit, filters, sortBy, sortOrder);
      
      return this.paginated(res, result.data, result.pagination);
    } catch (error) {
      console.error('获取风险区域列表失败:', error);
      return this.error(res, '获取风险区域列表失败');
    }
  });

  /**
   * 根据ID获取风险区域详情
   */
  getRiskZoneById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const riskZone = await RiskZoneModel.findById(parseInt(id));
      if (!riskZone) {
        return this.error(res, '风险区域不存在', 404);
      }

      return this.success(res, riskZone);
    } catch (error) {
      console.error('获取风险区域详情失败:', error);
      return this.error(res, '获取风险区域详情失败');
    }
  });

  /**
   * 创建风险区域
   */
  createRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['name', 'code', 'disaster_type_id', 'base_risk_level']);
    if (validation) {
      return this.error(res, validation);
    }

    try {
      const riskZoneData: CreateRiskZoneData = req.body;
      
      // 检查区域编码是否已存在
      const existingZone = await RiskZoneModel.findByCode(riskZoneData.code);
      if (existingZone) {
        return this.error(res, '区域编码已存在');
      }

      const newRiskZone = await RiskZoneModel.createZone(riskZoneData);
      return this.created(res, newRiskZone);
    } catch (error) {
      console.error('创建风险区域失败:', error);
      return this.error(res, '创建风险区域失败');
    }
  });

  /**
   * 更新风险区域
   */
  updateRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const existingZone = await RiskZoneModel.findById(parseInt(id));
      if (!existingZone) {
        return this.error(res, '风险区域不存在', 404);
      }

      // 如果更新编码，检查是否与其他区域冲突
      if (req.body.code && req.body.code !== existingZone.code) {
        const codeExists = await RiskZoneModel.findByCode(req.body.code);
        if (codeExists) {
          return this.error(res, '区域编码已存在');
        }
      }

      const updateData: UpdateRiskZoneData = req.body;
      const updatedZone = await RiskZoneModel.update(parseInt(id), updateData);
      
      return this.success(res, updatedZone);
    } catch (error) {
      console.error('更新风险区域失败:', error);
      return this.error(res, '更新风险区域失败');
    }
  });

  /**
   * 删除风险区域
   */
  deleteRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const existingZone = await RiskZoneModel.findById(parseInt(id));
      if (!existingZone) {
        return this.error(res, '风险区域不存在', 404);
      }

      await RiskZoneModel.delete(parseInt(id));
      return this.success(res, { message: '风险区域删除成功' });
    } catch (error) {
      console.error('删除风险区域失败:', error);
      return this.error(res, '删除风险区域失败');
    }
  });

  /**
   * 获取风险区域统计信息
   */
  getRiskZoneStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await RiskZoneModel.getStatistics();
      return this.success(res, stats);
    } catch (error) {
      console.error('获取风险区域统计失败:', error);
      return this.error(res, '获取统计信息失败');
    }
  });

  /**
   * 根据坐标查找风险区域
   */
  findRiskZoneByLocation = this.asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return this.error(res, '缺少坐标参数');
    }

    try {
      const location: Point = {
        type: 'Point',
        coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
      };
      const riskZones = await RiskZoneModel.findByLocation(location);
      return this.success(res, riskZones);
    } catch (error) {
      console.error('根据坐标查找风险区域失败:', error);
      return this.error(res, '查找风险区域失败');
    }
  });
}