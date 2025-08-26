"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerController = void 0;
const BaseController_1 = require("./BaseController");
const app_1 = require("../app");
class SchedulerController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.getTaskStatus = this.asyncHandler(async (req, res) => {
            try {
                const status = app_1.schedulerService.getTaskStatus();
                return this.success(res, status);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.manualAutoAssess = this.asyncHandler(async (req, res) => {
            try {
                const warnings = await app_1.schedulerService.manualAutoAssess();
                return this.success(res, warnings, `手动风险评估完成，生成 ${warnings.length} 条预警`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.manualProcessExpired = this.asyncHandler(async (req, res) => {
            try {
                const expiredCount = await app_1.schedulerService.manualProcessExpiredWarnings();
                return this.success(res, { expired_count: expiredCount }, `处理了 ${expiredCount} 条过期预警`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.manualCleanupTokens = this.asyncHandler(async (req, res) => {
            try {
                const result = await app_1.schedulerService.manualCleanupTokens();
                return this.success(res, result, `清理完成 - 刷新Token: ${result.refreshTokens}条, 重置Token: ${result.resetTokens}条`);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.startTasks = this.asyncHandler(async (req, res) => {
            try {
                app_1.schedulerService.startAllTasks();
                return this.success(res, null, '定时任务已启动');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.stopTasks = this.asyncHandler(async (req, res) => {
            try {
                app_1.schedulerService.stopAllTasks();
                return this.success(res, null, '定时任务已停止');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
    }
}
exports.SchedulerController = SchedulerController;
//# sourceMappingURL=SchedulerController.js.map