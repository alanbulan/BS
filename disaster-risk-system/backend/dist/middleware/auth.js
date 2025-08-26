"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnerOrAdmin = exports.requireExpertOrAdmin = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.verifyToken = exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserModel_1 = require("../models/UserModel");
class AuthMiddleware {
    constructor() {
        this.verifyToken = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({
                        success: false,
                        error: '未授权访问'
                    });
                    return;
                }
                const token = authHeader.substring(7);
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
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await this.userModel.findById(decoded.id);
                if (!user || !user.is_active) {
                    res.status(401).json({
                        success: false,
                        error: '用户不存在或已被禁用'
                    });
                    return;
                }
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                };
                next();
            }
            catch (error) {
                if (error.name === 'TokenExpiredError') {
                    res.status(401).json({
                        success: false,
                        error: '访问令牌已过期'
                    });
                }
                else if (error.name === 'JsonWebTokenError') {
                    res.status(401).json({
                        success: false,
                        error: '无效的访问令牌'
                    });
                }
                else {
                    console.error('Token验证失败:', error);
                    res.status(500).json({
                        success: false,
                        error: '服务器内部错误'
                    });
                }
            }
        };
        this.optionalAuth = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    next();
                    return;
                }
                const token = authHeader.substring(7);
                if (!process.env.JWT_SECRET) {
                    next();
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
            }
            catch (error) {
                next();
            }
        };
        this.requireRole = (roles) => {
            return (req, res, next) => {
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
        this.requireAdmin = (req, res, next) => {
            this.requireRole(['admin'])(req, res, next);
        };
        this.requireExpertOrAdmin = (req, res, next) => {
            this.requireRole(['expert', 'admin'])(req, res, next);
        };
        this.requireOwnerOrAdmin = (getUserIdFromParams) => {
            return (req, res, next) => {
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
                }
                else {
                    res.status(403).json({
                        success: false,
                        error: '只能访问自己的资源'
                    });
                }
            };
        };
        this.userModel = new UserModel_1.UserModel();
    }
}
exports.AuthMiddleware = AuthMiddleware;
const authMiddleware = new AuthMiddleware();
exports.verifyToken = authMiddleware.verifyToken;
exports.optionalAuth = authMiddleware.optionalAuth;
exports.requireRole = authMiddleware.requireRole;
exports.requireAdmin = authMiddleware.requireAdmin;
exports.requireExpertOrAdmin = authMiddleware.requireExpertOrAdmin;
exports.requireOwnerOrAdmin = authMiddleware.requireOwnerOrAdmin;
//# sourceMappingURL=auth.js.map