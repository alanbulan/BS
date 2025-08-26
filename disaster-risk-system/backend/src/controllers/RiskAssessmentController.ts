import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { Point } from '../types';

export class RiskAssessmentController extends BaseController {
  private riskAssessmentService: RiskAssessmentService;

  constructor() {
    super();
    this.riskAssessmentService = new RiskAssessmentService();
  }

  /**
   * 评估指定区域的风险
   */
  assessZoneRisk = this.asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;
    
    if (!zoneId || isNaN(Number(zoneId))) {
      return this.error(res, '无效的区域ID');
    }

    try {
      const assessment = await this.riskAssessmentService.assessCurrentRisk(Number(zoneId));
      return this.success(res, assessment, '风险评估完成');
    } catch (error: any) {
      console.error('风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 批量评估多个区域的风险
   */
  batchAssessRisk = this.asyncHandler(async (req: Request, res: Response) => {
    const { zoneIds } = req.body;
    
    if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
      return this.error(res, '请提供有效的区域ID数组');
    }

    // 验证所有ID都是数字
    const invalidIds = zoneIds.filter(id => isNaN(Number(id)));
    if (invalidIds.length > 0) {
      return this.error(res, `无效的区域ID: ${invalidIds.join(', ')}`);
    }

    try {
      const assessments = await this.riskAssessmentService.batchAssessRisk(
        zoneIds.map(id => Number(id))
      );
      return this.success(res, assessments, `成功评估 ${assessments.length} 个区域的风险`);
    } catch (error: any) {
      console.error('批量风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 评估指定位置附近的风险
   */
  assessLocationRisk = this.asyncHandler(async (req: Request, res: Response) => {
    const { longitude, latitude, radius } = req.query;
    
    if (!longitude || !latitude) {
      return this.error(res, '请提供经纬度坐标');
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);
    const radiusKm = radius ? parseFloat(radius as string) : 5;

    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return this.error(res, '无效的经纬度坐标');
    }

    if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      return this.error(res, '搜索半径必须在0-100公里之间');
    }

    const location: Point = {
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
    } catch (error: any) {
      console.error('位置风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 获取区域历史风险评估
   */
  getHistoricalAssessments = this.asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;
    const { days } = req.query;
    
    if (!zoneId || isNaN(Number(zoneId))) {
      return this.error(res, '无效的区域ID');
    }

    const daysBack = days ? parseInt(days as string) : 30;
    if (isNaN(daysBack) || daysBack <= 0 || daysBack > 365) {
      return this.error(res, '天数必须在1-365之间');
    }

    try {
      const assessments = await this.riskAssessmentService.getHistoricalAssessments(
        Number(zoneId), 
        daysBack
      );
      return this.success(res, assessments, `获取到 ${assessments.length} 条历史评估记录`);
    } catch (error: any) {
      console.error('获取历史评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 获取高风险区域列表
   */
  getHighRiskZones = this.asyncHandler(async (req: Request, res: Response) => {
    const { minRiskLevel } = req.query;
    
    const minLevel = minRiskLevel ? parseInt(minRiskLevel as string) : 4;
    if (isNaN(minLevel) || minLevel < 1 || minLevel > 5) {
      return this.error(res, '风险等级必须在1-5之间');
    }

    try {
      const assessments = await this.riskAssessmentService.getHighRiskZones(minLevel);
      return this.success(res, assessments, `找到 ${assessments.length} 个高风险区域`);
    } catch (error: any) {
      console.error('获取高风险区域失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 获取风险评估列表
   */
  getRiskAssessments = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      
      const result = await this.riskAssessmentService.getAllAssessments(page, limit, filters);
      return this.paginated(res, result.assessments, {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error: any) {
      console.error('获取风险评估列表失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 获取风险评估详情
   */
  getRiskAssessment = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error: any) {
      console.error('获取风险评估详情失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 创建风险评估
   */
  createRiskAssessment = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const assessment = await this.riskAssessmentService.createAssessment(req.body);
      return this.created(res, assessment, '创建风险评估成功');
    } catch (error: any) {
      console.error('创建风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 更新风险评估
   */
  updateRiskAssessment = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error: any) {
      console.error('更新风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 删除风险评估
   */
  deleteRiskAssessment = this.asyncHandler(async (req: Request, res: Response) => {
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
    } catch (error: any) {
      console.error('删除风险评估失败:', error);
      return this.serverError(res, error);
    }
  });

  /**
   * 获取风险评估统计信息
   */
  getRiskAssessmentStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await this.riskAssessmentService.getAssessmentStats();
      return this.success(res, stats, '获取统计信息成功');
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
      return this.serverError(res, error);
    }
  });
}