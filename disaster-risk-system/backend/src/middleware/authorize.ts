import { Request, Response, NextFunction } from 'express';

/**
 * 权限验证中间件
 * @param requiredRoles 需要的角色数组
 */
export const authorize = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '用户未认证'
        });
        return;
      }

      // 检查用户角色是否满足要求
      if (!requiredRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: '权限不足'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('权限验证失败:', error);
      res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };
};

/**
 * 管理员权限验证
 */
export const requireAdmin = authorize(['admin']);

/**
 * 专家或管理员权限验证
 */
export const requireExpertOrAdmin = authorize(['expert', 'admin']);

/**
 * 用户、专家或管理员权限验证
 */
export const requireUser = authorize(['user', 'expert', 'admin']);