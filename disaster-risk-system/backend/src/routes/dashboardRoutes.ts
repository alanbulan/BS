import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { verifyToken } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

// 应用认证中间件
router.use(verifyToken);

// 获取仪表板统计信息
router.get('/stats', dashboardController.getDashboardStats.bind(dashboardController));

// 获取风险等级分布
router.get('/risk-levels', dashboardController.getRiskLevelStats.bind(dashboardController));

// 获取最新预警信息
router.get('/warnings/recent', dashboardController.getRecentWarnings.bind(dashboardController));

// 获取系统状态
router.get('/system-status', dashboardController.getSystemStatus.bind(dashboardController));

// 获取监测站点统计
router.get('/station-stats', dashboardController.getStationStats.bind(dashboardController));

// 获取灾害类型统计
router.get('/disaster-type-stats', dashboardController.getDisasterTypeStats.bind(dashboardController));

// 获取监测数据概览
router.get('/monitoring-overview', dashboardController.getMonitoringOverview.bind(dashboardController));

// 获取风险趋势
router.get('/risk-trends', dashboardController.getRiskTrends.bind(dashboardController));

export default router;