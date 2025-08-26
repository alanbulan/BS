import { BaseModel } from './BaseModel';

export interface SystemConfig {
  id: number;
  config_key: string;
  config_value: any;
  category: string;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSystemConfigData {
  config_key: string;
  config_value: any;
  category: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateSystemConfigData {
  config_value?: any;
  category?: string;
  description?: string;
  is_public?: boolean;
}

export interface SystemConfigQuery {
  category?: string;
  is_public?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class SystemConfigModel extends BaseModel {
  constructor() {
    super('system_config');
  }

  /**
   * 创建系统配置
   */
  async create(data: CreateSystemConfigData): Promise<SystemConfig> {
    const query = `
      INSERT INTO system_config (
        config_key, config_value, category, description, is_public
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.config_key,
      JSON.stringify(data.config_value),
      data.category,
      data.description,
      data.is_public !== undefined ? data.is_public : false
    ];

    const result = await this.executeQuery(query, values);
    const row = result.rows[0];
    
    // 解析JSON值
    if (row.config_value) {
      try {
        row.config_value = JSON.parse(row.config_value);
      } catch (e) {
        // 如果解析失败，保持原值
      }
    }
    
    return row as SystemConfig;
  }

  /**
   * 根据配置键获取配置
   */
  async getByKey(configKey: string): Promise<SystemConfig | null> {
    const query = `
      SELECT * FROM system_config
      WHERE config_key = $1
    `;

    const result = await this.executeQuery(query, [configKey]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // 解析JSON值
    if (row.config_value) {
      try {
        row.config_value = JSON.parse(row.config_value);
      } catch (e) {
        // 如果解析失败，保持原值
      }
    }
    
    return row as SystemConfig;
  }

  /**
   * 根据配置键获取配置值
   */
  async getValue(configKey: string, defaultValue?: any): Promise<any> {
    const config = await this.getByKey(configKey);
    return config ? config.config_value : defaultValue;
  }

  /**
   * 根据条件查询配置
   */
  async findWithConditions(conditions: SystemConfigQuery): Promise<{
    configs: SystemConfig[];
    total: number;
  }> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (conditions.category) {
      whereClause += ` AND category = $${paramIndex}`;
      values.push(conditions.category);
      paramIndex++;
    }

    if (conditions.is_public !== undefined) {
      whereClause += ` AND is_public = $${paramIndex}`;
      values.push(conditions.is_public);
      paramIndex++;
    }

    if (conditions.search) {
      whereClause += ` AND (config_key ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${conditions.search}%`);
      paramIndex++;
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM system_config ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // 获取数据
    let dataQuery = `
      SELECT * FROM system_config
      ${whereClause}
      ORDER BY category, config_key
    `;

    if (conditions.limit) {
      dataQuery += ` LIMIT $${paramIndex}`;
      values.push(conditions.limit);
      paramIndex++;
    }

    if (conditions.offset) {
      dataQuery += ` OFFSET $${paramIndex}`;
      values.push(conditions.offset);
    }

    const result = await this.executeQuery(dataQuery, values);
    const configs = result.rows.map((row: any) => {
      // 解析JSON值
      if (row.config_value) {
        try {
          row.config_value = JSON.parse(row.config_value);
        } catch (e) {
          // 如果解析失败，保持原值
        }
      }
      return row;
    }) as SystemConfig[];

    return { configs, total };
  }

  /**
   * 根据配置类型获取所有配置
   */
  async getByType(configType: string): Promise<SystemConfig[]> {
    const query = `
      SELECT * FROM system_config
      WHERE category = $1
      ORDER BY config_key
    `;

    const result = await this.executeQuery(query, [configType]);
    
    return result.rows.map((row: any) => {
      // 解析JSON值
      if (row.config_value) {
        try {
          row.config_value = JSON.parse(row.config_value);
        } catch (e) {
          // 如果解析失败，保持原值
        }
      }
      return row;
    }) as SystemConfig[];
  }

  /**
   * 更新配置
   */
  async updateByKey(configKey: string, data: UpdateSystemConfigData): Promise<SystemConfig | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'config_value') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    const query = `
      UPDATE system_config
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = $${paramIndex}
      RETURNING *
    `;

    values.push(configKey);
    const result = await this.executeQuery(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // 解析JSON值
    if (row.config_value) {
      try {
        row.config_value = JSON.parse(row.config_value);
      } catch (e) {
        // 如果解析失败，保持原值
      }
    }
    
    return row as SystemConfig;
  }

  /**
   * 设置配置值
   */
  async setValue(configKey: string, value: any, category: string = 'general'): Promise<SystemConfig> {
    // 先尝试更新
    const existing = await this.getByKey(configKey);
    
    if (existing) {
      const updated = await this.updateByKey(configKey, { config_value: value });
      return updated!;
    } else {
      // 如果不存在则创建
      return await this.create({
        config_key: configKey,
        config_value: value,
        category: category
      });
    }
  }

  /**
   * 批量设置配置
   */
  async setBatch(configs: Array<{
    key: string;
    value: any;
    category?: string;
    description?: string;
  }>): Promise<SystemConfig[]> {
    const results: SystemConfig[] = [];
    
    for (const config of configs) {
      const result = await this.setValue(
        config.key,
        config.value,
        config.category || 'general'
      );
      
      // 如果有描述，更新描述
      if (config.description && result) {
        const updated = await this.updateByKey(config.key, {
          description: config.description
        });
        results.push(updated || result);
      } else {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * 删除配置
   */
  async deleteByKey(configKey: string): Promise<boolean> {
    const query = `DELETE FROM system_config WHERE config_key = $1`;
    const result = await this.executeQuery(query, [configKey]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * 物理删除配置
   */
  async hardDeleteByKey(configKey: string): Promise<boolean> {
    const query = `DELETE FROM system_config WHERE config_key = $1`;
    const result = await this.executeQuery(query, [configKey]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * 获取所有配置类型
   */
  async getConfigTypes(): Promise<string[]> {
    const query = `
      SELECT DISTINCT category
      FROM system_config
      ORDER BY category
    `;

    const result = await this.executeQuery(query);
    return result.rows.map(row => row.category);
  }

  /**
   * 获取配置统计信息
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const queries = [
      'SELECT COUNT(*) as total FROM system_config',
      'SELECT COUNT(*) as active FROM system_config WHERE is_public = true',
      'SELECT category, COUNT(*) as count FROM system_config GROUP BY category'
    ];

    const [totalResult, activeResult, typeResult] = await Promise.all(
      queries.map(query => this.executeQuery(query))
    );

    const byType: Record<string, number> = {};
    typeResult.rows.forEach(row => {
      byType[row.category] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      active: parseInt(activeResult.rows[0].active),
      byType
    };
  }

  /**
   * 导出配置
   */
  async exportConfigs(category?: string): Promise<SystemConfig[]> {
    let query = `
      SELECT * FROM system_config
      WHERE is_public = true
    `;
    const values: any[] = [];

    if (category) {
      query += ' AND category = $1';
      values.push(category);
    }

    query += ' ORDER BY category, config_key';

    const result = await this.executeQuery(query, values);
    
    return result.rows.map((row: any) => {
      // 解析JSON值
      if (row.config_value) {
        try {
          row.config_value = JSON.parse(row.config_value);
        } catch (e) {
          // 如果解析失败，保持原值
        }
      }
      return row;
    }) as SystemConfig[];
  }

  /**
   * 导入配置
   */
  async importConfigs(configs: Array<{
    config_key: string;
    config_value: any;
    category: string;
    description?: string;
  }>, overwrite: boolean = false): Promise<{
    created: number;
    updated: number;
    skipped: number;
  }> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const config of configs) {
      const existing = await this.getByKey(config.config_key);
      
      if (existing) {
        if (overwrite) {
          await this.updateByKey(config.config_key, {
            config_value: config.config_value,
            category: config.category,
            description: config.description
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await this.create({
          config_key: config.config_key,
          config_value: config.config_value,
          category: config.category,
          description: config.description
        });
        created++;
      }
    }

    return { created, updated, skipped };
  }
}