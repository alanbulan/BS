import winston from 'winston';
import path from 'path';

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 文件日志格式（不包含颜色）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 传输器配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat
  }),
  
  // 所有日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileFormat
  })
];

// 创建日志器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports
});

// 开发环境下的额外配置
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 日志方法封装
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  }
};

// 数据库操作日志
export const dbLog = {
  query: (sql: string, params?: any[], duration?: number) => {
    logger.info(`DB Query: ${sql}`, { params, duration });
  },
  
  error: (error: Error, sql?: string, params?: any[]) => {
    logger.error(`DB Error: ${error.message}`, { sql, params, stack: error.stack });
  },
  
  transaction: (action: string, duration?: number) => {
    logger.info(`DB Transaction: ${action}`, { duration });
  }
};

// API请求日志
export const apiLog = {
  request: (method: string, url: string, ip: string, userAgent?: string) => {
    logger.http(`${method} ${url}`, { ip, userAgent });
  },
  
  response: (method: string, url: string, statusCode: number, duration: number) => {
    logger.http(`${method} ${url} - ${statusCode}`, { duration });
  },
  
  error: (method: string, url: string, error: Error, statusCode?: number) => {
    logger.error(`${method} ${url} - Error: ${error.message}`, { 
      statusCode, 
      stack: error.stack 
    });
  }
};

// 业务日志
export const businessLog = {
  userAction: (userId: number, action: string, details?: any) => {
    logger.info(`User Action: ${action}`, { userId, details });
  },
  
  systemEvent: (event: string, details?: any) => {
    logger.info(`System Event: ${event}`, details);
  },
  
  securityEvent: (event: string, ip: string, details?: any) => {
    logger.warn(`Security Event: ${event}`, { ip, details });
  },
  
  performanceMetric: (metric: string, value: number, unit: string) => {
    logger.info(`Performance: ${metric} = ${value}${unit}`);
  }
};

// 错误日志格式化
export const formatError = (error: Error): string => {
  return `${error.name}: ${error.message}\nStack: ${error.stack}`;
};

// 创建子日志器
export const createChildLogger = (service: string) => {
  return {
    error: (message: string, meta?: any) => {
      logger.error(`[${service}] ${message}`, meta);
    },
    warn: (message: string, meta?: any) => {
      logger.warn(`[${service}] ${message}`, meta);
    },
    info: (message: string, meta?: any) => {
      logger.info(`[${service}] ${message}`, meta);
    },
    debug: (message: string, meta?: any) => {
      logger.debug(`[${service}] ${message}`, meta);
    }
  };
};

export default logger;