import { Router } from 'express';
import { WarningController } from '../controllers/WarningController';
import { verifyToken, requireAdmin, requireExpertOrAdmin } from '../middleware/auth';

const router = Router();
const warningController = new WarningController();

// 公开路由（无需认证）
router.get('/active', warningController.getActiveWarnings);                    // 获取活跃预警
router.get('/evacuation', warningController.getEvacuationWarnings);           // 获取疏散预警
router.get('/location', warningController.getWarningsByLocation);             // 根据位置获取预警
router.get('/level', warningController.getWarningsByLevel);                   // 根据等级获取预警
router.get('/zone/:zone_id', warningController.getWarningsByZone);            // 根据区域获取预警
router.get('/disaster-type/:disaster_type_id', warningController.getWarningsByDisasterType); // 根据灾害类型获取预警

// 需要登录的路由
router.get('/', verifyToken, warningController.getWarnings);                  // 获取预警列表
router.get('/export', verifyToken, warningController.exportWarnings);         // 导出预警（需在/:id之前）
router.get('/stats', verifyToken, warningController.getWarningStats);         // 获取预警统计
router.get('/:id/history', verifyToken, warningController.getWarningHistory); // 获取预警历史记录
router.get('/:id', verifyToken, warningController.getWarningById);            // 获取预警详情

// 需要专家或管理员权限的路由
router.post('/', verifyToken, requireExpertOrAdmin, warningController.createWarning);        // 创建预警
router.put('/:id', verifyToken, requireExpertOrAdmin, warningController.updateWarning);      // 更新预警
router.patch('/:id/cancel', verifyToken, requireExpertOrAdmin, warningController.cancelWarning); // 取消预警

// 需要管理员权限的路由
router.post('/auto-assess', verifyToken, requireAdmin, warningController.autoAssessAndWarn);     // 自动评估预警
router.post('/process-expired', verifyToken, requireAdmin, warningController.processExpiredWarnings); // 处理过期预警

export default router;