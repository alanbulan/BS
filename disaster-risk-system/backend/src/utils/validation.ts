import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { validationErrorResponse } from './response';

// 验证中间件
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      validationErrorResponse(res, errors);
      return;
    }
    
    next();
  };
};

// 查询参数验证中间件
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      validationErrorResponse(res, errors);
      return;
    }
    
    next();
  };
};

// 路径参数验证中间件
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      validationErrorResponse(res, errors);
      return;
    }
    
    next();
  };
};

// 常用验证规则
export const commonValidations = {
  // ID验证
  id: Joi.number().integer().positive().required(),
  
  // 分页验证
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  },
  
  // 坐标验证
  coordinates: {
    longitude: Joi.number().min(-180).max(180).required(),
    latitude: Joi.number().min(-90).max(90).required()
  },
  
  // 时间范围验证
  timeRange: {
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
  },
  
  // 风险等级验证
  riskLevel: Joi.number().integer().min(1).max(5),
  
  // 用户名验证
  username: Joi.string().alphanum().min(3).max(30).required(),
  
  // 邮箱验证
  email: Joi.string().email().required(),
  
  // 密码验证
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]')).required()
    .messages({
      'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'
    }),
  
  // 手机号验证
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).messages({
    'string.pattern.base': '请输入有效的手机号码'
  }),
  
  // 几何数据验证
  geometry: Joi.object({
    type: Joi.string().valid('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon').required(),
    coordinates: Joi.array().required()
  }),
  
  // 文件验证
  file: {
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'application/pdf'),
    size: Joi.number().max(10 * 1024 * 1024) // 10MB
  }
};

// 验证坐标是否在中国境内
export const validateChinaCoordinates = (longitude: number, latitude: number): boolean => {
  // 中国大陆边界范围（简化）
  const chinaBounds = {
    minLng: 73.66,
    maxLng: 135.05,
    minLat: 3.86,
    maxLat: 53.55
  };
  
  return longitude >= chinaBounds.minLng && longitude <= chinaBounds.maxLng &&
         latitude >= chinaBounds.minLat && latitude <= chinaBounds.maxLat;
};

// 验证几何数据格式
export const validateGeometry = (geometry: any): boolean => {
  if (!geometry || typeof geometry !== 'object') {
    return false;
  }
  
  const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
  
  if (!validTypes.includes(geometry.type)) {
    return false;
  }
  
  if (!Array.isArray(geometry.coordinates)) {
    return false;
  }
  
  return true;
};

// 清理和标准化输入数据
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};