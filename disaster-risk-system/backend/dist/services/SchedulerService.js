"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const WarningService_1 = require("./WarningService");
const RefreshTokenModel_1 = require("../models/RefreshTokenModel");
const PasswordResetTokenModel_1 = require("../models/PasswordResetTokenModel");
const ConfigService_1 = require("./ConfigService");
class SchedulerService {
    constructor() {
        this.intervals = [];
        this.currentCollectionInterval = 30;
        this.warningService = new WarningService_1.WarningService();
        this.refreshTokenModel = new RefreshTokenModel_1.RefreshTokenModel();
        this.passwordResetTokenModel = new PasswordResetTokenModel_1.PasswordResetTokenModel();
    }
    async startAllTasks() {
        console.log('启动定时任务服务...');
        await ConfigService_1.configService.warmupCache();
        this.setupConfigListeners();
        await this.startAutoWarningTask();
        this.startExpiredWarningTask();
        this.startTokenCleanupTask();
        console.log('所有定时任务已启动');
    }
    stopAllTasks() {
        console.log('停止定时任务服务...');
        this.intervals.forEach(interval => {
            clearInterval(interval);
        });
        this.intervals = [];
        console.log('所有定时任务已停止');
    }
    async startAutoWarningTask() {
        const intervalMinutes = await ConfigService_1.configService.getConfig('monitoring.collection_interval');
        this.currentCollectionInterval = intervalMinutes;
        const interval = setInterval(async () => {
            try {
                console.log('开始自动风险评估...');
                const warnings = await this.warningService.autoAssessAndWarn();
                console.log(`自动风险评估完成，生成 ${warnings.length} 条预警`);
            }
            catch (error) {
                console.error('自动风险评估失败:', error);
            }
        }, intervalMinutes * 60 * 1000);
        this.intervals.push(interval);
        console.log(`自动风险评估任务已启动（每${intervalMinutes}分钟执行一次）`);
    }
    startExpiredWarningTask() {
        const interval = setInterval(async () => {
            try {
                console.log('开始处理过期预警...');
                const expiredCount = await this.warningService.processExpiredWarnings();
                if (expiredCount > 0) {
                    console.log(`处理过期预警完成，更新 ${expiredCount} 条预警状态`);
                }
            }
            catch (error) {
                console.error('处理过期预警失败:', error);
            }
        }, 60 * 60 * 1000);
        this.intervals.push(interval);
        console.log('过期预警处理任务已启动（每小时执行一次）');
    }
    setupConfigListeners() {
        ConfigService_1.configService.on('configChanged', (key, value) => {
            if (key === 'monitoring.collection_interval') {
                console.log(`监控间隔配置已变更: ${this.currentCollectionInterval}分钟 -> ${value}分钟`);
                this.restartAutoWarningTask(value);
            }
        });
    }
    async restartAutoWarningTask(newIntervalMinutes) {
        this.intervals.forEach((interval, index) => {
            if (index === 0) {
                clearInterval(interval);
                this.intervals.splice(index, 1);
            }
        });
        this.currentCollectionInterval = newIntervalMinutes;
        const interval = setInterval(async () => {
            try {
                console.log('开始自动风险评估...');
                const warnings = await this.warningService.autoAssessAndWarn();
                console.log(`自动风险评估完成，生成 ${warnings.length} 条预警`);
            }
            catch (error) {
                console.error('自动风险评估失败:', error);
            }
        }, newIntervalMinutes * 60 * 1000);
        this.intervals.unshift(interval);
        console.log(`自动风险评估任务已重启（新间隔: ${newIntervalMinutes}分钟）`);
    }
    startTokenCleanupTask() {
        const now = new Date();
        const next2AM = new Date();
        next2AM.setHours(2, 0, 0, 0);
        if (next2AM <= now) {
            next2AM.setDate(next2AM.getDate() + 1);
        }
        const timeToNext2AM = next2AM.getTime() - now.getTime();
        setTimeout(() => {
            this.cleanupExpiredTokens();
            const interval = setInterval(() => {
                this.cleanupExpiredTokens();
            }, 24 * 60 * 60 * 1000);
            this.intervals.push(interval);
        }, timeToNext2AM);
        console.log(`Token清理任务已启动（每天凌晨2点执行，下次执行时间: ${next2AM.toLocaleString()}）`);
    }
    async cleanupExpiredTokens() {
        try {
            console.log('开始清理过期Token...');
            const [expiredRefreshTokens, expiredResetTokens] = await Promise.all([
                this.refreshTokenModel.deleteExpiredTokens(),
                this.passwordResetTokenModel.deleteExpiredTokens()
            ]);
            console.log(`Token清理完成 - 刷新Token: ${expiredRefreshTokens}条, 重置Token: ${expiredResetTokens}条`);
        }
        catch (error) {
            console.error('清理过期Token失败:', error);
        }
    }
    async manualAutoAssess() {
        try {
            console.log('手动执行自动风险评估...');
            const warnings = await this.warningService.autoAssessAndWarn();
            console.log(`手动风险评估完成，生成 ${warnings.length} 条预警`);
            return warnings;
        }
        catch (error) {
            console.error('手动风险评估失败:', error);
            throw error;
        }
    }
    async manualProcessExpiredWarnings() {
        try {
            console.log('手动处理过期预警...');
            const expiredCount = await this.warningService.processExpiredWarnings();
            console.log(`手动处理过期预警完成，更新 ${expiredCount} 条预警状态`);
            return expiredCount;
        }
        catch (error) {
            console.error('手动处理过期预警失败:', error);
            throw error;
        }
    }
    async manualCleanupTokens() {
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
        }
        catch (error) {
            console.error('手动清理过期Token失败:', error);
            throw error;
        }
    }
    getTaskStatus() {
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
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=SchedulerService.js.map