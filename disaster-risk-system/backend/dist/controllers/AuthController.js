"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const BaseController_1 = require("./BaseController");
const AuthService_1 = require("../services/AuthService");
class AuthController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.register = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['username', 'email', 'password']);
            if (validation) {
                return this.error(res, validation);
            }
            const { username, email, password, phone, location, avatar_url } = req.body;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return this.error(res, '邮箱格式不正确');
            }
            if (password.length < 6) {
                return this.error(res, '密码长度至少6位');
            }
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return this.error(res, '用户名只能包含字母、数字和下划线，长度3-20位');
            }
            const userData = {
                username,
                email,
                password,
                phone,
                location,
                avatar_url,
                role: 'user'
            };
            try {
                const result = await this.authService.register(userData);
                return this.created(res, result, '注册成功');
            }
            catch (error) {
                if (error.message.includes('用户名已存在')) {
                    return this.error(res, '用户名已存在');
                }
                if (error.message.includes('邮箱已存在')) {
                    return this.error(res, '邮箱已存在');
                }
                return this.serverError(res, error);
            }
        });
        this.login = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['username', 'password']);
            if (validation) {
                return this.error(res, validation);
            }
            const { username, password, rememberMe = false } = req.body;
            try {
                const result = await this.authService.login(username, password, rememberMe);
                return this.success(res, result, '登录成功');
            }
            catch (error) {
                if (error.message.includes('用户不存在')) {
                    return this.error(res, '用户名或密码错误', 401);
                }
                if (error.message.includes('密码错误')) {
                    return this.error(res, '用户名或密码错误', 401);
                }
                if (error.message.includes('账户已被禁用')) {
                    return this.error(res, '账户已被禁用，请联系管理员', 403);
                }
                return this.serverError(res, error);
            }
        });
        this.loginByEmail = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['email', 'password']);
            if (validation) {
                return this.error(res, validation);
            }
            const { email, password, rememberMe = false } = req.body;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return this.error(res, '邮箱格式不正确');
            }
            try {
                const result = await this.authService.loginByEmail(email, password, rememberMe);
                return this.success(res, result, '登录成功');
            }
            catch (error) {
                if (error.message.includes('用户不存在')) {
                    return this.error(res, '邮箱或密码错误', 401);
                }
                if (error.message.includes('密码错误')) {
                    return this.error(res, '邮箱或密码错误', 401);
                }
                if (error.message.includes('账户已被禁用')) {
                    return this.error(res, '账户已被禁用，请联系管理员', 403);
                }
                return this.serverError(res, error);
            }
        });
        this.refreshToken = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['refreshToken']);
            if (validation) {
                return this.error(res, validation);
            }
            const { refreshToken } = req.body;
            try {
                const result = await this.authService.refreshToken(refreshToken);
                return this.success(res, result, 'Token刷新成功');
            }
            catch (error) {
                if (error.message.includes('无效的刷新令牌')) {
                    return this.error(res, '无效的刷新令牌', 401);
                }
                if (error.message.includes('刷新令牌已过期')) {
                    return this.error(res, '刷新令牌已过期，请重新登录', 401);
                }
                return this.serverError(res, error);
            }
        });
        this.logout = this.asyncHandler(async (req, res) => {
            const { refreshToken } = req.body;
            try {
                if (refreshToken) {
                    await this.authService.logout(refreshToken);
                }
                if (req.user) {
                }
                return this.success(res, null, '登出成功');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.getCurrentUser = this.asyncHandler(async (req, res) => {
            if (!req.user) {
                return this.error(res, '未登录', 401);
            }
            try {
                const userInfo = await this.authService.getCurrentUser(req.user.id);
                return this.success(res, userInfo);
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.changePassword = this.asyncHandler(async (req, res) => {
            if (!req.user) {
                return this.error(res, '未登录', 401);
            }
            const validation = this.validateRequired(req.body, ['currentPassword', 'newPassword']);
            if (validation) {
                return this.error(res, validation);
            }
            const { currentPassword, newPassword } = req.body;
            if (newPassword.length < 6) {
                return this.error(res, '新密码长度至少6位');
            }
            if (currentPassword === newPassword) {
                return this.error(res, '新密码不能与当前密码相同');
            }
            try {
                await this.authService.changePassword(req.user.id, currentPassword, newPassword);
                return this.success(res, null, '密码修改成功');
            }
            catch (error) {
                if (error.message.includes('当前密码不正确')) {
                    return this.error(res, '当前密码不正确');
                }
                return this.serverError(res, error);
            }
        });
        this.forgotPassword = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['email']);
            if (validation) {
                return this.error(res, validation);
            }
            const { email } = req.body;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return this.error(res, '邮箱格式不正确');
            }
            try {
                await this.authService.forgotPassword(email);
                return this.success(res, null, '如果该邮箱存在，重置密码邮件已发送');
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.resetPassword = this.asyncHandler(async (req, res) => {
            const validation = this.validateRequired(req.body, ['token', 'newPassword']);
            if (validation) {
                return this.error(res, validation);
            }
            const { token, newPassword } = req.body;
            if (newPassword.length < 6) {
                return this.error(res, '新密码长度至少6位');
            }
            try {
                await this.authService.resetPassword(token, newPassword);
                return this.success(res, null, '密码重置成功');
            }
            catch (error) {
                if (error.message.includes('无效的重置令牌')) {
                    return this.error(res, '无效的重置令牌', 400);
                }
                if (error.message.includes('重置令牌已过期')) {
                    return this.error(res, '重置令牌已过期，请重新申请', 400);
                }
                return this.serverError(res, error);
            }
        });
        this.checkUsername = this.asyncHandler(async (req, res) => {
            const { username } = req.query;
            if (!username || typeof username !== 'string') {
                return this.error(res, '请提供用户名');
            }
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return this.error(res, '用户名只能包含字母、数字和下划线，长度3-20位');
            }
            try {
                const isAvailable = await this.authService.checkUsernameAvailability(username);
                return this.success(res, { available: isAvailable });
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.checkEmail = this.asyncHandler(async (req, res) => {
            const { email } = req.query;
            if (!email || typeof email !== 'string') {
                return this.error(res, '请提供邮箱地址');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return this.error(res, '邮箱格式不正确');
            }
            try {
                const isAvailable = await this.authService.checkEmailAvailability(email);
                return this.success(res, { available: isAvailable });
            }
            catch (error) {
                return this.serverError(res, error);
            }
        });
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map