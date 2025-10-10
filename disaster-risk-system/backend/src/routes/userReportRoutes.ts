import { Router } from 'express';
import { UserReportController } from '../controllers/UserReportController';
import { verifyToken, requireExpertOrAdmin, requireAdmin } from '../middleware/auth';
import { uploadFields, validateFileSize, handleUploadError } from '../middleware/upload';

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

// 获取与用户报告相关的枚举常量（报告类型、验证状态、严重程度等）
router.get('/constants', userReportController.getReportConstants);

// 获取“我的报告”（需要登录）
router.get('/my', verifyToken, userReportController.getMyReports);

// 获取用户报告详情
router.get('/:id', userReportController.getUserReportById);

// 创建用户报告（需要登录），支持 images/videos 混合上传
router.post(
  '/',
  verifyToken,
  uploadFields([
    { name: 'images', maxCount: 9 },
    { name: 'videos', maxCount: 3 }
  ]),
  handleUploadError,
  validateFileSize,
  userReportController.createUserReport
);

// 验证用户报告（专家或管理员）
router.patch('/:id/verify', verifyToken, requireExpertOrAdmin, userReportController.verifyUserReport);

// 更新用户报告投票（需要登录）
router.patch('/:id/vote', verifyToken, userReportController.updateVotes);

// 删除用户报告（管理员）
router.delete('/:id', verifyToken, requireAdmin, userReportController.deleteUserReport);

export default router;