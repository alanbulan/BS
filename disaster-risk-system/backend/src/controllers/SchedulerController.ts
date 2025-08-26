import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { schedulerService } from '../app';

export class SchedulerController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取定时任务状态
   */
  getTaskStatus = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const status = schedulerService.getTaskStatus();
      return this.success(res, status);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 手动执行自动风险评估
   */
  manualAutoAssess = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const warnings = await schedulerService.manualAutoAssess();
      return this.success(res, warnings, `手动风险评估完成，生成 ${warnings.length} 条预警`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 手动处理过期预警
   */
  manualProcessExpired = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const expiredCount = await schedulerService.manualProcessExpiredWarnings();
      return this.success(res, { expired_count: expiredCount }, `处理了 ${expiredCount} 条过期预警`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 手动清理过期Token
   */
  manualCleanupTokens = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await schedulerService.manualCleanupTokens();
      return this.success(res, result, `清理完成 - 刷新Token: ${result.refreshTokens}条, 重置Token: ${result.resetTokens}条`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 启动定时任务
   */
  startTasks = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      schedulerService.startAllTasks();
      return this.success(res, null, '定时任务已启动');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 停止定时任务
   */
  stopTasks = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      schedulerService.stopAllTasks();
      return this.success(res, null, '定时任务已停止');
    } catch (error) {
      return this.serverError(res, error);
    }
  });
}