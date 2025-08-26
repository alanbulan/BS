import { request } from '../index';
import type { ApiResponse } from '../../types';

// 定时任务接口
export interface TaskStatus {
  autoAssessment: {
    isRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    interval: string;
  };
  expiredWarnings: {
    isRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    interval: string;
  };
  tokenCleanup: {
    isRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    interval: string;
  };
}

export interface AutoAssessResult {
  warnings: any[];
  assessmentCount: number;
  warningCount: number;
  executionTime: number;
}

export interface ExpiredWarningsResult {
  expired_count: number;
  processedWarnings: any[];
}

export interface TokenCleanupResult {
  refreshTokens: number;
  resetTokens: number;
  totalCleaned: number;
}

// 定时任务API
export const schedulerApi = {
  // 获取定时任务状态
  getTaskStatus: (): Promise<ApiResponse<TaskStatus>> => {
    return request.get('/scheduler/status');
  },

  // 手动执行自动风险评估
  manualAutoAssess: (): Promise<ApiResponse<AutoAssessResult>> => {
    return request.post('/scheduler/manual/auto-assess');
  },

  // 手动处理过期预警
  manualProcessExpired: (): Promise<ApiResponse<ExpiredWarningsResult>> => {
    return request.post('/scheduler/manual/process-expired');
  },

  // 手动清理过期Token
  manualCleanupTokens: (): Promise<ApiResponse<TokenCleanupResult>> => {
    return request.post('/scheduler/manual/cleanup-tokens');
  },

  // 启动定时任务
  startTasks: (): Promise<ApiResponse<void>> => {
    return request.post('/scheduler/start');
  },

  // 停止定时任务
  stopTasks: (): Promise<ApiResponse<void>> => {
    return request.post('/scheduler/stop');
  }
};