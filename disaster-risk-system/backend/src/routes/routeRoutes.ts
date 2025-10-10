import { Router } from 'express';
import { RouteController } from '../controllers/RouteController';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const routeController = new RouteController();

/**
 * @route POST /api/routes/calculate
 * @desc 计算逃生路径
 * @access Public (optionalAuth - 登录用户会保存路径)
 */
router.post('/calculate', optionalAuth, routeController.calculateRoute);

/**
 * @route PUT /api/routes/:routeId/status
 * @desc 更新路径状态
 * @access Public
 */
router.put('/:routeId/status', routeController.updateRouteStatus);

/**
 * @route POST /api/routes/:routeId/check-rerouting
 * @desc 检查是否需要重新规划路径
 * @access Public
 */
router.post('/:routeId/check-rerouting', routeController.checkRerouting);

/**
 * @route GET /api/routes/shelters/nearest
 * @desc 获取最近的避难场所
 * @access Public
 */
router.get('/shelters/nearest', routeController.getNearestShelters);

/**
 * @route GET /api/routes/:routeId
 * @desc 获取路径详情
 * @access Public
 */
router.get('/:routeId', routeController.getRouteDetails);

export default router;