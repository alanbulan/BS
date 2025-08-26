import { BaseModel } from './BaseModel';
import { DisasterType } from '../types';

export class DisasterTypeModel extends BaseModel {
  constructor() {
    super('disaster_types');
  }

  /**
   * 创建灾害类型
   */
  async createDisasterType(data: Omit<DisasterType, 'id' | 'created_at'>): Promise<DisasterType> {
    const fields = Object.keys(data);
    const values = fields.map(key => data[key as keyof typeof data]);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO disaster_types (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return result.rows[0];
  }

  /**
   * 根据名称查找灾害类型
   */
  async findByName(name: string): Promise<DisasterType | null> {
    const sql = 'SELECT * FROM disaster_types WHERE name = $1';
    const result = await this.executeQuery(sql, [name]);
    return result.rows[0] || null;
  }

  /**
   * 获取所有激活的灾害类型
   */
  async getActiveTypes(): Promise<DisasterType[]> {
    const sql = `
      SELECT * FROM disaster_types 
      WHERE is_active = true 
      ORDER BY base_risk_level DESC, name
    `;
    const result = await this.executeQuery(sql);
    return result.rows;
  }

  /**
   * 根据风险等级获取灾害类型
   */
  async getByRiskLevel(riskLevel: number): Promise<DisasterType[]> {
    const sql = `
      SELECT * FROM disaster_types 
      WHERE base_risk_level = $1 AND is_active = true
      ORDER BY name
    `;
    const result = await this.executeQuery(sql, [riskLevel]);
    return result.rows;
  }

  /**
   * 更新灾害类型
   */
  async updateDisasterType(id: number, data: Partial<DisasterType>): Promise<DisasterType | null> {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
    const values = fields.map(key => data[key as keyof DisasterType]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const sql = `
      UPDATE disaster_types 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * 切换激活状态
   */
  async toggleActive(id: number, isActive: boolean): Promise<DisasterType | null> {
    const sql = `
      UPDATE disaster_types 
      SET is_active = $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [id, isActive]);
    return result.rows[0] || null;
  }

  /**
   * 检查名称是否存在
   */
  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM disaster_types WHERE name = $1';
    const params = [name];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId.toString());
    }

    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  /**
   * 获取灾害类型统计
   */
  async getTypeStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_types,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_types,
        COUNT(CASE WHEN base_risk_level >= 4 THEN 1 END) as high_risk_types,
        AVG(base_risk_level) as avg_risk_level
      FROM disaster_types
    `;

    const result = await this.executeQuery(sql);
    return result.rows[0];
  }

  /**
   * 检查灾害类型是否被其他表引用
   */
  async checkReferences(disasterTypeId: number): Promise<{ hasReferences: boolean; referencedTables: string[] }> {
    const checks = [
      { table: 'risk_zones', sql: 'SELECT COUNT(*) as count FROM risk_zones WHERE disaster_type_id = $1' },
      { table: 'user_reports', sql: 'SELECT COUNT(*) as count FROM user_reports WHERE disaster_type_id = $1' }
    ];
    
    const referencedTables: string[] = [];
    
    for (const check of checks) {
      const result = await this.executeQuery(check.sql, [disasterTypeId]);
      if (parseInt(result.rows[0].count) > 0) {
        referencedTables.push(check.table);
      }
    }
    
    return {
      hasReferences: referencedTables.length > 0,
      referencedTables
    };
  }

  /**
   * 检查灾害类型是否被风险区域引用（保持向后兼容）
   */
  async checkRiskZoneReferences(disasterTypeId: number): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM risk_zones WHERE disaster_type_id = $1';
    const result = await this.executeQuery(sql, [disasterTypeId]);
    return parseInt(result.rows[0].count) > 0;
  }
}