import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/UserModel';
import { RefreshTokenModel } from '../models/RefreshTokenModel';
import { PasswordResetTokenModel, PasswordResetToken } from '../models/PasswordResetTokenModel';
import { CreateUserData, User } from '../types';
import { JWTPayload } from '../middleware/auth';

export interface LoginResult {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}



export class AuthService {
  private userModel: UserModel;
  private refreshTokenModel: RefreshTokenModel;
  private passwordResetTokenModel: PasswordResetTokenModel;
  private readonly ACCESS_TOKEN_EXPIRES = '24h';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly RESET_TOKEN_EXPIRES = '1h';

  constructor() {
    this.userModel = new UserModel();
    this.refreshTokenModel = new RefreshTokenModel();
    this.passwordResetTokenModel = new PasswordResetTokenModel();
  }

  /**
   * 用户注册
   */
  async register(userData: CreateUserData): Promise<LoginResult> {
    try {
      // 检查用户名是否已存在
      if (await this.userModel.usernameExists(userData.username)) {
        throw new Error('用户名已存在');
      }

      // 检查邮箱是否已存在
      if (await this.userModel.emailExists(userData.email)) {
        throw new Error('邮箱已存在');
      }

      // 创建用户
      const user = await this.userModel.createUser(userData);
      
      // 生成Token
      const { accessToken, refreshToken } = this.generateTokens(user);
      
      // 保存刷新Token
      await this.saveRefreshToken(user.id, refreshToken);

      // 更新最后登录时间
      await this.userModel.updateLastLogin(user.id);

      // 移除密码哈希
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiresIn(this.ACCESS_TOKEN_EXPIRES)
      };
    } catch (error) {

      throw error;
    }
  }

  /**
   * 用户名密码登录
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<LoginResult> {
    try {
      console.log('[Auth] Login attempt for username:', username);
      // 查找用户
      const user = await this.userModel.findByUsername(username);
      if (!user) {
        console.log('[Auth] User not found');
        throw new Error('用户不存在');
      }
      console.log('[Auth] User found:', user.id, user.username);
      console.log('[Auth] Password hash:', user.password_hash);

      // 检查账户状态
      if (!user.is_active) {
        console.log('[Auth] Account disabled');
        throw new Error('账户已被禁用');
      }

      // 验证密码
      console.log('[Auth] Validating password...');
      const isPasswordValid = await this.userModel.validatePassword(user, password);
      console.log('[Auth] Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 生成Token
      const tokenExpires = rememberMe ? '30d' : this.ACCESS_TOKEN_EXPIRES;
      const refreshExpires = rememberMe ? '90d' : this.REFRESH_TOKEN_EXPIRES;
      
      const { accessToken, refreshToken } = this.generateTokens(user, tokenExpires, refreshExpires);
      
      // 保存刷新Token
      await this.saveRefreshToken(user.id, refreshToken);

      // 更新最后登录时间
      await this.userModel.updateLastLogin(user.id);

      // 移除密码哈希
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiresIn(tokenExpires)
      };
    } catch (error) {

      throw error;
    }
  }

  /**
   * 邮箱密码登录
   */
  async loginByEmail(email: string, password: string, rememberMe: boolean = false): Promise<LoginResult> {
    try {
      // 查找用户
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查账户状态
      if (!user.is_active) {
        throw new Error('账户已被禁用');
      }

      // 验证密码
      const isPasswordValid = await this.userModel.validatePassword(user, password);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 生成Token
      const tokenExpires = rememberMe ? '30d' : this.ACCESS_TOKEN_EXPIRES;
      const refreshExpires = rememberMe ? '90d' : this.REFRESH_TOKEN_EXPIRES;
      
      const { accessToken, refreshToken } = this.generateTokens(user, tokenExpires, refreshExpires);
      
      // 保存刷新Token
      await this.saveRefreshToken(user.id, refreshToken);

      // 移除密码哈希
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiresIn(tokenExpires)
      };
    } catch (error) {

      throw error;
    }
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT刷新密钥未配置');
      }

      // 验证刷新Token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
      
      // 检查刷新Token是否存在于数据库中
      const isValidRefreshToken = await this.validateRefreshToken(decoded.id, refreshToken);
      if (!isValidRefreshToken) {
        throw new Error('无效的刷新令牌');
      }

      // 获取用户信息
      const user = await this.userModel.findById(decoded.id);
      if (!user || !user.is_active) {
        throw new Error('用户不存在或已被禁用');
      }

      // 生成新的Token
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
      
      // 删除旧的刷新Token并保存新的
      await this.revokeRefreshToken(decoded.id, refreshToken);
      await this.saveRefreshToken(user.id, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpiresIn(this.ACCESS_TOKEN_EXPIRES)
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('刷新令牌已过期');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的刷新令牌');
      }

      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        return;
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
      await this.revokeRefreshToken(decoded.id, refreshToken);
    } catch (error) {
      // 登出时忽略Token验证错误

    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: number): Promise<Omit<User, 'password_hash'>> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {

      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await this.userModel.validatePassword(user, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码不正确');
      }

      // 更新密码
      await this.userModel.updatePassword(userId, newPassword);
      
      // 撤销所有刷新Token，强制重新登录
      await this.revokeAllRefreshTokens(userId);
    } catch (error) {

      throw error;
    }
  }

  /**
   * 忘记密码
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        // 为了安全，不暴露用户是否存在
        return;
      }

      // 生成重置Token
      const resetToken = this.generateResetToken();
      
      // 保存重置Token到数据库
      await this.savePasswordResetToken(user.id, resetToken);

      // 发送重置邮件（这里需要实现邮件服务）
      await this.sendPasswordResetEmail(user.email, resetToken);
      

    } catch (error) {

      throw error;
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 验证重置Token
      const resetTokenRecord = await this.validatePasswordResetToken(token);
      if (!resetTokenRecord) {
        throw new Error('无效的重置令牌');
      }

      // 检查Token是否过期
      if (new Date() > resetTokenRecord.expires_at) {
        throw new Error('重置令牌已过期');
      }

      // 更新密码
      await this.userModel.updatePassword(resetTokenRecord.user_id, newPassword);
      
      // 标记重置Token为已使用
      await this.markPasswordResetTokenAsUsed(resetTokenRecord.id);
      
      // 撤销所有刷新Token
      await this.revokeAllRefreshTokens(resetTokenRecord.user_id);
      

    } catch (error) {

      throw error;
    }
  }

  /**
   * 检查用户名可用性
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      return !(await this.userModel.usernameExists(username));
    } catch (error) {

      throw error;
    }
  }

  /**
   * 检查邮箱可用性
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      return !(await this.userModel.emailExists(email));
    } catch (error) {

      throw error;
    }
  }

  /**
   * 生成访问Token和刷新Token
   */
  private generateTokens(
    user: User, 
    accessExpires: string = this.ACCESS_TOKEN_EXPIRES,
    refreshExpires: string = this.REFRESH_TOKEN_EXPIRES
  ): { accessToken: string; refreshToken: string } {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT密钥未配置');
    }

    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: accessExpires
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: refreshExpires
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * 生成密码重置Token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 获取Token过期时间（秒）
   */
  private getTokenExpiresIn(expires: string): number {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60; // 默认24小时

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  }

  /**
   * 保存刷新Token到数据库
   */
  private async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    try {
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.getTokenExpiresIn(this.REFRESH_TOKEN_EXPIRES) * 1000);
      
      // 限制用户Token数量
      await this.refreshTokenModel.limitUserTokens(userId, 5);
      
      // 保存新Token
      await this.refreshTokenModel.createRefreshToken(userId, refreshToken, expiresAt);
      

    } catch (error) {

      throw error;
    }
  }

  /**
   * 验证刷新Token
   */
  private async validateRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    try {
      const tokenRecord = await this.refreshTokenModel.findByUserAndToken(userId, refreshToken);
      return tokenRecord !== null;
    } catch (error) {

      return false;
    }
  }

  /**
   * 撤销刷新Token
   */
  private async revokeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    try {
      await this.refreshTokenModel.deleteToken(refreshToken);

    } catch (error) {

      throw error;
    }
  }

  /**
   * 撤销用户所有刷新Token
   */
  private async revokeAllRefreshTokens(userId: number): Promise<void> {
    try {
      const deletedCount = await this.refreshTokenModel.deleteAllUserTokens(userId);

    } catch (error) {

      throw error;
    }
  }

  /**
   * 保存密码重置Token
   */
  private async savePasswordResetToken(userId: number, token: string): Promise<void> {
    try {
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.getTokenExpiresIn(this.RESET_TOKEN_EXPIRES) * 1000);
      
      // 删除用户之前的重置Token
      await this.passwordResetTokenModel.deleteUserTokens(userId);
      
      // 保存新的重置Token
      await this.passwordResetTokenModel.createResetToken(userId, token, expiresAt);
      

    } catch (error) {

      throw error;
    }
  }

  /**
   * 验证密码重置Token
   */
  private async validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    try {
      return await this.passwordResetTokenModel.findByToken(token);
    } catch (error) {

      return null;
    }
  }

  /**
   * 标记密码重置Token为已使用
   */
  private async markPasswordResetTokenAsUsed(tokenId: number): Promise<void> {
    try {
      await this.passwordResetTokenModel.markAsUsed(tokenId);

    } catch (error) {

      throw error;
    }
  }

  /**
   * 发送密码重置邮件
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // 这里需要实现邮件发送服务
    // 暂时记录日志
    
    
    // 实际实现时，这里应该调用邮件服务
    // 邮件内容应该包含重置链接，例如：
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  }
}