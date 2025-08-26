import { Router } from 'express';
import { UserReportController } from '../controllers/UserReportController';

const router = Router();
const userReportController = new UserReportController();

// 获取用户报告列表
router.get('/', userReportController.getUserReports);

// 获取附近的用户报告
router.get('/nearby', userReportController.getNearbyReports);

// 获取报告类型统计
router.get('/stats/types', userReportController.getReportTypeStats);

// 获取最近的紧急报告
router.get('/emergency/recent', userReportController.getRecentEmergencyReports);

// 获取报告类型列表
router.get('/types', userReportController.getReportTypes);

// 获取用户报告详情
router.get('/:id', userReportController.getUserReportById);

// 创建用户报告
router.post('/', userReportController.createUserReport);

// 验证用户报告
router.patch('/:id/verify', userReportController.verifyUserReport);

// 更新用户报告投票
router.patch('/:id/vote', userReportController.updateVotes);

// 删除用户报告
router.delete('/:id', userReportController.deleteUserReport);

export default router;