import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserModel } from '../models/UserModel';
import { CreateUserData, UpdateUserData, Point } from '../types';

export class UserController extends BaseController {
  private userModel: UserModel;

  constructor() {
    super();
    this.userModel = new UserModel();
  }

  // 创建用户
  createUser = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['username', 'email', 'password']);
    if (validation) {
      return this.error(res, validation);
    }

    const { username, email, password, phone, full_name, department, position, location, avatar_url, permissions, role } = req.body;

    // 检查用户名是否已存在
    if (await this.userModel.usernameExists(username)) {
      return this.error(res, '用户名已存在');
    }

    // 检查邮箱是否已存在
    if (await this.userModel.emailExists(email)) {
      return this.error(res, '邮箱已存在');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.error(res, '邮箱格式不正确');
    }

    // 验证密码强度
    if (password.length < 6) {
      return this.error(res, '密码长度至少6位');
    }

    const userData: CreateUserData = {
      username,
      email,
      password,
      phone,
      full_name,
      department,
      position,
      location,
      avatar_url,
      permissions,
      role: role || 'user'
    };

    try {
      const user = await this.userModel.createUser(userData);
      // 不返回密码哈希
      const { password_hash, ...userResponse } = user;
      return this.created(res, userResponse, '用户创建成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取用户列表
  getUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req);

    try {
      const result = await this.userModel.paginate(page, limit);
      
      // 移除密码字段
       const usersWithoutPassword = result.data.map(user => {
         const { password_hash, ...userWithoutPassword } = user;
         
         return userWithoutPassword;
       });
       return this.paginated(res, usersWithoutPassword, result.pagination);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 根据ID获取用户
  getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        return this.notFound(res, '用户不存在');
      }

      // 不返回密码哈希
      const { password_hash, ...userResponse } = user;
      return this.success(res, userResponse);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 更新用户信息
  updateUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    const { username, email, phone, full_name, department, position, location, avatar_url, permissions, is_active, role } = req.body;

    // 检查用户是否存在
    const existingUser = await this.userModel.findById(userId);
    if (!existingUser) {
      return this.notFound(res, '用户不存在');
    }

    // 检查用户名是否已被其他用户使用
    if (username && await this.userModel.usernameExists(username, userId)) {
      return this.error(res, '用户名已被其他用户使用');
    }

    // 检查邮箱是否已被其他用户使用
    if (email && await this.userModel.emailExists(email, userId)) {
      return this.error(res, '邮箱已被其他用户使用');
    }

    // 验证邮箱格式
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return this.error(res, '邮箱格式不正确');
      }
    }

    const updateData: UpdateUserData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (location) updateData.location = location;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role) updateData.role = role;

    try {
      const updatedUser = await this.userModel.updateUser(userId, updateData);
      if (!updatedUser) {
        return this.error(res, '更新失败');
      }

      // 不返回密码哈希
      const { password_hash, ...userResponse } = updatedUser;
      return this.success(res, userResponse, '用户信息更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 更新用户密码
  updatePassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    const validation = this.validateRequired(req.body, ['currentPassword', 'newPassword']);
    if (validation) {
      return this.error(res, validation);
    }

    const { currentPassword, newPassword } = req.body;

    // 验证新密码强度
    if (newPassword.length < 6) {
      return this.error(res, '新密码长度至少6位');
    }

    try {
      // 检查用户是否存在
      const user = await this.userModel.findById(userId);
      if (!user) {
        return this.notFound(res, '用户不存在');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await this.userModel.validatePassword(user, currentPassword);
      if (!isCurrentPasswordValid) {
        return this.error(res, '当前密码不正确');
      }

      // 更新密码
      const success = await this.userModel.updatePassword(userId, newPassword);
      if (!success) {
        return this.error(res, '密码更新失败');
      }

      return this.success(res, null, '密码更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 更新用户位置
  updateLocation = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    const validation = this.validateRequired(req.body, ['location']);
    if (validation) {
      return this.error(res, validation);
    }

    const { location } = req.body as { location: Point };

    // 验证坐标格式
    if (!location.coordinates || location.coordinates.length !== 2) {
      return this.error(res, '位置坐标格式不正确');
    }

    const [longitude, latitude] = location.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return this.error(res, '位置坐标超出有效范围');
    }

    try {
      const updatedUser = await this.userModel.updateLocation(userId, location);
      if (!updatedUser) {
        return this.notFound(res, '用户不存在');
      }

      // 不返回密码哈希
      const { password_hash, ...userResponse } = updatedUser;
      return this.success(res, userResponse, '位置更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取附近的用户
  getNearbyUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['longitude', 'latitude']);
    if (validation) {
      return this.error(res, validation);
    }

    const { longitude, latitude, radius = 10 } = req.query;
    const radiusKm = Math.min(100, Math.max(1, parseInt(radius as string) || 10));

    const location: Point = {
      type: 'Point',
      coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
    };

    // 验证坐标
    if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return this.error(res, '坐标格式不正确');
    }

    try {
      const users = await this.userModel.findNearbyUsers(location, radiusKm);
      
      // 移除密码哈希
      const usersResponse = users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return this.success(res, usersResponse);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 搜索用户
  searchUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return this.error(res, '请提供搜索关键词');
    }

    const searchLimit = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    try {
      const users = await this.userModel.searchUsers(query, searchLimit);
      
      // 移除密码哈希
      const usersResponse = users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return this.success(res, usersResponse);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 获取用户统计信息
  getUserStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await this.userModel.getUserStats();
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 删除用户（软删除）
  deleteUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    try {
      const success = await this.userModel.deleteUser(userId);
      if (!success) {
        return this.notFound(res, '用户不存在');
      }

      return this.success(res, null, '用户删除成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  // 激活/停用用户
  toggleUserStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return this.error(res, '无效的用户ID');
    }

    const validation = this.validateRequired(req.body, ['is_active']);
    if (validation) {
      return this.error(res, validation);
    }

    const { is_active } = req.body;

    try {
      const updatedUser = await this.userModel.toggleUserStatus(userId, is_active);
      if (!updatedUser) {
        return this.notFound(res, '用户不存在');
      }

      // 不返回密码哈希
      const { password_hash, ...userResponse } = updatedUser;
      return this.success(res, userResponse, `用户${is_active ? '激活' : '停用'}成功`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });
}