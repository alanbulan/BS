import { Router } from 'express';
import { MonitoringStationTypeController } from '../controllers/MonitoringStationTypeController';
import { verifyToken, requireAdmin, requireExpertOrAdmin } from '../middleware/auth';

const router = Router();
const controller = new MonitoringStationTypeController();

// 公共：获取类型（支持 ?only_active=true）
router.get('/', controller.getTypes);

// 登录 + 专家/管理员：创建、更新、统计
router.use(verifyToken);
router.use(requireExpertOrAdmin);
router.post('/', controller.createType);
router.put('/:id', controller.updateType);
router.get('/stats/usage', controller.getTypeUsageStats);

// 管理员：删除
router.use(requireAdmin);
router.delete('/:id', controller.deleteType);

export default router;