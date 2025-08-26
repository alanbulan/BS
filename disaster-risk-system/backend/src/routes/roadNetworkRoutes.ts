import { Router } from 'express';
import { RoadNetworkController } from '../controllers/RoadNetworkController';
import { verifyToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const roadNetworkController = new RoadNetworkController();

// 公共路由（不需要认证）
// 查找指定区域内的道路
router.get('/in-area', roadNetworkController.getRoadsInArea);

// 查找应急路线
router.get('/emergency', roadNetworkController.getEmergencyRoutes);

// 查找指定点附近的道路
router.get('/near-point', roadNetworkController.getRoadsNearPoint);

// 获取道路连通性分析
router.get('/connectivity/analysis', roadNetworkController.getConnectivityAnalysis);

// 需要认证的路由
router.use(verifyToken);

// 获取道路网络列表
router.get('/', roadNetworkController.getRoads);

// 根据ID获取道路网络记录
router.get('/:id', roadNetworkController.getRoadById);

// 根据道路ID获取道路网络记录
router.get('/road/:roadId', roadNetworkController.getRoadByRoadId);

// 获取道路网络统计信息
router.get('/stats/overview', roadNetworkController.getStatistics);

// 获取道路质量报告
router.get('/quality/report', roadNetworkController.getQualityReport);

// 需要管理员或应急管理员权限的路由
router.use(authorize(['admin', 'emergency_manager']));

// 创建道路网络记录
router.post('/', roadNetworkController.createRoad);

// 更新道路网络记录
router.put('/:id', roadNetworkController.updateRoad);

// 更新道路状况评分
router.patch('/:id/condition', roadNetworkController.updateConditionScore);

// 设置应急路线
router.patch('/:id/emergency', roadNetworkController.setEmergencyRoute);

// 删除道路网络记录
router.delete('/:id', roadNetworkController.deleteRoad);

// 批量导入道路网络数据
router.post('/batch/import', roadNetworkController.batchImport);

export default router;