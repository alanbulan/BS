import { WarningService } from './WarningService';
import { RefreshTokenModel } from '../models/RefreshTokenModel';
import { PasswordResetTokenModel } from '../models/PasswordResetTokenModel';
import { configService } from './ConfigService';

export class SchedulerService {
  private warningService: WarningService;
  private refreshTokenModel: RefreshTokenModel;
  private passwordResetTokenModel: PasswordResetTokenModel;
  private intervals: NodeJS.Timeout[] = [];
  private currentCollectionInterval: number = 30; // 当前使用的间隔（分钟）

  constructor() {
    this.warningService = new WarningService();
    this.refreshTokenModel = new RefreshTokenModel();
    this.passwordResetTokenModel = new PasswordResetTokenModel();
  }

  /**
   * 启动所有定时任务
   */
  async startAllTasks(): Promise<void> {
    console.log('启动定时任务服务...');

    // 预热配置缓存
    await configService.warmupCache();

    // 监听配置变更
    this.setupConfigListeners();

    // 自动风险评估和预警（使用配置的间隔）
    await this.startAutoWarningTask();

    // 处理过期预警（每小时）
    this.startExpiredWarningTask();

    // 清理过期Token（每天凌晨2点）
    this.startTokenCleanupTask();

    console.log('所有定时任务已启动');
  }

  /**
   * 停止所有定时任务
   */
  stopAllTasks(): void {
    console.log('停止定时任务服务...');
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = [];
    console.log('所有定时任务已停止');
  }

  /**
   * 自动风险评估和预警任务
   */
  private async startAutoWarningTask(): Promise<void> {
    // 获取配置的间隔时间
    const intervalMinutes = await configService.getConfig('monitoring.collection_interval');
    this.currentCollectionInterval = intervalMinutes;
    
    const interval = setInterval(async () => {
      try {
        console.log('开始自动风险评估...');
        const warnings = await this.warningService.autoAssessAndWarn();
        console.log(`自动风险评估完成，生成 ${warnings.length} 条预警`);
      } catch (error) {
        console.error('自动风险评估失败:', error);
      }
    }, intervalMinutes * 60 * 1000); // 使用配置的间隔

    this.intervals.push(interval);
    console.log(`自动风险评估任务已启动（每${intervalMinutes}分钟执行一次）`);
  }

  /**
   * 处理过期预警任务
   */
  private startExpiredWarningTask(): void {
    const interval = setInterval(async () => {
      try {
        console.log('开始处理过期预警...');
        const expiredCount = await this.warningService.processExpiredWarnings();
        if (expiredCount > 0) {
          console.log(`处理过期预警完成，更新 ${expiredCount} 条预警状态`);
        }
      } catch (error) {
        console.error('处理过期预警失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时

    this.intervals.push(interval);
    console.log('过期预警处理任务已启动（每小时执行一次）');
  }

  /**
   * 设置配置监听器
   */
  private setupConfigListeners(): void {
    configService.on('configChanged', (key: string, value: any) => {
      if (key === 'monitoring.collection_interval') {
        console.log(`监控间隔配置已变更: ${this.currentCollectionInterval}分钟 -> ${value}分钟`);
        this.restartAutoWarningTask(value);
      }
    });
  }

  /**
   * 重启自动预警任务（当配置变更时）
   */
  private async restartAutoWarningTask(newIntervalMinutes: number): Promise<void> {
    // 停止当前的自动预警任务
    this.intervals.forEach((interval, index) => {
      if (index === 0) { // 假设第一个是自动预警任务
        clearInterval(interval);
        this.intervals.splice(index, 1);
      }
    });
    
    this.currentCollectionInterval = newIntervalMinutes;
    
    // 重新启动任务
    const interval = setInterval(async () => {
      try {
        console.log('开始自动风险评估...');
        const warnings = await this.warningService.autoAssessAndWarn();
        console.log(`自动风险评估完成，生成 ${warnings.length} 条预警`);
      } catch (error) {
        console.error('自动风险评估失败:', error);
      }
    }, newIntervalMinutes * 60 * 1000);
    
    this.intervals.unshift(interval); // 插入到数组开头
    console.log(`自动风险评估任务已重启（新间隔: ${newIntervalMinutes}分钟）`);
  }

  /**
   * 清理过期Token任务
   */
  private startTokenCleanupTask(): void {
    // 计算到下一个凌晨2点的时间
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const timeToNext2AM = next2AM.getTime() - now.getTime();

    // 首次执行
    setTimeout(() => {
      this.cleanupExpiredTokens();
      
      // 然后每24小时执行一次
      const interval = setInterval(() => {
        this.cleanupExpiredTokens();
      }, 24 * 60 * 60 * 1000);
      
      this.intervals.push(interval);
    }, timeToNext2AM);

    console.log(`Token清理任务已启动（每天凌晨2点执行，下次执行时间: ${next2AM.toLocaleString()}）`);
  }

  /**
   * 清理过期Token
   */
  private async cleanupExpiredTokens(): Promise<void> {
    try {
      console.log('开始清理过期Token...');
      
      const [expiredRefreshTokens, expiredResetTokens] = await Promise.all([
        this.refreshTokenModel.deleteExpiredTokens(),
        this.passwordResetTokenModel.deleteExpiredTokens()
      ]);

      console.log(`Token清理完成 - 刷新Token: ${expiredRefreshTokens}条, 重置Token: ${expiredResetTokens}条`);
    } catch (error) {
      console.error('清理过期Token失败:', error);
    }
  }

  /**
   * 手动执行自动风险评估
   */
  async manualAutoAssess(): Promise<any[]> {
    try {
      console.log('手动执行自动风险评估...');
      const warnings = await this.warningService.autoAssessAndWarn();
      console.log(`手动风险评估完成，生成 ${warnings.length} 条预警`);
      return warnings;
    } catch (error) {
      console.error('手动风险评估失败:', error);
      throw error;
    }
  }

  /**
   * 手动处理过期预警
   */
  async manualProcessExpiredWarnings(): Promise<number> {
    try {
      console.log('手动处理过期预警...');
      const expiredCount = await this.warningService.processExpiredWarnings();
      console.log(`手动处理过期预警完成，更新 ${expiredCount} 条预警状态`);
      return expiredCount;
    } catch (error) {
      console.error('手动处理过期预警失败:', error);
      throw error;
    }
  }

  /**
   * 手动清理过期Token
   */
  async manualCleanupTokens(): Promise<{ refreshTokens: number; resetTokens: number }> {
    try {
      console.log('手动清理过期Token...');
      
      const [expiredRefreshTokens, expiredResetTokens] = await Promise.all([
        this.refreshTokenModel.deleteExpiredTokens(),
        this.passwordResetTokenModel.deleteExpiredTokens()
      ]);

      const result = {
        refreshTokens: expiredRefreshTokens,
        resetTokens: expiredResetTokens
      };

      console.log(`手动Token清理完成 - 刷新Token: ${expiredRefreshTokens}条, 重置Token: ${expiredResetTokens}条`);
      return result;
    } catch (error) {
      console.error('手动清理过期Token失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(): any {
    return {
      running: this.intervals.length > 0,
      taskCount: this.intervals.length,
      tasks: [
        {
          name: '自动风险评估',
          interval: '30分钟',
          description: '自动评估风险区域并生成预警'
        },
        {
          name: '过期预警处理',
          interval: '1小时',
          description: '标记过期的预警信息'
        },
        {
          name: 'Token清理',
          interval: '每天凌晨2点',
          description: '清理过期的刷新Token和重置Token'
        }
      ]
    };
  }
}