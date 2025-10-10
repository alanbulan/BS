import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { Point } from '../types';
import * as ExcelJS from 'exceljs';
import { RiskAssessmentModel } from '../models/RiskAssessmentModel';

export class RiskAssessmentController extends BaseController {
  private riskAssessmentService: RiskAssessmentService;
  private riskAssessmentModel: RiskAssessmentModel;

  constructor() {
    super();
    this.riskAssessmentService = new RiskAssessmentService();
    this.riskAssessmentModel = new RiskAssessmentModel();
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
    // 兼容zone_ids和zoneIds两种参数名
    const zoneIds = req.body.zone_ids || req.body.zoneIds;
    
    if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
      return this.error(res, '请提供有效的区域ID数组');
    }

    // 验证所有ID都是数字
    const invalidIds = zoneIds.filter((id: any) => isNaN(Number(id)));
    if (invalidIds.length > 0) {
      return this.error(res, `无效的区域ID: ${invalidIds.join(', ')}`);
    }

    try {
      console.log(`[批量评估] 开始评估 ${zoneIds.length} 个风险区域...`);
      const assessments = await this.riskAssessmentService.batchAssessRisk(
        zoneIds.map((id: any) => Number(id))
      );
      
      const successful = assessments.filter((a: any) => a.current_risk_level).length;
      const failed = assessments.length - successful;
      
      return this.success(res, {
        successful,
        failed,
        assessments
      }, `批量评估完成：成功${successful}个，失败${failed}个`);
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

  /**
   * 导出风险评估数据
   * 支持按ID数组筛选(ids/ids[])与可选过滤(filters: JSON)，格式支持 excel/csv
   */
  exportRiskAssessments = this.asyncHandler(async (req: Request, res: Response) => {
    const { format = 'excel' } = req.query as { format?: string } as any;

    try {
      // 解析 ids 参数（兼容 ids 与 ids[] 及逗号分隔）
      const q: any = req.query || {};
      let rawIds: any = q.ids ?? q['ids[]'];
      let ids: number[] | undefined;
      if (rawIds) {
        if (Array.isArray(rawIds)) {
          ids = rawIds.map((v: any) => parseInt(String(v), 10)).filter((n: number) => Number.isInteger(n) && n > 0);
        } else if (typeof rawIds === 'string') {
          ids = rawIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isInteger(n) && n > 0);
        }
      }

      // 解析 filters（与列表接口保持一致）
      const filters = q.filters ? (() => { try { return JSON.parse(q.filters as string); } catch { return undefined; } })() : undefined;

      // 构建查询 SQL
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (ids && ids.length > 0) {
        conditions.push(`ra.id = ANY($${idx++})`);
        params.push(ids);
      } else if (filters) {
        if (filters.zone_id) { conditions.push(`ra.zone_id = $${idx++}`); params.push(filters.zone_id); }
        if (filters.risk_level_min) { conditions.push(`ra.current_risk_level >= $${idx++}`); params.push(filters.risk_level_min); }
        if (filters.risk_level_max) { conditions.push(`ra.current_risk_level <= $${idx++}`); params.push(filters.risk_level_max); }
        if (filters.start_time) { conditions.push(`ra.assessment_time >= $${idx++}`); params.push(filters.start_time); }
        if (filters.end_time) { conditions.push(`ra.assessment_time <= $${idx++}`); params.push(filters.end_time); }
        if (filters.created_by) { conditions.push(`ra.created_by = $${idx++}`); params.push(filters.created_by); }
        if (filters.assessment_method) { conditions.push(`ra.assessment_method = $${idx++}`); params.push(filters.assessment_method); }
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

      if ((format as string) === 'csv') {
        // CSV 导出
        const header = [
          'ID', '区域ID', '区域名称', '灾害类型', '评估时间', '当前风险等级', '预测24小时', '预测72小时', '置信度', '评估方法', '模型版本', '主要因素', '天气状况', '历史对比', '建议'
        ].join(',');

        const csvRows = rows.map((r: any) => [
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

      // Excel 导出
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
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } } as any;

      rows.forEach((r: any) => {
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

      await (workbook as any).xlsx.write(res);
      return res.end();
    } catch (error) {
      console.error('导出风险评估数据失败:', error);
      return this.serverError(res, '导出数据失败');
    }
  });
}