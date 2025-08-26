import { BaseModel } from './BaseModel';

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class RefreshTokenModel extends BaseModel {
  constructor() {
    super('refresh_tokens');
  }

  /**
   * 创建刷新Token记录
   */
  async createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<RefreshToken> {
    const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, [userId, token, expiresAt]);
    return result.rows[0];
  }

  /**
   * 根据Token查找记录
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const sql = `
      SELECT * FROM refresh_tokens 
      WHERE token = $1 AND expires_at > NOW()
    `;
    
    const result = await this.executeQuery(sql, [token]);
    return result.rows[0] || null;
  }

  /**
   * 根据用户ID和Token查找记录
   */
  async findByUserAndToken(userId: number, token: string): Promise<RefreshToken | null> {
    const sql = `
      SELECT * FROM refresh_tokens 
      WHERE user_id = $1 AND token = $2 AND expires_at > NOW()
    `;
    
    const result = await this.executeQuery(sql, [userId, token]);
    return result.rows[0] || null;
  }

  /**
   * 删除指定Token
   */
  async deleteToken(token: string): Promise<boolean> {
    const sql = 'DELETE FROM refresh_tokens WHERE token = $1';
    const result = await this.executeQuery(sql, [token]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * 删除用户所有Token
   */
  async deleteAllUserTokens(userId: number): Promise<number> {
    const sql = 'DELETE FROM refresh_tokens WHERE user_id = $1';
    const result = await this.executeQuery(sql, [userId]);
    return result.rowCount || 0;
  }

  /**
   * 删除过期Token
   */
  async deleteExpiredTokens(): Promise<number> {
    const sql = 'DELETE FROM refresh_tokens WHERE expires_at <= NOW()';
    const result = await this.executeQuery(sql);
    return result.rowCount || 0;
  }

  /**
   * 获取用户Token数量
   */
  async getUserTokenCount(userId: number): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM refresh_tokens 
      WHERE user_id = $1 AND expires_at > NOW()
    `;
    
    const result = await this.executeQuery(sql, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * 限制用户Token数量（删除最旧的Token）
   */
  async limitUserTokens(userId: number, maxTokens: number = 5): Promise<void> {
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