import { Router } from 'express';
import { EscapeRouteController } from '../controllers/EscapeRouteController';
import { verifyToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const escapeRouteController = new EscapeRouteController();

// 公共路由（不需要认证）
// 获取逃生路径推荐
router.get('/recommendations', escapeRouteController.getRecommendations);

// 查找从指定点出发的逃生路径
router.get('/from-point', escapeRouteController.getRoutesFromPoint);

// 查找到指定避难场所的逃生路径
router.get('/to-shelter', escapeRouteController.getRoutesToShelter);

// 查找指定区域内的逃生路径
router.get('/in-area', escapeRouteController.getRoutesInArea);

// 需要认证的路由
router.use(verifyToken);

// 获取逃生路径列表
router.get('/', escapeRouteController.getRoutes);

// 根据ID获取逃生路径
router.get('/:id', escapeRouteController.getRouteById);

// 根据路径ID获取逃生路径
router.get('/route/:routeId', escapeRouteController.getRouteByRouteId);

// 获取逃生路径统计信息
router.get('/stats/overview', escapeRouteController.getStatistics);

// 需要管理员权限的路由
router.use(authorize(['admin', 'emergency_manager']));

// 创建逃生路径
router.post('/', escapeRouteController.createRoute);

// 更新逃生路径
router.put('/:id', escapeRouteController.updateRoute);

// 验证逃生路径
router.patch('/:id/verify', escapeRouteController.verifyRoute);

// 删除逃生路径
router.delete('/:id', escapeRouteController.deleteRoute);

// 批量导入逃生路径
router.post('/batch/import', escapeRouteController.batchImport);

export default router;