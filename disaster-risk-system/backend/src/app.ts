import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/database';
import routes from './routes';

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));


// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 压缩响应 - 暂时注释掉，可以后续添加
// 如需启用压缩，请先安装: npm install compression @types/compression
// app.use(compression());

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// 注册路由
app.use(routes);

// 全局错误处理中间件
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误处理:', error);
  
  // 数据库连接错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: '数据库连接失败，请稍后重试'
    });
  }
  
  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message || '数据验证失败'
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '无效的访问令牌'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '访问令牌已过期'
    });
  }
  
  // 语法错误
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: '请求数据格式错误'
    });
  }
  
  // 默认服务器错误
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
  });
});

// 数据库连接测试
const initializeApp = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('数据库连接失败，应用启动中止');
      process.exit(1);
    }
  } catch (error) {
    console.error('应用初始化失败:', error);
    process.exit(1);
  }
};

// 优雅关闭处理
const gracefulShutdown = (signal: string) => {
  console.log(`收到 ${signal} 信号，开始优雅关闭...`);
  
  // 这里可以添加清理逻辑，如关闭数据库连接等
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 初始化应用
initializeApp();

// 启动定时任务
import { SchedulerService } from './services/SchedulerService';
const schedulerService = new SchedulerService();

// 在生产环境启动定时任务
if (process.env.NODE_ENV === 'production') {
  schedulerService.startAllTasks();
}

// 导出调度服务供其他模块使用
export { schedulerService };
export default app;