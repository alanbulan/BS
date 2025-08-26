"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetTokenModel = void 0;
const BaseModel_1 = require("./BaseModel");
class PasswordResetTokenModel extends BaseModel_1.BaseModel {
    constructor() {
        super('password_reset_tokens');
    }
    async createResetToken(userId, token, expiresAt) {
        const sql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [userId, token, expiresAt]);
        return result.rows[0];
    }
    async findByToken(token) {
        const sql = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND used = false AND expires_at > NOW()
    `;
        const result = await this.executeQuery(sql, [token]);
        return result.rows[0] || null;
    }
    async markAsUsed(tokenId) {
        const sql = `
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE id = $1
    `;
        const result = await this.executeQuery(sql, [tokenId]);
        return (result.rowCount || 0) > 0;
    }
    async deleteUserTokens(userId) {
        const sql = 'DELETE FROM password_reset_tokens WHERE user_id = $1';
        const result = await this.executeQuery(sql, [userId]);
        return result.rowCount || 0;
    }
    async deleteExpiredTokens() {
        const sql = 'DELETE FROM password_reset_tokens WHERE expires_at <= NOW()';
        const result = await this.executeQuery(sql);
        return result.rowCount || 0;
    }
    async getUserActiveTokenCount(userId) {
        const sql = `
      SELECT COUNT(*) as count 
      FROM password_reset_tokens 
      WHERE user_id = $1 AND used = false AND expires_at > NOW()
    `;
        const result = await this.executeQuery(sql, [userId]);
        return parseInt(result.rows[0].count);
    }
}
exports.PasswordResetTokenModel = PasswordResetTokenModel;
//# sourceMappingURL=PasswordResetTokenModel.js.map