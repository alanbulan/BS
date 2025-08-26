import { Router } from 'express';
import { DisasterTypeController } from '../controllers/DisasterTypeController';
import { verifyToken, requireAdmin, requireExpertOrAdmin } from '../middleware/auth';

const router = Router();
const disasterTypeController = new DisasterTypeController();

// 公开路由（无需认证）
router.get('/', disasterTypeController.getDisasterTypes);                    // 获取灾害类型列表
router.get('/stats', disasterTypeController.getDisasterTypeStats);          // 获取统计信息
router.get('/risk-level/:risk_level', disasterTypeController.getDisasterTypesByRiskLevel); // 根据风险等级获取
router.get('/:id', disasterTypeController.getDisasterTypeById);             // 根据ID获取灾害类型

// 需要专家或管理员权限的路由
router.post('/', verifyToken, requireExpertOrAdmin, disasterTypeController.createDisasterType);        // 创建灾害类型
router.put('/:id', verifyToken, requireExpertOrAdmin, disasterTypeController.updateDisasterType);     // 更新灾害类型

// 需要管理员权限的路由
router.patch('/:id/status', verifyToken, requireAdmin, disasterTypeController.toggleDisasterTypeStatus); // 切换状态
router.delete('/:id', verifyToken, requireAdmin, disasterTypeController.deleteDisasterType);           // 删除灾害类型

export default router;