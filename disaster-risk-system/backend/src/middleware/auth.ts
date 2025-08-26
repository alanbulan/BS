import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthMiddleware {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  /**
   * 验证JWT Token
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: '未授权访问'
        });
        return;
      }

      const token = authHeader.substring(7); // 移除 "Bearer " 前缀
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: '令牌格式无效'
        });
        return;
      }
      
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET 环境变量未设置');
        res.status(500).json({
          success: false,
          error: '服务器配置错误'
        });
        return;
      }

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      
      // 验证用户是否仍然存在且激活
      const user = await this.userModel.findById(decoded.id);
      if (!user || !user.is_active) {
        res.status(401).json({
          success: false,
          error: '用户不存在或已被禁用'
        });
        return;
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: '访问令牌已过期'
        });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: '无效的访问令牌'
        });
      } else {
        console.error('Token验证失败:', error);
        res.status(500).json({
          success: false,
          error: '服务器内部错误'
        });
      }
    }
  };

  /**
   * 可选的Token验证（用于可选登录的接口）
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 没有token，继续执行但不设置用户信息
        next();
        return;
      }

      const token = authHeader.substring(7);
      
      if (!process.env.JWT_SECRET) {
        next();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      const user = await this.userModel.findById(decoded.id);
      
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (error) {
      // 忽略token错误，继续执行
      next();
    }
  };

  /**
   * 角色权限验证
   */
  requireRole = (roles: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '需要登录'
        });
        return;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: '权限不足'
        });
        return;
      }

      next();
    };
  };

  /**
   * 管理员权限验证
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    this.requireRole(['admin'])(req, res, next);
  };

  /**
   * 专家或管理员权限验证
   */
  requireExpertOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    this.requireRole(['expert', 'admin'])(req, res, next);
  };

  /**
   * 验证用户是否为资源所有者或管理员
   */
  requireOwnerOrAdmin = (getUserIdFromParams: (req: Request) => number) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '需要登录'
        });
        return;
      }

      const resourceUserId = getUserIdFromParams(req);
      
      if (req.user.role === 'admin' || req.user.id === resourceUserId) {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: '只能访问自己的资源'
        });
      }
    };
  };
}

// 创建中间件实例
const authMiddleware = new AuthMiddleware();

// 导出中间件函数
export const verifyToken = authMiddleware.verifyToken;
export const optionalAuth = authMiddleware.optionalAuth;
export const requireRole = authMiddleware.requireRole;
export const requireAdmin = authMiddleware.requireAdmin;
export const requireExpertOrAdmin = authMiddleware.requireExpertOrAdmin;
export const requireOwnerOrAdmin = authMiddleware.requireOwnerOrAdmin;