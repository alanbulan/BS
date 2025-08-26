import { Router } from 'express';
import { SchedulerController } from '../controllers/SchedulerController';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();
const schedulerController = new SchedulerController();

// 需要管理员权限的路由
router.get('/status', verifyToken, requireAdmin, schedulerController.getTaskStatus);           // 获取任务状态
router.post('/auto-assess', verifyToken, requireAdmin, schedulerController.manualAutoAssess); // 手动风险评估
router.post('/process-expired', verifyToken, requireAdmin, schedulerController.manualProcessExpired); // 手动处理过期预警
router.post('/cleanup-tokens', verifyToken, requireAdmin, schedulerController.manualCleanupTokens); // 手动清理Token
router.post('/start', verifyToken, requireAdmin, schedulerController.startTasks);             // 启动定时任务
router.post('/stop', verifyToken, requireAdmin, schedulerController.stopTasks);               // 停止定时任务

export default router;