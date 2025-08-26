"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireExpertOrAdmin = exports.requireAdmin = exports.authorize = void 0;
const authorize = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: '用户未认证'
                });
                return;
            }
            if (!requiredRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    error: '权限不足'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('权限验证失败:', error);
            res.status(500).json({
                success: false,
                error: '权限验证失败'
            });
        }
    };
};
exports.authorize = authorize;
exports.requireAdmin = (0, exports.authorize)(['admin']);
exports.requireExpertOrAdmin = (0, exports.authorize)(['expert', 'admin']);
exports.requireUser = (0, exports.authorize)(['user', 'expert', 'admin']);
//# sourceMappingURL=authorize.js.map