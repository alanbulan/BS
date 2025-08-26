"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigModel = void 0;
const BaseModel_1 = require("./BaseModel");
class SystemConfigModel extends BaseModel_1.BaseModel {
    constructor() {
        super('system_config');
    }
    async create(data) {
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
        if (row.config_value) {
            try {
                row.config_value = JSON.parse(row.config_value);
            }
            catch (e) {
            }
        }
        return row;
    }
    async getByKey(configKey) {
        const query = `
      SELECT * FROM system_config
      WHERE config_key = $1
    `;
        const result = await this.executeQuery(query, [configKey]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        if (row.config_value) {
            try {
                row.config_value = JSON.parse(row.config_value);
            }
            catch (e) {
            }
        }
        return row;
    }
    async getValue(configKey, defaultValue) {
        const config = await this.getByKey(configKey);
        return config ? config.config_value : defaultValue;
    }
    async findWithConditions(conditions) {
        let whereClause = 'WHERE 1=1';
        const values = [];
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
        const countQuery = `SELECT COUNT(*) FROM system_config ${whereClause}`;
        const countResult = await this.executeQuery(countQuery, values);
        const total = parseInt(countResult.rows[0].count);
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
        const configs = result.rows.map((row) => {
            if (row.config_value) {
                try {
                    row.config_value = JSON.parse(row.config_value);
                }
                catch (e) {
                }
            }
            return row;
        });
        return { configs, total };
    }
    async getByType(configType) {
        const query = `
      SELECT * FROM system_config
      WHERE category = $1
      ORDER BY config_key
    `;
        const result = await this.executeQuery(query, [configType]);
        return result.rows.map((row) => {
            if (row.config_value) {
                try {
                    row.config_value = JSON.parse(row.config_value);
                }
                catch (e) {
                }
            }
            return row;
        });
    }
    async updateByKey(configKey, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'config_value') {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(JSON.stringify(value));
                }
                else {
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
        if (row.config_value) {
            try {
                row.config_value = JSON.parse(row.config_value);
            }
            catch (e) {
            }
        }
        return row;
    }
    async setValue(configKey, value, category = 'general') {
        const existing = await this.getByKey(configKey);
        if (existing) {
            const updated = await this.updateByKey(configKey, { config_value: value });
            return updated;
        }
        else {
            return await this.create({
                config_key: configKey,
                config_value: value,
                category: category
            });
        }
    }
    async setBatch(configs) {
        const results = [];
        for (const config of configs) {
            const result = await this.setValue(config.key, config.value, config.category || 'general');
            if (config.description && result) {
                const updated = await this.updateByKey(config.key, {
                    description: config.description
                });
                results.push(updated || result);
            }
            else {
                results.push(result);
            }
        }
        return results;
    }
    async deleteByKey(configKey) {
        const query = `DELETE FROM system_config WHERE config_key = $1`;
        const result = await this.executeQuery(query, [configKey]);
        return (result.rowCount || 0) > 0;
    }
    async hardDeleteByKey(configKey) {
        const query = `DELETE FROM system_config WHERE config_key = $1`;
        const result = await this.executeQuery(query, [configKey]);
        return (result.rowCount || 0) > 0;
    }
    async getConfigTypes() {
        const query = `
      SELECT DISTINCT category
      FROM system_config
      ORDER BY category
    `;
        const result = await this.executeQuery(query);
        return result.rows.map(row => row.category);
    }
    async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM system_config',
            'SELECT COUNT(*) as active FROM system_config WHERE is_public = true',
            'SELECT category, COUNT(*) as count FROM system_config GROUP BY category'
        ];
        const [totalResult, activeResult, typeResult] = await Promise.all(queries.map(query => this.executeQuery(query)));
        const byType = {};
        typeResult.rows.forEach(row => {
            byType[row.category] = parseInt(row.count);
        });
        return {
            total: parseInt(totalResult.rows[0].total),
            active: parseInt(activeResult.rows[0].active),
            byType
        };
    }
    async exportConfigs(category) {
        let query = `
      SELECT * FROM system_config
      WHERE is_public = true
    `;
        const values = [];
        if (category) {
            query += ' AND category = $1';
            values.push(category);
        }
        query += ' ORDER BY category, config_key';
        const result = await this.executeQuery(query, values);
        return result.rows.map((row) => {
            if (row.config_value) {
                try {
                    row.config_value = JSON.parse(row.config_value);
                }
                catch (e) {
                }
            }
            return row;
        });
    }
    async importConfigs(configs, overwrite = false) {
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
                }
                else {
                    skipped++;
                }
            }
            else {
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
exports.SystemConfigModel = SystemConfigModel;
//# sourceMappingURL=SystemConfigModel.js.map