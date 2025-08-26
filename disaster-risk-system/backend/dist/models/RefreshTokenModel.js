"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
const BaseModel_1 = require("./BaseModel");
class RefreshTokenModel extends BaseModel_1.BaseModel {
    constructor() {
        super('refresh_tokens');
    }
    async createRefreshToken(userId, token, expiresAt) {
        const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [userId, token, expiresAt]);
        return result.rows[0];
    }
    async findByToken(token) {
        const sql = `
      SELECT * FROM refresh_tokens 
      WHERE token = $1 AND expires_at > NOW()
    `;
        const result = await this.executeQuery(sql, [token]);
        return result.rows[0] || null;
    }
    async findByUserAndToken(userId, token) {
        const sql = `
      SELECT * FROM refresh_tokens 
      WHERE user_id = $1 AND token = $2 AND expires_at > NOW()
    `;
        const result = await this.executeQuery(sql, [userId, token]);
        return result.rows[0] || null;
    }
    async deleteToken(token) {
        const sql = 'DELETE FROM refresh_tokens WHERE token = $1';
        const result = await this.executeQuery(sql, [token]);
        return (result.rowCount || 0) > 0;
    }
    async deleteAllUserTokens(userId) {
        const sql = 'DELETE FROM refresh_tokens WHERE user_id = $1';
        const result = await this.executeQuery(sql, [userId]);
        return result.rowCount || 0;
    }
    async deleteExpiredTokens() {
        const sql = 'DELETE FROM refresh_tokens WHERE expires_at <= NOW()';
        const result = await this.executeQuery(sql);
        return result.rowCount || 0;
    }
    async getUserTokenCount(userId) {
        const sql = `
      SELECT COUNT(*) as count 
      FROM refresh_tokens 
      WHERE user_id = $1 AND expires_at > NOW()
    `;
        const result = await this.executeQuery(sql, [userId]);
        return parseInt(result.rows[0].count);
    }
    async limitUserTokens(userId, maxTokens = 5) {
        const sql = `
      DELETE FROM refresh_tokens 
      WHERE user_id = $1 
        AND id NOT IN (
          SELECT id FROM refresh_tokens 
          WHERE user_id = $1 AND expires_at > NOW()
          ORDER BY created_at DESC 
          LIMIT $2
        )
    `;
        await this.executeQuery(sql, [userId, maxTokens]);
    }
}
exports.RefreshTokenModel = RefreshTokenModel;
//# sourceMappingURL=RefreshTokenModel.js.map