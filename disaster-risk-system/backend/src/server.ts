import app from './app';
import dotenv from 'dotenv';
import redisConfig from './config/redis';

// 加载环境变量
dotenv.config();

// 初始化Redis连接
async function initializeRedis() {
  try {
    await redisConfig.connect();
    console.log('✅ Redis连接成功');
  } catch (error) {
    console.warn('⚠️ Redis连接失败，缓存功能将不可用:', error);
  }
}

// 启动Redis连接
initializeRedis();

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
🚀 地质灾害风险评估系统后端服务已启动
📍 服务地址: http://${HOST}:${PORT}
🌍 环境: ${process.env.NODE_ENV || 'development'}
📊 健康检查: http://${HOST}:${PORT}/health
📚 API文档: http://${HOST}:${PORT}/api/v1
⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}
  `);
});

// 服务器错误处理
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} 需要提升权限`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} 已被占用`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    // 关闭HTTP服务器
    server.close(() => {
      console.log('HTTP服务器已关闭');
    });
    
    // 断开Redis连接
    await redisConfig.disconnect();
    console.log('Redis连接已断开');
    
    process.exit(0);
  } catch (error) {
    console.error('优雅关闭过程中出现错误:', error);
    process.exit(1);
  }
}

export default server;