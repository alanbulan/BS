import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { verifyToken, optionalAuth } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// 公开路由（无需认证）
router.post('/register', authController.register);                    // 用户注册
router.post('/login', authController.login);                          // 用户名登录
router.post('/login/email', authController.loginByEmail);             // 邮箱登录
router.post('/refresh-token', authController.refreshToken);           // 刷新Token
router.post('/forgot-password', authController.forgotPassword);       // 忘记密码
router.post('/reset-password', authController.resetPassword);         // 重置密码

// 验证可用性（无需认证）
router.get('/check/username', authController.checkUsername);          // 检查用户名可用性
router.get('/check/email', authController.checkEmail);                // 检查邮箱可用性

// 需要认证的路由
router.post('/logout', optionalAuth, authController.logout);          // 用户登出（可选认证）
router.get('/me', verifyToken, authController.getCurrentUser);        // 获取当前用户信息
router.post('/change-password', verifyToken, authController.changePassword); // 修改密码

export default router;