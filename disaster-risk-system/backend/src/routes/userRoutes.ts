import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { verifyToken, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// 用户管理路由

// 需要管理员权限的路由
router.post('/', verifyToken, requireAdmin, userController.createUser);                    // 创建用户（管理员）
router.get('/', verifyToken, requireAdmin, userController.getUsers);                       // 获取用户列表（管理员）
router.get('/stats', verifyToken, requireAdmin, userController.getUserStats);              // 获取用户统计信息（管理员）
router.patch('/:id/status', verifyToken, requireAdmin, userController.toggleUserStatus);   // 激活/停用用户（管理员）
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);               // 删除用户（管理员）

// 需要登录的路由
router.get('/search', verifyToken, userController.searchUsers);              // 搜索用户
router.get('/nearby', verifyToken, userController.getNearbyUsers);           // 获取附近用户

// 需要本人或管理员权限的路由
router.get('/:id', verifyToken, requireOwnerOrAdmin((req) => parseInt(req.params.id)), userController.getUserById);                 // 根据ID获取用户
router.put('/:id', verifyToken, requireOwnerOrAdmin((req) => parseInt(req.params.id)), userController.updateUser);                  // 更新用户信息
router.patch('/:id/password', verifyToken, requireOwnerOrAdmin((req) => parseInt(req.params.id)), userController.updatePassword);   // 更新用户密码
router.patch('/:id/location', verifyToken, requireOwnerOrAdmin((req) => parseInt(req.params.id)), userController.updateLocation);   // 更新用户位置

export default router;