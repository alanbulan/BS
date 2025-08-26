import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthService } from '../services/AuthService';
import { CreateUserData } from '../types';

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    this.authService = new AuthService();
  }

  /**
   * 用户注册
   */
  register = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['username', 'email', 'password']);
    if (validation) {
      return this.error(res, validation);
    }

    const { username, email, password, phone, location, avatar_url } = req.body;

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.error(res, '邮箱格式不正确');
    }

    // 验证密码强度
    if (password.length < 6) {
      return this.error(res, '密码长度至少6位');
    }

    // 验证用户名格式
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return this.error(res, '用户名只能包含字母、数字和下划线，长度3-20位');
    }

    const userData: CreateUserData = {
      username,
      email,
      password,
      phone,
      location,
      avatar_url,
      role: 'user' // 默认角色为普通用户
    };

    try {
      const result = await this.authService.register(userData);
      return this.created(res, result, '注册成功');
    } catch (error: any) {
      if (error.message.includes('用户名已存在')) {
        return this.error(res, '用户名已存在');
      }
      if (error.message.includes('邮箱已存在')) {
        return this.error(res, '邮箱已存在');
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 用户登录
   */
  login = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['username', 'password']);
    if (validation) {
      return this.error(res, validation);
    }

    const { username, password, rememberMe = false } = req.body;

    try {
      const result = await this.authService.login(username, password, rememberMe);
      
      // 记录登录日志

      
      return this.success(res, result, '登录成功');
    } catch (error: any) {
      // 记录登录失败日志

      
      if (error.message.includes('用户不存在')) {
        return this.error(res, '用户名或密码错误', 401);
      }
      if (error.message.includes('密码错误')) {
        return this.error(res, '用户名或密码错误', 401);
      }
      if (error.message.includes('账户已被禁用')) {
        return this.error(res, '账户已被禁用，请联系管理员', 403);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 邮箱登录
   */
  loginByEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['email', 'password']);
    if (validation) {
      return this.error(res, validation);
    }

    const { email, password, rememberMe = false } = req.body;

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.error(res, '邮箱格式不正确');
    }

    try {
      const result = await this.authService.loginByEmail(email, password, rememberMe);
      

      
      return this.success(res, result, '登录成功');
    } catch (error: any) {

      
      if (error.message.includes('用户不存在')) {
        return this.error(res, '邮箱或密码错误', 401);
      }
      if (error.message.includes('密码错误')) {
        return this.error(res, '邮箱或密码错误', 401);
      }
      if (error.message.includes('账户已被禁用')) {
        return this.error(res, '账户已被禁用，请联系管理员', 403);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 刷新Token
   */
  refreshToken = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['refreshToken']);
    if (validation) {
      return this.error(res, validation);
    }

    const { refreshToken } = req.body;

    try {
      const result = await this.authService.refreshToken(refreshToken);
      return this.success(res, result, 'Token刷新成功');
    } catch (error: any) {
      if (error.message.includes('无效的刷新令牌')) {
        return this.error(res, '无效的刷新令牌', 401);
      }
      if (error.message.includes('刷新令牌已过期')) {
        return this.error(res, '刷新令牌已过期，请重新登录', 401);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 用户登出
   */
  logout = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      
      // 记录登出日志
      if (req.user) {
  
      }
      
      return this.success(res, null, '登出成功');
    } catch (error: any) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取当前用户信息
   */
  getCurrentUser = this.asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return this.error(res, '未登录', 401);
    }

    try {
      const userInfo = await this.authService.getCurrentUser(req.user.id);
      return this.success(res, userInfo);
    } catch (error: any) {
      return this.serverError(res, error);
    }
  });

  /**
   * 修改密码
   */
  changePassword = this.asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return this.error(res, '未登录', 401);
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

    if (currentPassword === newPassword) {
      return this.error(res, '新密码不能与当前密码相同');
    }

    try {
      await this.authService.changePassword(req.user.id, currentPassword, newPassword);
      

      
      return this.success(res, null, '密码修改成功');
    } catch (error: any) {
      if (error.message.includes('当前密码不正确')) {
        return this.error(res, '当前密码不正确');
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 忘记密码 - 发送重置邮件
   */
  forgotPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['email']);
    if (validation) {
      return this.error(res, validation);
    }

    const { email } = req.body;

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.error(res, '邮箱格式不正确');
    }

    try {
      await this.authService.forgotPassword(email);
      
      // 为了安全，无论邮箱是否存在都返回成功消息
      return this.success(res, null, '如果该邮箱存在，重置密码邮件已发送');
    } catch (error: any) {
      return this.serverError(res, error);
    }
  });

  /**
   * 重置密码
   */
  resetPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['token', 'newPassword']);
    if (validation) {
      return this.error(res, validation);
    }

    const { token, newPassword } = req.body;

    // 验证新密码强度
    if (newPassword.length < 6) {
      return this.error(res, '新密码长度至少6位');
    }

    try {
      await this.authService.resetPassword(token, newPassword);
      return this.success(res, null, '密码重置成功');
    } catch (error: any) {
      if (error.message.includes('无效的重置令牌')) {
        return this.error(res, '无效的重置令牌', 400);
      }
      if (error.message.includes('重置令牌已过期')) {
        return this.error(res, '重置令牌已过期，请重新申请', 400);
      }
      return this.serverError(res, error);
    }
  });

  /**
   * 验证用户名是否可用
   */
  checkUsername = this.asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return this.error(res, '请提供用户名');
    }

    // 验证用户名格式
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return this.error(res, '用户名只能包含字母、数字和下划线，长度3-20位');
    }

    try {
      const isAvailable = await this.authService.checkUsernameAvailability(username);
      return this.success(res, { available: isAvailable });
    } catch (error: any) {
      return this.serverError(res, error);
    }
  });

  /**
   * 验证邮箱是否可用
   */
  checkEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return this.error(res, '请提供邮箱地址');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.error(res, '邮箱格式不正确');
    }

    try {
      const isAvailable = await this.authService.checkEmailAvailability(email);
      return this.success(res, { available: isAvailable });
    } catch (error: any) {
      return this.serverError(res, error);
    }
  });
}