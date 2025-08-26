import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MonitoringStationTypeModel } from '../models/MonitoringStationTypeModel';

export class MonitoringStationTypeController extends BaseController {
  private model: MonitoringStationTypeModel;

  constructor() {
    super();
    this.model = new MonitoringStationTypeModel();
  }

  /**
   * 获取所有监测站类型（可选仅活跃）
   */
  getTypes = this.asyncHandler(async (req: Request, res: Response) => {
    const { only_active } = req.query;
    try {
      if (only_active === 'true') {
        const data = await this.model.getActiveTypes();
        return this.success(res, data);
      }
      const data = await this.model.findAll();
      return this.success(res, data);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 创建监测站类型（管理员/专家）
   */
  createType = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['code', 'name_zh', 'name_en']);
    if (validation) return this.error(res, validation);

    const { code, name_zh, name_en } = req.body as { code: string; name_zh: string; name_en: string };

    // 基础校验
    const codePattern = /^[a-zA-Z0-9_]{1,50}$/;
    if (!codePattern.test(code)) {
      return this.error(res, 'code 需为字母/数字/下划线，长度不超过50');
    }
    if (!name_zh?.trim() || !name_en?.trim()) {
      return this.error(res, '中英文名称均不能为空');
    }

    try {
      // 唯一性校验
      if (await this.model.codeExists(code)) {
        return this.error(res, 'code 已存在');
      }
      const created = await this.model.create({
        code,
        name_zh: name_zh.trim(),
        name_en: name_en.trim(),
        description_zh: req.body.description_zh,
        description_en: req.body.description_en,
        is_active: req.body.is_active ?? true,
        sort_order: req.body.sort_order ?? 0,
      });
      return this.created(res, created, '类型创建成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新监测站类型（管理员/专家）
   */
  updateType = this.asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return this.error(res, '无效的ID');

    const { code, name_zh, name_en } = req.body as { code?: string; name_zh?: string; name_en?: string };

    if (code) {
      const codePattern = /^[a-zA-Z0-9_]{1,50}$/;
      if (!codePattern.test(code)) {
        return this.error(res, 'code 需为字母/数字/下划线，长度不超过50');
      }
    }

    if (code && (await this.model.codeExists(code, id))) {
      return this.error(res, 'code 已存在');
    }

    try {
      const updated = await this.model.update(id, {
        code,
        name_zh: name_zh?.trim(),
        name_en: name_en?.trim(),
        description_zh: req.body.description_zh,
        description_en: req.body.description_en,
        is_active: req.body.is_active,
        sort_order: req.body.sort_order,
      });
      if (!updated) return this.notFound(res, '类型不存在');
      return this.success(res, updated, '类型更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 删除监测站类型（管理员）
   */
  deleteType = this.asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return this.error(res, '无效的ID');

    try {
      const ok = await this.model.delete(id);
      if (!ok) return this.notFound(res, '类型不存在或已删除');
      return this.success(res, null, '类型已删除');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取类型使用统计（管理员/专家）
   */
  getTypeUsageStats = this.asyncHandler(async (_req: Request, res: Response) => {
    try {
      const stats = await this.model.getTypeUsageStats();
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });
}