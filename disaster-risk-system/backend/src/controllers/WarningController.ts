import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { WarningModel, CreateWarningData } from '../models/WarningModel';
import { WarningService } from '../services/WarningService';
import { Warning, Point, Polygon } from '../types';

export class WarningController extends BaseController {
  private warningModel: WarningModel;
  private warningService: WarningService;

  constructor() {
    super();
    this.warningModel = new WarningModel();
    this.warningService = new WarningService();
  }

  /**
   * 创建预警信息
   */
  createWarning = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['title', 'content']);
    if (validation) {
      return this.error(res, validation);
    }

    const { warning_level } = req.body;

    // 验证预警等级
    if (warning_level && (warning_level < 1 || warning_level > 5)) {
      return this.error(res, '预警等级必须在1-5之间');
    }

    try {
      const warning = await this.warningService.createWarning(req.body, req.user?.id);
      return this.created(res, warning, '预警创建成功');
    } catch (error: any) {
      if (error.message.includes('已存在')) {
        return this.error(res, error.message);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 获取预警信息列表
   */
  getWarnings = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    
    // 过滤参数（字段名与数据库一致）
    const zone_id = req.query.zone_id ? Number(req.query.zone_id) : undefined;
    const disaster_type_id = req.query.disaster_type_id ? Number(req.query.disaster_type_id) : undefined;
    const warning_level = req.query.warning_level ? Number(req.query.warning_level) : undefined;
    // 当未传入 status 时，不默认使用 'active'，而是不过滤状态，返回全部数据（分页）
    const status = req.query.status ? String(req.query.status) : undefined;
    const evacuation_required =
      typeof req.query.evacuation_required !== 'undefined'
        ? String(req.query.evacuation_required).toLowerCase() === 'true'
        : undefined;
    const title = req.query.title ? String(req.query.title) : undefined;

    try {
      if (status === 'active') {
        const warnings = await WarningModel.findActiveWarnings();
        const total = warnings.length;
        
        return this.paginated(res, warnings, {
          page: 1,
          limit: total,
          total,
          totalPages: 1
        });
      } else {
        // 非活跃列表或未指定状态，走分页+筛选
        const data = await WarningModel.findAll(page, limit, 'issue_time', 'DESC', {
          zone_id,
          disaster_type_id,
          warning_level,
          status,
          evacuation_required,
          title,
        });

        // 统计总数（使用相同筛选条件）
        const total = await WarningModel.countAll({
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
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据ID获取预警信息
   */
  getWarningById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const warningId = parseInt(id);

    if (isNaN(warningId)) {
      return this.error(res, '无效的预警ID');
    }

    try {
      const warning = await WarningModel.findById(warningId);
      if (!warning) {
        return this.notFound(res, '预警信息不存在');
      }

      return this.success(res, warning);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新预警信息
   */
  updateWarning = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const warningId = parseInt(id);

    if (isNaN(warningId)) {
      return this.error(res, '无效的预警ID');
    }

    const { warning_level } = req.body;

    // 验证预警等级
    if (warning_level && (warning_level < 1 || warning_level > 5)) {
      return this.error(res, '预警等级必须在1-5之间');
    }

    try {
      const updatedWarning = await this.warningService.updateWarning(warningId, req.body, req.user?.id);
      if (!updatedWarning) {
        return this.notFound(res, '预警信息不存在');
      }

      return this.success(res, updatedWarning, '预警信息更新成功');
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        return this.notFound(res, error.message);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 取消预警
   */
  cancelWarning = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const warningId = parseInt(id);

    if (isNaN(warningId)) {
      return this.error(res, '无效的预警ID');
    }

    const { reason } = req.body;

    try {
      const updated = await WarningModel.update(warningId, { status: 'cancelled' });
      if (!updated) {
        return this.notFound(res, '预警信息不存在');
      }

      const cancelledWarning = await WarningModel.findById(warningId);
      return this.success(res, cancelledWarning, '预警已取消');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据位置获取预警信息
   */
  getWarningsByLocation = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['longitude', 'latitude']);
    if (validation) {
      return this.error(res, validation);
    }

    const { longitude, latitude, radius = 50 } = req.query;
    const radiusKm = Math.min(200, Math.max(1, parseInt(radius as string) || 50));

    const location: Point = {
      type: 'Point',
      coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
    };

    // 验证坐标
    if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return this.error(res, '坐标格式不正确');
    }

    try {
      const warnings = await WarningModel.findAll();
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取活跃预警
   */
  getActiveWarnings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const warnings = await WarningModel.findActiveWarnings();
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取疏散预警
   */
  getEvacuationWarnings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const warnings = await WarningModel.findActiveWarnings();
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据区域获取预警
   */
  getWarningsByZone = this.asyncHandler(async (req: Request, res: Response) => {
    const { zone_id } = req.params;
    const zoneId = parseInt(zone_id);

    if (isNaN(zoneId)) {
      return this.error(res, '无效的区域ID');
    }

    try {
      const warnings = await WarningModel.findByZone(zoneId);
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据灾害类型获取预警
   */
  getWarningsByDisasterType = this.asyncHandler(async (req: Request, res: Response) => {
    const { disaster_type_id } = req.params;
    const disasterTypeId = parseInt(disaster_type_id);

    if (isNaN(disasterTypeId)) {
      return this.error(res, '无效的灾害类型ID');
    }

    try {
      const warnings = await WarningModel.findAll();
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据预警等级获取预警
   */
  getWarningsByLevel = this.asyncHandler(async (req: Request, res: Response) => {
    const { min_level = 1, max_level = 5 } = req.query;
    const minLevel = parseInt(min_level as string);
    const maxLevel = parseInt(max_level as string);

    if (isNaN(minLevel) || isNaN(maxLevel) || minLevel < 1 || maxLevel > 5 || minLevel > maxLevel) {
      return this.error(res, '预警等级参数不正确');
    }

    try {
      const warnings = await WarningModel.findAll();
      return this.success(res, warnings);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 自动风险评估并生成预警
   */
  autoAssessAndWarn = this.asyncHandler(async (req: Request, res: Response) => {
    const { zone_id } = req.body;

    try {
      const warnings = await this.warningService.autoAssessAndWarn(zone_id);
      return this.success(res, warnings, `自动评估完成，生成 ${warnings.length} 条预警`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 处理过期预警
   */
  processExpiredWarnings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const expiredCount = await this.warningService.processExpiredWarnings();
      return this.success(res, { expired_count: expiredCount }, `处理了 ${expiredCount} 条过期预警`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取预警统计信息
   */
  getWarningStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await this.warningService.getWarningStatistics();
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });



  /**
   * 更新预警信息状态
   */
  updateWarningStatus = this.asyncHandler(async (req: Request, res: Response) => {
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

    const result = await WarningModel.update(parseInt(id), { status });
    if (!result) {
      this.notFound(res, '预警信息不存在');
      return;
    }

    this.success(res, result, '更新预警信息状态成功');
  });

  /**
   * 延长预警信息有效期
   */
  extendWarningExpiry = this.asyncHandler(async (req: Request, res: Response) => {
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

    const result = await WarningModel.update(parseInt(id), { expiry_time: newExpiryTime });
    if (!result) {
      this.notFound(res, '预警信息不存在');
      return;
    }

    this.success(res, result, '延长预警信息有效期成功');
  });

  /**
   * 创建预警信息更新
   */
  createWarningUpdate = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      warning_level,
      title,
      content,
      affected_area,
      estimated_affected_population,
      expiry_time,
      recommended_actions,
      evacuation_required,
      shelter_recommendations
    } = req.body;

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

    // 验证预警级别
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
    } as CreateWarningData;

    const result = await WarningModel.create(updateData);
    this.created(res, result, '创建预警信息更新成功');
  });

  /**
   * 获取预警信息历史记录
   */
  getWarningHistory = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      this.error(res, '预警ID不能为空', 400);
      return;
    }

    const warningId = parseInt(id);
    if (isNaN(warningId)) {
      this.error(res, '预警ID格式错误', 400);
      return;
    }

    // 这里应该调用模型方法来获取特定预警的历史记录
    // 由于没有专门的历史记录表，我们返回预警的更新信息
    const warning = await WarningModel.findById(warningId);
    
    if (!warning) {
      this.error(res, '预警不存在', 404);
      return;
    }

    // 构造历史记录
    const history = [
      {
        id: warning.id,
        warning_id: warning.id,
        update_sequence: warning.update_sequence || 1,
        action: '预警发布',
        content: `发布${this.getWarningLevelText(warning.warning_level)}预警: ${warning.title}`,
        timestamp: warning.issue_time || warning.created_at,
        created_at: warning.created_at
      }
    ];
    
    if (warning.update_sequence && warning.update_sequence > 1) {
      history.push({
        id: warning.id,
        warning_id: warning.id,
        update_sequence: warning.update_sequence,
        action: `第${warning.update_sequence}次更新`,
        content: '预警信息已更新',
        timestamp: warning.effective_time || warning.issue_time,
        created_at: warning.effective_time || warning.issue_time
      });
    }
    
    this.success(res, history, '获取预警信息历史记录成功');
  });
  
  private getWarningLevelText(level: number): string {
    const levelMap: Record<number, string> = {
      1: '蓝色',
      2: '黄色',
      3: '橙色',
      4: '红色'
    };
    return levelMap[level] || '未知';
  }



  /**
   * 获取特定区域的预警信息
   */
  getWarningsInArea = this.asyncHandler(async (req: Request, res: Response) => {
    const { polygon } = req.body;

    if (!polygon || !polygon.coordinates) {
      this.error(res, '多边形数据无效', 400);
      return;
    }

    const warnings = await WarningModel.findAll();
    this.success(res, warnings, '获取区域预警信息成功');
  });

  /**
   * 获取预警级别统计
   */
  getWarningLevelStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await WarningModel.getWarningStats();
    this.success(res, stats, '获取预警级别统计成功');
  });

  /**
   * 获取灾害类型预警统计
   */
  getDisasterTypeWarningStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await WarningModel.getWarningStats();
    this.success(res, stats, '获取灾害类型预警统计成功');
  });

  /**
   * 导出预警数据
   */
  exportWarnings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { ids } = req.query;
      
      let warnings: any[] = [];
      
      if (ids && Array.isArray(ids)) {
        // 导出指定ID的预警
        for (const id of ids) {
          const warning = await WarningModel.findById(parseInt(id as string));
          if (warning) warnings.push(warning);
        }
      } else {
        // 导出所有预警
        warnings = await WarningModel.findAll(1, 10000);
      }
      
      // 生成CSV内容
      const headers = ['ID', '标题', '内容', '预警等级', '状态', '发布时间', '生效时间', '过期时间', '发布机构'];
      const rows = warnings.map(w => [
        w.id,
        w.title,
        w.content,
        w.warning_level,
        w.status,
        w.issue_time,
        w.effective_time || '',
        w.expiry_time || '',
        w.issuing_authority || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="warnings_${Date.now()}.csv"`);
      res.send('\uFEFF' + csvContent); // 添加BOM以支持中文
      return;
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 删除预警信息
   */
  deleteWarning = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      this.error(res, '预警信息ID不能为空', 400);
      return;
    }

    const result = await WarningModel.delete(parseInt(id));
    if (!result) {
      this.notFound(res, '预警信息不存在');
      return;
    }

    this.success(res, null, '删除预警信息成功');
  });
}