"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
app.use(routes_1.default);
app.use((error, req, res, next) => {
    console.error('全局错误处理:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
            success: false,
            error: '数据库连接失败，请稍后重试'
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: error.message || '数据验证失败'
        });
    }
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
    if (error instanceof SyntaxError && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: '请求数据格式错误'
        });
    }
    return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
    });
});
const initializeApp = async () => {
    try {
        const isConnected = await (0, database_1.testConnection)();
        if (!isConnected) {
            console.error('数据库连接失败，应用启动中止');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('应用初始化失败:', error);
        process.exit(1);
    }
};
const gracefulShutdown = (signal) => {
    console.log(`收到 ${signal} 信号，开始优雅关闭...`);
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});
initializeApp();
const SchedulerService_1 = require("./services/SchedulerService");
const schedulerService = new SchedulerService_1.SchedulerService();
exports.schedulerService = schedulerService;
if (process.env.NODE_ENV === 'production') {
    schedulerService.startAllTasks();
}
exports.default = app;
//# sourceMappingURL=app.js.map