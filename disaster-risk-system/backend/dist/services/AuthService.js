"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const UserModel_1 = require("../models/UserModel");
const RefreshTokenModel_1 = require("../models/RefreshTokenModel");
const PasswordResetTokenModel_1 = require("../models/PasswordResetTokenModel");
class AuthService {
    constructor() {
        this.ACCESS_TOKEN_EXPIRES = '24h';
        this.REFRESH_TOKEN_EXPIRES = '7d';
        this.RESET_TOKEN_EXPIRES = '1h';
        this.userModel = new UserModel_1.UserModel();
        this.refreshTokenModel = new RefreshTokenModel_1.RefreshTokenModel();
        this.passwordResetTokenModel = new PasswordResetTokenModel_1.PasswordResetTokenModel();
    }
    async register(userData) {
        try {
            if (await this.userModel.usernameExists(userData.username)) {
                throw new Error('用户名已存在');
            }
            if (await this.userModel.emailExists(userData.email)) {
                throw new Error('邮箱已存在');
            }
            const user = await this.userModel.createUser(userData);
            const { accessToken, refreshToken } = this.generateTokens(user);
            await this.saveRefreshToken(user.id, refreshToken);
            await this.userModel.updateLastLogin(user.id);
            const { password_hash, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                expiresIn: this.getTokenExpiresIn(this.ACCESS_TOKEN_EXPIRES)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async login(username, password, rememberMe = false) {
        try {
            const user = await this.userModel.findByUsername(username);
            if (!user) {
                throw new Error('用户不存在');
            }
            if (!user.is_active) {
                throw new Error('账户已被禁用');
            }
            const isPasswordValid = await this.userModel.validatePassword(user, password);
            if (!isPasswordValid) {
                throw new Error('密码错误');
            }
            const tokenExpires = rememberMe ? '30d' : this.ACCESS_TOKEN_EXPIRES;
            const refreshExpires = rememberMe ? '90d' : this.REFRESH_TOKEN_EXPIRES;
            const { accessToken, refreshToken } = this.generateTokens(user, tokenExpires, refreshExpires);
            await this.saveRefreshToken(user.id, refreshToken);
            await this.userModel.updateLastLogin(user.id);
            const { password_hash, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                expiresIn: this.getTokenExpiresIn(tokenExpires)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async loginByEmail(email, password, rememberMe = false) {
        try {
            const user = await this.userModel.findByEmail(email);
            if (!user) {
                throw new Error('用户不存在');
            }
            if (!user.is_active) {
                throw new Error('账户已被禁用');
            }
            const isPasswordValid = await this.userModel.validatePassword(user, password);
            if (!isPasswordValid) {
                throw new Error('密码错误');
            }
            const tokenExpires = rememberMe ? '30d' : this.ACCESS_TOKEN_EXPIRES;
            const refreshExpires = rememberMe ? '90d' : this.REFRESH_TOKEN_EXPIRES;
            const { accessToken, refreshToken } = this.generateTokens(user, tokenExpires, refreshExpires);
            await this.saveRefreshToken(user.id, refreshToken);
            const { password_hash, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                expiresIn: this.getTokenExpiresIn(tokenExpires)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async refreshToken(refreshToken) {
        try {
            if (!process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT刷新密钥未配置');
            }
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const isValidRefreshToken = await this.validateRefreshToken(decoded.id, refreshToken);
            if (!isValidRefreshToken) {
                throw new Error('无效的刷新令牌');
            }
            const user = await this.userModel.findById(decoded.id);
            if (!user || !user.is_active) {
                throw new Error('用户不存在或已被禁用');
            }
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
            await this.revokeRefreshToken(decoded.id, refreshToken);
            await this.saveRefreshToken(user.id, newRefreshToken);
            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: this.getTokenExpiresIn(this.ACCESS_TOKEN_EXPIRES)
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('刷新令牌已过期');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('无效的刷新令牌');
            }
            throw error;
        }
    }
    async logout(refreshToken) {
        try {
            if (!process.env.JWT_REFRESH_SECRET) {
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await this.revokeRefreshToken(decoded.id, refreshToken);
        }
        catch (error) {
        }
    }
    async getCurrentUser(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }
            const isCurrentPasswordValid = await this.userModel.validatePassword(user, currentPassword);
            if (!isCurrentPasswordValid) {
                throw new Error('当前密码不正确');
            }
            await this.userModel.updatePassword(userId, newPassword);
            await this.revokeAllRefreshTokens(userId);
        }
        catch (error) {
            throw error;
        }
    }
    async forgotPassword(email) {
        try {
            const user = await this.userModel.findByEmail(email);
            if (!user) {
                return;
            }
            const resetToken = this.generateResetToken();
            await this.savePasswordResetToken(user.id, resetToken);
            await this.sendPasswordResetEmail(user.email, resetToken);
        }
        catch (error) {
            throw error;
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const resetTokenRecord = await this.validatePasswordResetToken(token);
            if (!resetTokenRecord) {
                throw new Error('无效的重置令牌');
            }
            if (new Date() > resetTokenRecord.expires_at) {
                throw new Error('重置令牌已过期');
            }
            await this.userModel.updatePassword(resetTokenRecord.user_id, newPassword);
            await this.markPasswordResetTokenAsUsed(resetTokenRecord.id);
            await this.revokeAllRefreshTokens(resetTokenRecord.user_id);
        }
        catch (error) {
            throw error;
        }
    }
    async checkUsernameAvailability(username) {
        try {
            return !(await this.userModel.usernameExists(username));
        }
        catch (error) {
            throw error;
        }
    }
    async checkEmailAvailability(email) {
        try {
            return !(await this.userModel.emailExists(email));
        }
        catch (error) {
            throw error;
        }
    }
    generateTokens(user, accessExpires = this.ACCESS_TOKEN_EXPIRES, refreshExpires = this.REFRESH_TOKEN_EXPIRES) {
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT密钥未配置');
        }
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
            expiresIn: accessExpires
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: refreshExpires
        });
        return { accessToken, refreshToken };
    }
    generateResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    getTokenExpiresIn(expires) {
        const match = expires.match(/^(\d+)([smhd])$/);
        if (!match)
            return 24 * 60 * 60;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 24 * 60 * 60;
        }
    }
    async saveRefreshToken(userId, refreshToken) {
        try {
            const expiresAt = new Date();
            expiresAt.setTime(expiresAt.getTime() + this.getTokenExpiresIn(this.REFRESH_TOKEN_EXPIRES) * 1000);
            await this.refreshTokenModel.limitUserTokens(userId, 5);
            await this.refreshTokenModel.createRefreshToken(userId, refreshToken, expiresAt);
        }
        catch (error) {
            throw error;
        }
    }
    async validateRefreshToken(userId, refreshToken) {
        try {
            const tokenRecord = await this.refreshTokenModel.findByUserAndToken(userId, refreshToken);
            return tokenRecord !== null;
        }
        catch (error) {
            return false;
        }
    }
    async revokeRefreshToken(userId, refreshToken) {
        try {
            await this.refreshTokenModel.deleteToken(refreshToken);
        }
        catch (error) {
            throw error;
        }
    }
    async revokeAllRefreshTokens(userId) {
        try {
            const deletedCount = await this.refreshTokenModel.deleteAllUserTokens(userId);
        }
        catch (error) {
            throw error;
        }
    }
    async savePasswordResetToken(userId, token) {
        try {
            const expiresAt = new Date();
            expiresAt.setTime(expiresAt.getTime() + this.getTokenExpiresIn(this.RESET_TOKEN_EXPIRES) * 1000);
            await this.passwordResetTokenModel.deleteUserTokens(userId);
            await this.passwordResetTokenModel.createResetToken(userId, token, expiresAt);
        }
        catch (error) {
            throw error;
        }
    }
    async validatePasswordResetToken(token) {
        try {
            return await this.passwordResetTokenModel.findByToken(token);
        }
        catch (error) {
            return null;
        }
    }
    async markPasswordResetTokenAsUsed(tokenId) {
        try {
            await this.passwordResetTokenModel.markAsUsed(tokenId);
        }
        catch (error) {
            throw error;
        }
    }
    async sendPasswordResetEmail(email, token) {
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map