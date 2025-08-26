import { pool } from '../config/database';
import { QueryResult } from '../types';

export abstract class BaseModel {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // 执行查询的通用方法
  protected async executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      const result = await pool.query(sql, params);
      return result;
    } catch (error) {
      console.error(`数据库查询错误 [${this.tableName}]:`, error);
      throw error;
    }
  }

  // 根据ID查找记录
  async findById(id: number): Promise<any> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0] || null;
  }

  // 查找所有记录
  async findAll(limit: number = 100, offset: number = 0): Promise<any[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY id LIMIT $1 OFFSET $2`;
    const result = await this.executeQuery(sql, [limit, offset]);
    return result.rows;
  }

  // 根据条件查找记录
  async findWhere(conditions: Record<string, any>): Promise<any[]> {
    const keys = Object.keys(conditions);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const values = keys.map(key => conditions[key]);
    
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const result = await this.executeQuery(sql, values);
    return result.rows;
  }

  // 根据条件查找单条记录
  async findOneWhere(conditions: Record<string, any>): Promise<any> {
    const records = await this.findWhere(conditions);
    return records[0] || null;
  }

  // 创建记录
  async create(data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key]);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, values);
    return result.rows[0];
  }

  // 更新记录
  async update(id: number, data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key]);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, [id, ...values]);
    return result.rows[0] || null;
  }

  // 删除记录
  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  // 软删除（如果表有is_active字段）
  async softDelete(id: number): Promise<any> {
    const sql = `
      UPDATE ${this.tableName} 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0] || null;
  }

  // 统计记录数量
  async count(conditions?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let params: any[] = [];
    
    if (conditions) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      params = keys.map(key => conditions[key]);
      sql += ` WHERE ${whereClause}`;
    }
    
    const result = await this.executeQuery(sql, params);
    return parseInt(result.rows[0].count);
  }

  // 检查记录是否存在
  async exists(id: number): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows.length > 0;
  }

  // 分页查询
  async paginate(page: number = 1, limit: number = 10, conditions?: Record<string, any>): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = '';
    let params: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      whereClause = ' WHERE ' + keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      params = keys.map(key => conditions[key]);
    }
    
    // 查询数据
    const dataSql = `SELECT * FROM ${this.tableName}${whereClause} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataResult = await this.executeQuery(dataSql, [...params, limit, offset]);
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause}`;
    const countResult = await this.executeQuery(countSql, params);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 批量插入
  async batchInsert(dataArray: Record<string, any>[]): Promise<any[]> {
    if (dataArray.length === 0) return [];
    
    const keys = Object.keys(dataArray[0]);
    const values = dataArray.map((data, index) => {
      const baseIndex = index * keys.length;
      return `(${keys.map((_, keyIndex) => `$${baseIndex + keyIndex + 1}`).join(', ')})`;
    }).join(', ');
    
    const params = dataArray.flatMap(data => keys.map(key => data[key]));
    
    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES ${values}
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, params);
    return result.rows;
  }

  // 执行原生SQL查询
  async rawQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    return this.executeQuery(sql, params);
  }
}