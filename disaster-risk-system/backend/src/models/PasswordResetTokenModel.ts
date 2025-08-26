import { BaseModel } from './BaseModel';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export class PasswordResetTokenModel extends BaseModel {
  constructor() {
    super('password_reset_tokens');
  }

  /**
   * 创建密码重置Token
   */
  async createResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const sql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, [userId, token, expiresAt]);
    return result.rows[0];
  }

  /**
   * 根据Token查找记录
   */
  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const sql = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND used = false AND expires_at > NOW()
    `;
    
    const result = await this.executeQuery(sql, [token]);
    return result.rows[0] || null;
  }

  /**
   * 标记Token为已使用
   */
  async markAsUsed(tokenId: number): Promise<boolean> {
    const sql = `
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE id = $1
    `;
    
    const result = await this.executeQuery(sql, [tokenId]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * 删除用户所有重置Token
   */
  async deleteUserTokens(userId: number): Promise<number> {
    const sql = 'DELETE FROM password_reset_tokens WHERE user_id = $1';
    const result = await this.executeQuery(sql, [userId]);
    return result.rowCount || 0;
  }

  /**
   * 删除过期Token
   */
  async deleteExpiredTokens(): Promise<number> {
    const sql = 'DELETE FROM password_reset_tokens WHERE expires_at <= NOW()';
    const result = await this.executeQuery(sql);
    return result.rowCount || 0;
  }

  /**
   * 获取用户未使用的Token数量
   */
  async getUserActiveTokenCount(userId: number): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM password_reset_tokens 
      WHERE user_id = $1 AND used = false AND expires_at > NOW()
    `;
    
    const result = await this.executeQuery(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
}