import { Router } from 'express';
import { MonitoringStationController } from '../controllers/MonitoringStationController';
import { verifyToken, requireAdmin } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const controller = new MonitoringStationController();

// 需要登录的路由
router.use(verifyToken);
router.get('/', controller.getStations);
router.get('/statistics', controller.getStationStatistics);
router.get('/:id', controller.getStationDetail);

// 需要专家或管理员权限的路由
router.use(authorize(['expert', 'admin']));
router.post('/', controller.createStation);
router.put('/:id', controller.updateStation);
router.put('/batch/status', controller.batchUpdateStationStatus);

// 需要管理员权限的路由
router.use(requireAdmin);
router.delete('/:id', controller.deleteStation);

export default router;