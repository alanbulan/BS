import { Response } from 'express';

// 标准响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 成功响应
export const successResponse = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

// 错误响应
export const errorResponse = (
  res: Response,
  error: string,
  statusCode: number = 400,
  data?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

// 分页响应
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit);
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
  return res.status(200).json(response);
};

// 创建响应
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = '创建成功'
): Response => {
  return successResponse(res, data, message, 201);
};

// 无内容响应
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

// 未找到响应
export const notFoundResponse = (
  res: Response,
  message: string = '资源未找到'
): Response => {
  return errorResponse(res, message, 404);
};

// 未授权响应
export const unauthorizedResponse = (
  res: Response,
  message: string = '未授权访问'
): Response => {
  return errorResponse(res, message, 401);
};

// 禁止访问响应
export const forbiddenResponse = (
  res: Response,
  message: string = '禁止访问'
): Response => {
  return errorResponse(res, message, 403);
};

// 服务器错误响应
export const serverErrorResponse = (
  res: Response,
  message: string = '服务器内部错误'
): Response => {
  return errorResponse(res, message, 500);
};

// 验证错误响应
export const validationErrorResponse = (
  res: Response,
  errors: any,
  message: string = '数据验证失败'
): Response => {
  return errorResponse(res, message, 422, errors);
};