import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { RiskZone, Point, Polygon } from '../types';

export class RiskZoneController extends BaseController {
  private riskZoneModel: RiskZoneModel;

  constructor() {
    super();
    this.riskZoneModel = new RiskZoneModel();
  }

  // 创建风险区域
  createRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['name', 'code', 'disaster_type_id', 'base_risk_level']);
    if (validation) {
      return this.error(res, validation);
    }

    const { code, base_risk_level } = req.body;

    // 检查区域编码是否已存在
    if (await this.riskZoneModel.codeExists(code)) {
      return this.error(res, '区域编码已存在');
    }

    // 验证风险等级
    if (base_risk_level < 1 || base_risk_level > 5) {
      return this.error(res, '风险等级必须在1-5之间');
    }

    try {
      const riskZone = await this.riskZoneModel.createRiskZone(req.body);
      return this.created(res, riskZone, '风险区域创建成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取风险区域列表
  getRiskZones = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const { disaster_type_id, risk_level_min, risk_level_max } = req.query;

    try {
      let conditions: any = {};
      
      if (disaster_type_id) {
        conditions.disaster_type_id = parseInt(disaster_type_id as string);
      }

      const result = await this.riskZoneModel.paginate(page, limit, conditions);
      
      // 如果有风险等级筛选，需要额外过滤
      let filteredData = result.data;
      if (risk_level_min || risk_level_max) {
        const minLevel = parseInt(risk_level_min as string) || 1;
        const maxLevel = parseInt(risk_level_max as string) || 5;
        filteredData = result.data.filter(zone => 
          zone.base_risk_level >= minLevel && zone.base_risk_level <= maxLevel
        );
      }

      return this.paginated(res, filteredData, result.pagination);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据ID获取风险区域
  getRiskZoneById = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据编码获取风险区域
  getRiskZoneByCode = this.asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    try {
      const riskZone = await this.riskZoneModel.findByCode(code);
      if (!riskZone) {
        return this.notFound(res, '风险区域不存在');
      }

      return this.success(res, riskZone);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 更新风险区域
  updateRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const zoneId = parseInt(id);

    if (isNaN(zoneId)) {
      return this.error(res, '无效的区域ID');
    }

    const { code, base_risk_level } = req.body;

    // 检查区域是否存在
    const existingZone = await this.riskZoneModel.findById(zoneId);
    if (!existingZone) {
      return this.notFound(res, '风险区域不存在');
    }

    // 检查区域编码是否已被其他区域使用
    if (code && await this.riskZoneModel.codeExists(code, zoneId)) {
      return this.error(res, '区域编码已被其他区域使用');
    }

    // 验证风险等级
    if (base_risk_level && (base_risk_level < 1 || base_risk_level > 5)) {
      return this.error(res, '风险等级必须在1-5之间');
    }

    try {
      const updatedZone = await this.riskZoneModel.updateRiskZone(zoneId, req.body);
      if (!updatedZone) {
        return this.error(res, '更新失败');
      }

      return this.success(res, updatedZone, '风险区域更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据位置查找风险区域
  getRiskZonesByLocation = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.query, ['longitude', 'latitude']);
    if (validation) {
      return this.error(res, validation);
    }

    const { longitude, latitude } = req.query;
    const location: Point = {
      type: 'Point',
      coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
    };

    // 验证坐标
    if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return this.error(res, '坐标格式不正确');
    }

    try {
      const riskZones = await this.riskZoneModel.findByLocation(location);
      return this.success(res, riskZones);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 查找附近的风险区域
  getNearbyRiskZones = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.query, ['longitude', 'latitude']);
    if (validation) {
      return this.error(res, validation);
    }

    const { longitude, latitude, radius = 10 } = req.query;
    const radiusKm = Math.min(100, Math.max(1, parseInt(radius as string) || 10));

    const location: Point = {
      type: 'Point',
      coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
    };

    // 验证坐标
    if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return this.error(res, '坐标格式不正确');
    }

    try {
      const riskZones = await this.riskZoneModel.findNearbyZones(location, radiusKm);
      return this.success(res, riskZones);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据灾害类型获取风险区域
  getRiskZonesByDisasterType = this.asyncHandler(async (req: Request, res: Response) => {
    const { disaster_type_id } = req.params;
    const disasterTypeId = parseInt(disaster_type_id);

    if (isNaN(disasterTypeId)) {
      return this.error(res, '无效的灾害类型ID');
    }

    try {
      const riskZones = await this.riskZoneModel.findByDisasterType(disasterTypeId);
      return this.success(res, riskZones);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据风险等级获取风险区域
  getRiskZonesByRiskLevel = this.asyncHandler(async (req: Request, res: Response) => {
    const { min_level = 1, max_level = 5 } = req.query;
    const minLevel = parseInt(min_level as string);
    const maxLevel = parseInt(max_level as string);

    if (isNaN(minLevel) || isNaN(maxLevel) || minLevel < 1 || maxLevel > 5 || minLevel > maxLevel) {
      return this.error(res, '风险等级参数不正确');
    }

    try {
      const riskZones = await this.riskZoneModel.findByRiskLevel(minLevel, maxLevel);
      return this.success(res, riskZones);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取风险区域统计信息
  getRiskZoneStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await this.riskZoneModel.getZoneStats();
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取区域边界框
  getRiskZoneBounds = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 查找重叠的风险区域
  getOverlappingRiskZones = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['geometry']);
    if (validation) {
      return this.error(res, validation);
    }

    const { geometry } = req.body as { geometry: Polygon };

    // 验证几何数据格式
    if (!geometry.coordinates || !Array.isArray(geometry.coordinates[0])) {
      return this.error(res, '几何数据格式不正确');
    }

    try {
      const overlappingZones = await this.riskZoneModel.findOverlappingZones(geometry);
      return this.success(res, overlappingZones);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 删除风险区域
  deleteRiskZone = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });
}