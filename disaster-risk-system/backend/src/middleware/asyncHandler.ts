import { Request, Response, NextFunction } from 'express';

/**
 * 异步处理器包装函数
 * 用于包装异步路由处理函数，自动捕获异常并传递给错误处理中间件
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};